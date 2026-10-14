// ── Barrier Categories ──────────────────────────────────────
export type BarrierCategory =
  | 'broken_sidewalk'
  | 'missing_curb_ramp'
  | 'obstructed_path'
  | 'narrow_passage'
  | 'steep_slope'
  | 'no_tactile_paving'
  | 'poor_lighting'
  | 'missing_crosswalk'
  | 'temporary_construction'
  | 'uneven_surface'
  | 'flooding'
  | 'other';

export const BARRIER_LABELS: Record<BarrierCategory, string> = {
  broken_sidewalk: 'Broken Sidewalk',
  missing_curb_ramp: 'Missing Curb Ramp',
  obstructed_path: 'Obstructed Path',
  narrow_passage: 'Narrow Passage',
  steep_slope: 'Steep Slope',
  no_tactile_paving: 'No Tactile Paving',
  poor_lighting: 'Poor Lighting',
  missing_crosswalk: 'Missing Crosswalk',
  temporary_construction: 'Temporary Construction',
  uneven_surface: 'Uneven Surface',
  flooding: 'Flooding / Drainage',
  other: 'Other Obstacle',
};

export const BARRIER_ICONS: Record<BarrierCategory, string> = {
  broken_sidewalk: '🚧',
  missing_curb_ramp: '♿',
  obstructed_path: '⛔',
  narrow_passage: '↔️',
  steep_slope: '⛰️',
  no_tactile_paving: '🦯',
  poor_lighting: '💡',
  missing_crosswalk: '🚶',
  temporary_construction: '🏗️',
  uneven_surface: '⚠️',
  flooding: '🌊',
  other: '📌',
};

// ── Severity ────────────────────────────────────────────────
export type Severity = 'low' | 'moderate' | 'high' | 'critical';

export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  low: { label: 'Low', color: '#2d6a4f', bg: '#f2f9f5', border: '#b7e4c7' },
  moderate: { label: 'Moderate', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  high: { label: 'High', color: '#c2410c', bg: '#fff7ed', border: '#ffedd5' },
  critical: { label: 'Critical', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
};

// ── Verification Status ─────────────────────────────────────
export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'resolved' | 'duplicate' | 'disputed';

export const VERIFICATION_CONFIG: Record<VerificationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Open / Pending', color: '#6b7280', bg: '#f3f4f6' },
  in_progress: { label: 'In Progress', color: '#2563eb', bg: '#eff6ff' },
  verified: { label: 'Reviewed & Verified', color: '#1b4332', bg: '#e8f5e9' },
  resolved: { label: 'Civic Resolved', color: '#15803d', bg: '#dcfce7' },
  duplicate: { label: 'Duplicate Linked', color: '#7c3aed', bg: '#f5f3ff' },
  disputed: { label: 'Under Review', color: '#c2410c', bg: '#ffedd5' },
};

// ── Activity Log Entry ──────────────────────────────────────
export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: 'created' | 'status_changed' | 'duplicate_linked' | 'priority_adjusted' | 'team_assigned' | 'note_added';
  actor: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  issueId?: string;
  issueTitle?: string;
  category?: BarrierCategory;
  severity?: Severity;
}

// ── Priority Breakdown Item ─────────────────────────────────
export interface PriorityBreakdownItem {
  factor: string;
  points: number;
  max: number;
  reason: string;
}

// ── Potential Duplicate Match ───────────────────────────────
export interface PotentialDuplicateMatch {
  existingReportId: string;
  existingTitle: string;
  similarityScore: number;
  matchingEvidence: string[];
  location: {
    address: string;
    distanceMeters?: number;
  };
  currentStatus: string;
  isResolved?: boolean;
}

// ── Landmark / Waypoint Location ────────────────────────────
export interface LandmarkLocation {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number];
}

// ── Barrier Report ──────────────────────────────────────────
export interface BarrierReport {
  id: string;
  title: string;
  description: string;
  category: BarrierCategory;
  severity: Severity;
  status: VerificationStatus;
  priorityScore?: number;
  priorityLevel?: Severity;
  priorityBreakdown?: PriorityBreakdownItem[];
  assignedTeam?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  reportedBy: string;
  reportedAt: string;
  updatedAt: string;
  upvotes: number;
  imageUrl?: string;
  isSampleData?: boolean;
  duplicateOf?: string | null;
  duplicateIds?: string[];
  activityLog?: ActivityLogEntry[];
  aiAnalysis?: AIAnalysis;
}

// ── AI Analysis ─────────────────────────────────────────────
export interface AIAnalysis {
  title?: string;
  summary: string;
  category?: BarrierCategory;
  detectedCategory?: BarrierCategory;
  likely_barrier_type?: string;
  severity?: Severity;
  suggestedPriority: Severity;
  suggested_priority?: string;
  recommended_priority_score?: number;
  confidence: number;
  impactScore?: number;
  suggested_responsible_team?: string;
  supporting_evidence?: string[];
  visible_evidence?: string[];
  confidence_and_uncertainty?: string;
  confidence_or_uncertainty?: string;
  recommended_next_action?: string[];
  recommended_next_steps?: string[];
  missing_information_requiring_clarification?: string;
  possible_accessibility_impact?: string;
  human_verification_required?: boolean;
  affectedGroups?: string[];
  estimatedFixCost?: string;
  isDemoSimulation?: boolean;
  simulationNotice?: string;
}

// ── Accessibility Attributes ────────────────────────────────
export interface AccessibilityAttributes {
  wheelchairAccessible: boolean;
  hasAudioSignals: boolean;
  hasTactilePaving: boolean;
  surfaceQuality: 'excellent' | 'good' | 'fair' | 'poor';
  gradient: 'flat' | 'gentle' | 'moderate' | 'steep';
  width: 'wide' | 'standard' | 'narrow';
  lighting: 'well_lit' | 'moderate' | 'poor' | 'none';
  sheltered: boolean;
}

// ── Route Segment ───────────────────────────────────────────
export interface RouteSegment {
  id: string;
  name: string;
  coordinates: [number, number][];
  accessibility: AccessibilityAttributes;
  barriers: string[]; // barrier report IDs
  distance: number; // meters
  estimatedTime: number; // seconds
  isSurveyed: boolean;
}

// ── Route ───────────────────────────────────────────────────
export interface Route {
  id: string;
  name: string;
  description: string;
  originId: string;
  destinationId: string;
  segments: RouteSegment[];
  totalDistance: number;
  totalTime: number;
  accessibilityScore: number;
  barrierCount: number;
  knownBarriers: number;
  unknownSegments: number;
  dataConfidence: number;
  isVerified: boolean;
  color: string;
}

// ── Community Insight ───────────────────────────────────────
export interface CommunityInsight {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
  tags: string[];
  category: 'tip' | 'experience' | 'suggestion' | 'alert';
}
