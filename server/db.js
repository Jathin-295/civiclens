import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateExplainablePriority } from './priorityScoring.js';
import { getRecommendedTeam } from './teamMapping.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? path.join('/tmp', 'civiclens-data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'issues.json');

// Ensure data directory exists safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Silent fallback to in-memory on restricted environments
}

let inMemoryIssuesCache = null;

export const INITIAL_SEED_ISSUES = [
  {
    id: 'iss-101',
    title: 'Displaced Concrete Slab with 10cm Lip',
    description: 'Severe vertical crack with 10cm displacement making it impassable for manual wheelchairs and hazardous for white cane navigators.',
    category: 'broken_sidewalk',
    severity: 'high',
    status: 'verified',
    priorityScore: 78,
    priorityLevel: 'high',
    assignedTeam: 'Road & Footpath Maintenance Wing (GHMC Engineering)',
    location: {
      lat: 17.4468,
      lng: 78.3786,
      address: 'Cyber Towers Circle, Hitec City Road, Hyderabad',
    },
    reportedBy: 'Priya M. (Civic Lead)',
    reportedAt: '2026-10-10T09:30:00Z',
    updatedAt: '2026-10-12T14:20:00Z',
    upvotes: 28,
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    isSampleData: true,
    activityLog: [
      {
        id: 'act-101-1',
        timestamp: '2026-10-10T09:30:00Z',
        action: 'created',
        actor: 'Priya M. (Civic Lead)',
        details: 'Report filed with photo evidence.',
      },
      {
        id: 'act-101-2',
        timestamp: '2026-10-11T11:15:00Z',
        action: 'team_assigned',
        actor: 'Civic Dispatch Triage',
        details: 'Assigned to Road & Footpath Maintenance Wing (GHMC Engineering).',
        newValue: 'Road & Footpath Maintenance Wing (GHMC Engineering)',
      },
      {
        id: 'act-101-3',
        timestamp: '2026-10-12T14:20:00Z',
        action: 'status_changed',
        actor: 'Area Inspector Rajesh S.',
        details: 'Ground truth confirmed; marked as Reviewed & Verified.',
        previousValue: 'pending',
        newValue: 'verified',
      },
    ],
  },
  {
    id: 'iss-102',
    title: 'Missing Curb Ramp at Busy Transit Crossing',
    description: 'Direct 15cm vertical step-down without a dropped kerb at the primary junction. Wheelchairs forced onto motorized traffic lane.',
    category: 'missing_curb_ramp',
    severity: 'critical',
    status: 'in_progress',
    priorityScore: 92,
    priorityLevel: 'critical',
    assignedTeam: 'Pedestrian Infrastructure & Accessibility Cell',
    location: {
      lat: 17.4415,
      lng: 78.3735,
      address: 'Raidurg Metro Feeder Road Crossing, Hyderabad',
    },
    reportedBy: 'Ravi K. (Disability Advocate)',
    reportedAt: '2026-10-08T11:15:00Z',
    updatedAt: '2026-10-13T10:00:00Z',
    upvotes: 53,
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    isSampleData: true,
    activityLog: [
      {
        id: 'act-102-1',
        timestamp: '2026-10-08T11:15:00Z',
        action: 'created',
        actor: 'Ravi K. (Disability Advocate)',
        details: 'Report submitted citing critical pedestrian safety danger.',
      },
      {
        id: 'act-102-2',
        timestamp: '2026-10-09T08:00:00Z',
        action: 'team_assigned',
        actor: 'Triage System',
        details: 'Assigned to Pedestrian Infrastructure & Accessibility Cell.',
        newValue: 'Pedestrian Infrastructure & Accessibility Cell',
      },
      {
        id: 'act-102-3',
        timestamp: '2026-10-13T10:00:00Z',
        action: 'status_changed',
        actor: 'Municipal Engineer Sneha V.',
        details: 'Civil work order generated; marked In Progress.',
        previousValue: 'verified',
        newValue: 'in_progress',
      },
    ],
  },
  {
    id: 'iss-103',
    title: 'Commercial Vendor Sidewalk Encroachment',
    description: 'Temporary fruit and juice stalls occupying the full 1.8m width of the pedestrian corridor for 30 meters.',
    category: 'obstructed_path',
    severity: 'moderate',
    status: 'pending',
    priorityScore: 58,
    priorityLevel: 'moderate',
    assignedTeam: 'Civic Space Enforcement & Public Rights-of-Way Division',
    location: {
      lat: 17.4445,
      lng: 78.381,
      address: 'Mindspace Junction Footpath, Madhapur, Hyderabad',
    },
    reportedBy: 'Sneha L. (Commuter)',
    reportedAt: '2026-10-12T15:00:00Z',
    updatedAt: '2026-10-12T15:00:00Z',
    upvotes: 16,
    isSampleData: true,
    activityLog: [
      {
        id: 'act-103-1',
        timestamp: '2026-10-12T15:00:00Z',
        action: 'created',
        actor: 'Sneha L. (Commuter)',
        details: 'Report logged for corridor walkway obstruction.',
      },
    ],
  },
  {
    id: 'iss-104',
    title: 'Non-Functional Street Luminaires on Overpass Walkway',
    description: 'A 200m stretch of elevated pedestrian bridge has zero functioning luminaires, creating a severe nocturnal navigation hazard.',
    category: 'poor_lighting',
    severity: 'high',
    status: 'resolved',
    priorityScore: 72,
    priorityLevel: 'high',
    assignedTeam: 'Electrical & Street Lighting Wing',
    location: {
      lat: 17.4402,
      lng: 78.3792,
      address: 'Inorbit Overpass Walkway, Hitec City, Hyderabad',
    },
    reportedBy: 'Kavita N. (Night Shift Worker)',
    reportedAt: '2026-10-05T20:45:00Z',
    updatedAt: '2026-10-11T12:00:00Z',
    upvotes: 41,
    isSampleData: true,
    activityLog: [
      {
        id: 'act-104-1',
        timestamp: '2026-10-05T20:45:00Z',
        action: 'created',
        actor: 'Kavita N.',
        details: 'Report logged for nocturnal blackout hazard.',
      },
      {
        id: 'act-104-2',
        timestamp: '2026-10-07T09:30:00Z',
        action: 'status_changed',
        actor: 'Electrical Wing',
        details: 'Work crew deployed for LED lamp fixture replacement.',
        previousValue: 'pending',
        newValue: 'in_progress',
      },
      {
        id: 'act-104-3',
        timestamp: '2026-10-11T12:00:00Z',
        action: 'status_changed',
        actor: 'Divisional Engineer V. Rao',
        details: 'All 8 luminaire units replaced and energized; marked as Resolved.',
        previousValue: 'in_progress',
        newValue: 'resolved',
      },
    ],
  },
  {
    id: 'iss-105',
    title: 'Missing Tactile Blister Paving at Bus Shelter Approach',
    description: 'No detectable yellow directional or blister warning pavers leading to the bus shelter approach ramp.',
    category: 'no_tactile_paving',
    severity: 'moderate',
    status: 'pending',
    priorityScore: 52,
    priorityLevel: 'moderate',
    assignedTeam: 'Universal Design & Non-Motorized Transport Wing',
    location: {
      lat: 17.4485,
      lng: 78.3752,
      address: 'Botanical Garden Bus Station Approach, Hyderabad',
    },
    reportedBy: 'Karthik S. (Inclusion Volunteer)',
    reportedAt: '2026-10-11T14:10:00Z',
    updatedAt: '2026-10-11T14:10:00Z',
    upvotes: 19,
    isSampleData: true,
    activityLog: [
      {
        id: 'act-105-1',
        timestamp: '2026-10-11T14:10:00Z',
        action: 'created',
        actor: 'Karthik S. (Inclusion Volunteer)',
        details: 'Initial report filed.',
      },
    ],
  },
  {
    id: 'iss-106',
    title: 'Open Trench & Broken Barricade along Walkway',
    description: 'Excavation for telecom fiber with missing safety netting and deep exposed trench right next to active footpath.',
    category: 'temporary_construction',
    severity: 'critical',
    status: 'pending',
    priorityScore: 90,
    priorityLevel: 'critical',
    assignedTeam: 'Construction Safety & Utility Coordination Cell',
    location: {
      lat: 17.4435,
      lng: 78.377,
      address: 'Cyber Gateway Access Road, Hitec City, Hyderabad',
    },
    reportedBy: 'Vikram A. (IT Commuter)',
    reportedAt: '2026-10-13T08:20:00Z',
    updatedAt: '2026-10-13T08:20:00Z',
    upvotes: 35,
    isSampleData: true,
    activityLog: [
      {
        id: 'act-106-1',
        timestamp: '2026-10-13T08:20:00Z',
        action: 'created',
        actor: 'Vikram A. (IT Commuter)',
        details: 'Urgent construction hazard flagged.',
      },
    ],
  },
];

