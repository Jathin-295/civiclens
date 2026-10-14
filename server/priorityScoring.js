/**
 * Explainable Civic Priority Scoring Engine
 *
 * Deterministic formula based on 4 documented dimensions:
 * 1. Base Severity (Max 40 pts)
 * 2. Safety & Vulnerability Impact (Max 25 pts)
 * 3. Recurrence & Proximity Density (Max 20 pts)
 * 4. Available Supporting Evidence (Max 15 pts)
 * Total Score: 0 to 100 points.
 *
 * NOTE: Deterministic priority rules are strictly separated from AI suggestions.
 */

const HIGH_SAFETY_IMPACT_CATEGORIES = [
  'missing_curb_ramp',
  'missing_crosswalk',
  'steep_slope',
  'temporary_construction',
];

const MODERATE_SAFETY_IMPACT_CATEGORIES = [
  'broken_sidewalk',
  'uneven_surface',
  'obstructed_path',
  'narrow_passage',
];

export function calculateExplainablePriority(issue, recurrenceCount = 0) {
  const breakdown = [];
  let totalScore = 0;

  // 1. Base Severity (0 - 40 pts)
  const severity = (issue.severity || 'moderate').toLowerCase();
  let severityPts = 20;
  let severityReason = 'Moderate physical defect';

  if (severity === 'critical') {
    severityPts = 40;
    severityReason = 'Critical infrastructure blockage or safety emergency';
  } else if (severity === 'high') {
    severityPts = 30;
    severityReason = 'High severity impediment causing route detour or fall hazard';
  } else if (severity === 'low') {
    severityPts = 10;
    severityReason = 'Minor cosmetic or low-risk surface irregularity';
  }

  breakdown.push({
    factor: 'Base Severity',
    points: severityPts,
    max: 40,
    reason: severityReason,
  });
  totalScore += severityPts;

  // 2. Safety & Vulnerability Impact (0 - 25 pts)
  const category = (issue.category || 'other').toLowerCase();
  let impactPts = 12;
  let impactReason = 'Environmental or sensory accessibility impediment';

  if (HIGH_SAFETY_IMPACT_CATEGORIES.includes(category)) {
    impactPts = 25;
    impactReason = 'High vulnerability: forces wheelchair/cane navigators into motorized vehicle lanes';
  } else if (MODERATE_SAFETY_IMPACT_CATEGORIES.includes(category)) {
    impactPts = 18;
    impactReason = 'Impedes wheeled mobility aids and presents severe trip edge';
  }

  breakdown.push({
    factor: 'Safety & Mobility Impact',
    points: impactPts,
    max: 25,
    reason: impactReason,
  });
  totalScore += impactPts;

  // 3. Recurrence & Cluster Density (0 - 20 pts)
  let recurrencePts = 5;
  let recurrenceReason = 'First logged incident at this location';

  if (recurrenceCount >= 3) {
    recurrencePts = 20;
    recurrenceReason = `High civic recurrence: ${recurrenceCount} linked reports or nearby clusters in corridor`;
  } else if (recurrenceCount >= 1) {
    recurrencePts = 12;
    recurrenceReason = `Confirmed recurring issue: ${recurrenceCount} related community report(s)`;
  }

  breakdown.push({
    factor: 'Recurrence & Area Density',
    points: recurrencePts,
    max: 20,
    reason: recurrenceReason,
  });
  totalScore += recurrencePts;

  // 4. Evidence Reliability (0 - 15 pts)
  let evidencePts = 0;
  const hasPhoto = Boolean(issue.imageUrl && issue.imageUrl.length > 20);
  const isDetailed = Boolean(issue.description && issue.description.trim().length >= 50);

  if (hasPhoto) evidencePts += 10;
  if (isDetailed) evidencePts += 5;

  breakdown.push({
    factor: 'Evidence Reliability',
    points: evidencePts,
    max: 15,
    reason: `${hasPhoto ? 'Photo evidence provided (+10)' : 'No photo (-10)'}; ${
      isDetailed ? 'Detailed field description (+5)' : 'Brief description (0)'
    }`,
  });
  totalScore += evidencePts;

  // Bound score between 0 and 100
  totalScore = Math.min(100, Math.max(0, totalScore));

  let priorityLevel = 'moderate';
  if (totalScore >= 80) priorityLevel = 'critical';
  else if (totalScore >= 60) priorityLevel = 'high';
  else if (totalScore < 40) priorityLevel = 'low';

  return {
    totalScore,
    priorityLevel,
    breakdown,
    scoringRulesReference: 'CivicLens Deterministic Triage Rulebook v2.1',
    isDeterministic: true,
  };
}
