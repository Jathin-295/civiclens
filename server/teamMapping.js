/**
 * Configurable category-to-team mapping for civic issue triage.
 * DISCLAIMER: Advisory dispatch recommendation only — official municipal authorities are not automatically dispatched.
 */

export const TEAM_MAPPING = {
  broken_sidewalk: {
    team: 'Road & Footpath Maintenance Wing (GHMC Engineering)',
    contact: 'ghmc-roads@civiclens.local',
    slaHours: 48,
    leadRole: 'Executive Engineer (Civil/Roads)',
    description: 'Responsible for concrete slab replacement, surface asphalt patchwork, and paver block resets.',
  },
  missing_curb_ramp: {
    team: 'Pedestrian Infrastructure & Accessibility Cell',
    contact: 'accessibility-cell@civiclens.local',
    slaHours: 24,
    leadRole: 'Accessibility Standards Officer',
    description: 'Designs and executes dropped kerb transitions, 1:12 ramp flares, and tactile warning pavers.',
  },
  obstructed_path: {
    team: 'Civic Space Enforcement & Public Rights-of-Way Division',
    contact: 'encroachment-control@civiclens.local',
    slaHours: 12,
    leadRole: 'Enforcement Inspector',
    description: 'Handles unauthorized vendor encroachments, illegal barricades, and walkway clearance enforcement.',
  },
  narrow_passage: {
    team: 'Pedestrian Infrastructure & Accessibility Cell',
    contact: 'accessibility-cell@civiclens.local',
    slaHours: 72,
    leadRole: 'Urban Design Planner',
    description: 'Evaluates corridor right-of-way bottlenecks and pedestrian clearance geometry.',
  },
  steep_slope: {
    team: 'Pedestrian Infrastructure & Accessibility Cell',
    contact: 'accessibility-cell@civiclens.local',
    slaHours: 48,
    leadRole: 'Civil Grading Engineer',
    description: 'Manages grade re-leveling, switchback ramp installation, and handrail provisions.',
  },
  no_tactile_paving: {
    team: 'Universal Design & Non-Motorized Transport Wing',
    contact: 'universal-design@civiclens.local',
    slaHours: 48,
    leadRole: 'Tactile Infrastructure Specialist',
    description: 'Installs directional and hazard warning blister tiles for visually impaired navigators.',
  },
  poor_lighting: {
    team: 'Electrical & Street Lighting Wing',
    contact: 'streetlights@civiclens.local',
    slaHours: 24,
    leadRole: 'Divisional Electrical Engineer',
    description: 'Repairs non-functional luminaires, installs solar LED fixtures, and rectifies cable faults.',
  },
  missing_crosswalk: {
    team: 'Traffic Engineering & Transit Signage Division',
    contact: 'traffic-markings@civiclens.local',
    slaHours: 24,
    leadRole: 'Traffic Safety Engineer',
    description: 'Paints high-visibility zebra markings, installs pedestrian refuge islands, and audits crossing signals.',
  },
  temporary_construction: {
    team: 'Construction Safety & Utility Coordination Cell',
    contact: 'utility-coordination@civiclens.local',
    slaHours: 12,
    leadRole: 'Site Safety Inspector',
    description: 'Inspects contractor barricades, ensures safe temporary bypasses, and clears excavation debris.',
  },
  uneven_surface: {
    team: 'Road & Footpath Maintenance Wing (GHMC Engineering)',
    contact: 'ghmc-roads@civiclens.local',
    slaHours: 48,
    leadRole: 'Area Road Supervisor',
    description: 'Grinds vertical offsets, fixes root upheaval, and levels settling utility trench covers.',
  },
  flooding: {
    team: 'Stormwater Drainage & Sanitation Wing',
    contact: 'drainage-ops@civiclens.local',
    slaHours: 12,
    leadRole: 'Emergency Drainage Superintendent',
    description: 'De-silts catch basins, clears storm inlet grates, and resolves puddle stagnation.',
  },
  other: {
    team: 'General Civic Grievance Triage Unit',
    contact: 'civic-triage@civiclens.local',
    slaHours: 72,
    leadRole: 'Civic Response Officer',
    description: 'Initial intake and inter-departmental routing for non-standard pedestrian barriers.',
  },
};

export const MUNICIPAL_DISCLAIMER =
  'Advisory dispatch recommendation only — official municipal authorities are not automatically notified.';

export function getRecommendedTeam(category) {
  const normCategory = (category || 'other').toLowerCase().trim();
  const found = TEAM_MAPPING[normCategory] || TEAM_MAPPING.other;
  return {
    ...found,
    disclaimer: MUNICIPAL_DISCLAIMER,
  };
}