/**
 * Initializes the DB with clean seed issues if not present
 */
export function initDb() {
  if (inMemoryIssuesCache && inMemoryIssuesCache.length > 0) {
    return inMemoryIssuesCache;
  }
  if (!fs.existsSync(DB_FILE)) {
    saveIssues(INITIAL_SEED_ISSUES);
    inMemoryIssuesCache = [...INITIAL_SEED_ISSUES];
    return inMemoryIssuesCache;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveIssues(INITIAL_SEED_ISSUES);
      inMemoryIssuesCache = [...INITIAL_SEED_ISSUES];
      return inMemoryIssuesCache;
    }
    inMemoryIssuesCache = parsed;
    return inMemoryIssuesCache;
  } catch (err) {
    console.error('Error reading issues database, reinitializing with seed data:', err);
    saveIssues(INITIAL_SEED_ISSUES);
    inMemoryIssuesCache = [...INITIAL_SEED_ISSUES];
    return inMemoryIssuesCache;
  }
}

let issuesIndexMap = new Map();

function rebuildIndex(issues) {
  issuesIndexMap.clear();
  for (const issue of issues) {
    if (issue.id) {
      issuesIndexMap.set(issue.id, issue);
    }
  }
}

/**
 * Saves issues array to DB file (with in-memory caching and safe error handling)
 */
