/**
 * Intelligent Civic Duplicate Detection Engine
 *
 * Compares reports using:
 * 1. Normalized text token similarity & keyword overlap
 * 2. Category matching & hierarchical equivalence
 * 3. Geographic distance (Haversine formula in meters)
 *
 * Never silently deletes or merges reports.
 */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'at', 'in', 'on', 'of', 'and', 'to', 'for', 'with', 'from',
  'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out',
  'against', 'during', 'without', 'before', 'under', 'around', 'among', 'this', 'that',
  'these', 'those', 'it', 'its', 'be', 'are', 'was', 'were', 'has', 'have', 'had',
  'very', 'near', 'along', 'there', 'here',
]);

const RELATED_CATEGORIES = {
  broken_sidewalk: ['uneven_surface', 'steep_slope'],
  uneven_surface: ['broken_sidewalk', 'steep_slope'],
  missing_curb_ramp: ['missing_crosswalk', 'steep_slope'],
  missing_crosswalk: ['missing_curb_ramp'],
  obstructed_path: ['narrow_passage', 'temporary_construction'],
  narrow_passage: ['obstructed_path'],
  no_tactile_paving: ['missing_crosswalk'],
};

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null
  ) {
    return null;
  }

  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Normalizes text into cleaned array of significant tokens
 */
export function tokenizeText(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Jaccard token similarity (0.0 to 1.0)
 */
export function calculateJaccardSimilarity(tokens1, tokens2) {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersection = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      intersection++;
    }
  }

  const union = new Set([...set1, ...set2]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Finds shared keywords between two token lists
 */
export function getSharedKeywords(tokens1, tokens2) {
  const set2 = new Set(tokens2);
  const shared = new Set();
  for (const t of tokens1) {
    if (set2.has(t)) {
      shared.add(t);
    }
  }
  return Array.from(shared);
}

/**
 * Checks a candidate report against an array of existing reports
 *
 * @param {Object} candidate - { title, description, category, address, lat, lng }
 * @param {Array} existingReports - Array of existing reports
 * @param {Object} options - { threshold: 35, includeResolved: false }
 */
export function detectDuplicates(candidate, existingReports = [], options = {}) {
  const threshold = options.threshold ?? 35;
  const includeResolved = options.includeResolved ?? false;

  const candidateTokens = tokenizeText(`${candidate.title || ''} ${candidate.description || ''}`);
  const candidateAddressTokens = tokenizeText(candidate.address || '');
  const candidateCat = (candidate.category || '').toLowerCase();
  const candidateLat = candidate.lat;
  const candidateLng = candidate.lng;

  const matches = [];

  for (const existing of existingReports) {
    // If candidate has an ID, skip matching against itself
    if (candidate.id && existing.id === candidate.id) {
      continue;
    }

    const isResolved = existing.status === 'resolved';
    if (isResolved && !includeResolved) {
      continue;
    }

    const existingTokens = tokenizeText(`${existing.title || ''} ${existing.description || ''}`);
    const existingCat = (existing.category || '').toLowerCase();
    const existingLat = existing.location?.lat ?? existing.lat;
    const existingLng = existing.location?.lng ?? existing.lng;

    // 1. Text Similarity (0 - 100)
    const textJaccard = calculateJaccardSimilarity(candidateTokens, existingTokens);
    const sharedWords = getSharedKeywords(candidateTokens, existingTokens);

    // 2. Category Similarity (0 - 100)
    let categoryScore = 0;
    let categoryEvidence = '';
    if (candidateCat && existingCat) {
      if (candidateCat === existingCat) {
        categoryScore = 1.0;
        categoryEvidence = `Same barrier category: ${candidateCat.replace(/_/g, ' ')}`;
      } else if (
        RELATED_CATEGORIES[candidateCat]?.includes(existingCat) ||
        RELATED_CATEGORIES[existingCat]?.includes(candidateCat)
      ) {
        categoryScore = 0.65;
        categoryEvidence = `Related barrier category: ${candidateCat.replace(/_/g, ' ')} / ${existingCat.replace(/_/g, ' ')}`;
      }
    }

    // 3. Geographic Distance Similarity
    const distanceMeters = calculateDistanceMeters(
      candidateLat,
      candidateLng,
      existingLat,
      existingLng
    );

    let distanceScore = 0;
    let distanceEvidence = '';
    const hasCoordinates = distanceMeters !== null;

    if (hasCoordinates) {
      if (distanceMeters <= 25) {
        distanceScore = 1.0;
        distanceEvidence = `Immediate vicinity: ${distanceMeters}m away`;
      } else if (distanceMeters <= 60) {
        distanceScore = 0.85;
        distanceEvidence = `Close corridor proximity: ${distanceMeters}m away`;
      } else if (distanceMeters <= 150) {
        distanceScore = 0.65;
        distanceEvidence = `Within same block corridor: ${distanceMeters}m away`;
      } else if (distanceMeters <= 300) {
        distanceScore = 0.35;
        distanceEvidence = `Nearby block: ${distanceMeters}m away`;
      } else {
        distanceScore = Math.max(0, 1 - distanceMeters / 1000);
        distanceEvidence = `Distant location: ${distanceMeters}m away`;
      }
    } else {
      // Fallback: check address string overlap
      const existingAddressTokens = tokenizeText(
        existing.location?.address || existing.address || ''
      );
      const addressJaccard = calculateJaccardSimilarity(
        candidateAddressTokens,
        existingAddressTokens
      );
      distanceScore = addressJaccard;
      if (addressJaccard > 0.4) {
        distanceEvidence = 'Matching street/landmark address text';
      }
    }

    // 4. Weighted Aggregate Score (0 - 100)
    let aggregateScore = 0;
    if (hasCoordinates) {
      aggregateScore = Math.round(
        (textJaccard * 0.4 + categoryScore * 0.25 + distanceScore * 0.35) * 100
      );
    } else {
      aggregateScore = Math.round((textJaccard * 0.6 + categoryScore * 0.4) * 100);
    }

    // Assemble structured matching evidence
    const matchingEvidence = [];
    if (categoryEvidence) matchingEvidence.push(categoryEvidence);
    if (distanceEvidence) matchingEvidence.push(distanceEvidence);
    if (sharedWords.length > 0) {
      matchingEvidence.push(
        `Shared keywords (${sharedWords.length}): ${sharedWords.slice(0, 6).join(', ')}`
      );
    }
    if (textJaccard >= 0.5) {
      matchingEvidence.push(`High textual similarity (${Math.round(textJaccard * 100)}% token overlap)`);
    }

    if (aggregateScore >= threshold) {
      matches.push({
        existingReportId: existing.id,
        existingTitle: existing.title,
        similarityScore: aggregateScore,
        matchingEvidence,
        location: {
          address: existing.location?.address || existing.address || 'Address unlisted',
          distanceMeters: distanceMeters ?? undefined,
        },
        currentStatus: existing.status || 'pending',
        isResolved,
      });
    }
  }

  // Sort descending by similarity
  matches.sort((a, b) => b.similarityScore - a.similarityScore);
  return matches;
}