export function saveIssues(issues) {
  inMemoryIssuesCache = issues;
  rebuildIndex(issues);
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(issues, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Persistence notice: saved to in-memory cache (disk write restricted):', err?.message);
  }
}

/**
 * Gets all issues from database
 */
export function getAllIssues() {
  const issues = initDb();
  if (!issuesIndexMap.size && issues.length > 0) {
    rebuildIndex(issues);
  }
  return issues;
}

/**
 * Gets a single issue by ID with O(1) index lookup
 */
export function getIssueById(id) {
  if (!issuesIndexMap.size) {
    initDb();
  }
  return issuesIndexMap.get(id) || null;
}

/**
 * Creates a new issue and records the creation in activity log
 */
export function createIssue(data) {
  const issues = getAllIssues();

  const id = `iss-${Date.now()}`;
  const now = new Date().toISOString();

  // Explainable priority calculation
  const priority = calculateExplainablePriority(data, 0);
  const team = getRecommendedTeam(data.category);

  const initialActivity = {
    id: `act-${id}-1`,
    timestamp: now,
    action: 'created',
    actor: data.reportedBy || 'Civic Contributor',
    details: data.duplicateOf
      ? `Report created and linked as duplicate of issue #${data.duplicateOf}.`
      : 'Issue reported and registered in civic database.',
  };

  const newIssue = {
    id,
    title: data.title,
    description: data.description,
    category: data.category,
    severity: data.severity || priority.priorityLevel,
    status: data.duplicateOf ? 'duplicate' : 'pending',
    priorityScore: priority.totalScore,
    priorityLevel: priority.priorityLevel,
    priorityBreakdown: priority.breakdown,
    assignedTeam: team.team,
    location: {
      lat: data.lat ?? (17.4435 + (Math.random() - 0.5) * 0.01),
      lng: data.lng ?? (78.3772 + (Math.random() - 0.5) * 0.01),
      address: data.address,
    },
    reportedBy: data.reportedBy || 'Civic Contributor',
    reportedAt: now,
    updatedAt: now,
    upvotes: 1,
    imageUrl: data.imageUrl || undefined,
    duplicateOf: data.duplicateOf || null,
    duplicateIds: [],
    aiAnalysis: data.aiAnalysis || null,
    isSampleData: false,
    activityLog: [initialActivity],
  };

  // If this is a duplicate of another issue, link it on the parent
  if (data.duplicateOf) {
    const parentIndex = issues.findIndex((i) => i.id === data.duplicateOf);
    if (parentIndex !== -1) {
      if (!Array.isArray(issues[parentIndex].duplicateIds)) {
        issues[parentIndex].duplicateIds = [];
      }
      issues[parentIndex].duplicateIds.push(id);
      issues[parentIndex].activityLog.push({
        id: `act-${issues[parentIndex].id}-${Date.now()}`,
        timestamp: now,
        action: 'duplicate_linked',
        actor: data.reportedBy || 'Civic Contributor',
        details: `Issue #${id} was linked as a duplicate of this report.`,
      });
      // Recalculate parent priority with increased recurrence
      const updatedPriority = calculateExplainablePriority(
        issues[parentIndex],
        issues[parentIndex].duplicateIds.length
      );
      issues[parentIndex].priorityScore = updatedPriority.totalScore;
      issues[parentIndex].priorityBreakdown = updatedPriority.breakdown;
    }
  }

  issues.unshift(newIssue);
  saveIssues(issues);

  return newIssue;
}

/**
 * Updates an issue status, team, or links as duplicate
 */
export function updateIssue(id, updates = {}, actor = 'Municipal Reviewer', note = '') {
  const issues = getAllIssues();
  const index = issues.findIndex((i) => i.id === id);
  if (index === -1) {
    return null;
  }

  const issue = issues[index];
  const now = new Date().toISOString();

  // Track status change
  if (updates.status && updates.status !== issue.status) {
    issue.activityLog.push({
      id: `act-${id}-${Date.now()}-status`,
      timestamp: now,
      action: 'status_changed',
      actor,
      details: note || `Status updated from ${issue.status} to ${updates.status}.`,
      previousValue: issue.status,
      newValue: updates.status,
    });
    issue.status = updates.status;
  }

  // Track team change
  if (updates.assignedTeam && updates.assignedTeam !== issue.assignedTeam) {
    issue.activityLog.push({
      id: `act-${id}-${Date.now()}-team`,
      timestamp: now,
      action: 'team_assigned',
      actor,
      details: note || `Assigned team changed to ${updates.assignedTeam}.`,
      previousValue: issue.assignedTeam,
      newValue: updates.assignedTeam,
    });
    issue.assignedTeam = updates.assignedTeam;
  }

  // Track severity change
  if (updates.severity && updates.severity !== issue.severity) {
    issue.severity = updates.severity;
    const recomputed = calculateExplainablePriority(issue, issue.duplicateIds?.length || 0);
    issue.priorityScore = recomputed.totalScore;
    issue.priorityLevel = recomputed.priorityLevel;
    issue.priorityBreakdown = recomputed.breakdown;
  }

  // Track manual priority score override
  if (typeof updates.priorityScore === 'number') {
    issue.priorityScore = updates.priorityScore;
  }

  // Track linking duplicate
  if (updates.duplicateOf && updates.duplicateOf !== issue.duplicateOf) {
    issue.duplicateOf = updates.duplicateOf;
    issue.status = 'duplicate';
    issue.activityLog.push({
      id: `act-${id}-${Date.now()}-dup`,
      timestamp: now,
      action: 'duplicate_linked',
      actor,
      details: `Linked as duplicate of issue #${updates.duplicateOf}.`,
      newValue: updates.duplicateOf,
    });

    // Also update target parent
    const targetParent = issues.find((i) => i.id === updates.duplicateOf);
    if (targetParent) {
      if (!Array.isArray(targetParent.duplicateIds)) {
        targetParent.duplicateIds = [];
      }
      if (!targetParent.duplicateIds.includes(id)) {
        targetParent.duplicateIds.push(id);
      }
      targetParent.activityLog.push({
        id: `act-${targetParent.id}-${Date.now()}-dup`,
        timestamp: now,
        action: 'duplicate_linked',
        actor,
        details: `Issue #${id} was linked as a duplicate of this issue.`,
      });
    }
  }

  issue.updatedAt = now;
  saveIssues(issues);
  return issue;
}

/**
 * Upvotes an issue
 */
export function upvoteIssue(id) {
  const issues = getAllIssues();
  const issue = issues.find((i) => i.id === id);
  if (!issue) return null;

  issue.upvotes = (issue.upvotes || 0) + 1;
  issue.updatedAt = new Date().toISOString();
  saveIssues(issues);
  return issue;
}

/**
 * Resets database back to clean seed data
 */
export function resetDb() {
  saveIssues(INITIAL_SEED_ISSUES);
  return INITIAL_SEED_ISSUES;
}

/**
 * Retrieves global timeline of recent activity across all issues
 */
export function getGlobalActivityTimeline(limit = 20) {
  const issues = getAllIssues();
  const allEvents = [];

  for (const issue of issues) {
    if (Array.isArray(issue.activityLog)) {
      for (const log of issue.activityLog) {
        allEvents.push({
          ...log,
          issueId: issue.id,
          issueTitle: issue.title,
          category: issue.category,
          severity: issue.severity,
        });
      }
    }
  }

  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return allEvents.slice(0, limit);
}
