import { CivicIssueAnalysisZodSchema } from './validation.js';
import { getRecommendedTeam } from './teamMapping.js';

/**
 * Fallback simulation provider for local testing and evaluators
 * when GEMINI_API_KEY is not yet configured.
 * Clearly flags all outputs as demo simulations.
 */
export function generateDemoSimulationAnalysis(userContext = '', description = '') {
  const combinedText = `${userContext} ${description}`.toLowerCase();

  let category = 'uneven_surface';
  let title = 'Uneven Concrete Pavement Offset';
  let summary =
    'Visible concrete surface irregularities and elevation offset along the pedestrian path.';
  let severity = 'high';
  let recommended_priority_score = 75;
  let supporting_evidence = [
    'Uneven concrete sidewalk seam with visible vertical displacement',
    'Lack of continuous flush transition between sidewalk slabs',
    'Adjacent asphalt showing surface wear and gravel scattering',
  ];
  let possible_accessibility_impact =
    'May cause sudden caster-wheel stoppage or tilt for manual wheelchair users; presents an unlevel tripping edge for pedestrians with visual or gait impairments.';
  let confidence_and_uncertainty =
    'Confidence: 88% (Heuristic simulation). Note: Exact lip height in centimeters cannot be verified from a 2D photograph without physical survey tools.';
  let recommended_next_action = [
    'Deploy field surveyor or municipal inspector to measure slab offset',
    'Grind down concrete edge or apply cold-mix asphalt transition patch',
    'Schedule long-term slab leveling with GHMC ward maintenance crew',
  ];
  let missing_information_requiring_clarification =
    'Underlying soil compaction and utility sub-surface clearance cannot be verified without on-site core inspection.';

  if (
    combinedText.includes('ramp') ||
    combinedText.includes('curb') ||
    combinedText.includes('kerb') ||
    combinedText.includes('step')
  ) {
    category = 'missing_curb_ramp';
    title = 'Missing Curb Ramp at Pedestrian Crossing';
    summary =
      'Abrupt vertical curb edge without an integrated dropped transition ramp at a pedestrian crossing.';
    severity = 'critical';
    recommended_priority_score = 92;
    supporting_evidence = [
      'Unbroken raised curb separating sidewalk elevation from roadway',
      'No detectable tactile blister paving tiles at the curb approach',
      'Absence of 1:12 slope flared ramp wings',
    ];
    possible_accessibility_impact =
      'Complete obstacle for power and manual wheelchairs, requiring dangerous detour into motorized vehicle lanes.';
    confidence_and_uncertainty =
      'Confidence: 94% (Heuristic simulation). Visible road edge confirmed, but crosswalk alignment across the road cannot be determined from this angle.';
    recommended_next_action = [
      'Log high-priority accessibility defect with municipal traffic division',
      'Install precast dropped curb ramp with yellow tactile warning tiles',
      'Paint high-visibility zebra markings on intersecting carriageway',
    ];
    missing_information_requiring_clarification =
      'Crosswalk signal timing and sightlines across opposing vehicular lanes require field verification.';
  } else if (
    combinedText.includes('vendor') ||
    combinedText.includes('stall') ||
    combinedText.includes('block') ||
    combinedText.includes('debris') ||
    combinedText.includes('encroach')
  ) {
    category = 'obstructed_path';
    title = 'Walkway Corridor Obstruction';
    summary =
      'Pedestrian corridor passage constricted by commercial stalls and physical obstacles.';
    severity = 'moderate';
    recommended_priority_score = 62;
    supporting_evidence = [
      'Tables and display structures positioned directly on paved walkway',
      'Effective walkable clearance reduced to less than 80 cm',
      'Pedestrians observed stepping onto roadway to bypass obstruction',
    ];
    possible_accessibility_impact =
      'Insufficient width for standard wheelchair clearance (requires minimum 92cm ADA clearance); difficult for guide dog teams.';
    confidence_and_uncertainty =
      'Confidence: 89% (Heuristic simulation). Stall appears temporary/movable; permanence cannot be ascertained from a single photo.';
    recommended_next_action = [
      'Notify local civic enforcement to establish designated pedestrian clear zone',
      'Mark 1.8m minimum clear walkway boundary line on sidewalk pavement',
    ];
    missing_information_requiring_clarification =
      'Permit status of commercial stall and operating hours cannot be verified from photo.';
  } else if (
    combinedText.includes('dark') ||
    combinedText.includes('light') ||
    combinedText.includes('lamp') ||
    combinedText.includes('night')
  ) {
    category = 'poor_lighting';
    title = 'Inadequate Footpath Illumination';
    summary =
      'Non-functional or absent public lighting fixtures along the pedestrian corridor.';
    severity = 'high';
    recommended_priority_score = 70;
    supporting_evidence = [
      'Darkened pedestrian pathway between street lamp intervals',
      'Inoperative luminaire fixture visible on overhead pole',
    ];
    possible_accessibility_impact =
      'Impedes safe navigation for low-vision individuals and increases crime vulnerability for nighttime commuters.';
    confidence_and_uncertainty =
      'Confidence: 85% (Heuristic simulation). Ambient light meter measurement required for exact lux reading.';
    recommended_next_action = [
      'Dispatch electrical maintenance crew to replace ballast and LED fixture',
      'Audit electrical line feeder pillar for circuit trip',
    ];
    missing_information_requiring_clarification =
      'Whether power outage is isolated to single luminaire or entire street feeder circuit.';
  } else if (
    combinedText.includes('water') ||
    combinedText.includes('flood') ||
    combinedText.includes('drain')
  ) {
    category = 'flooding';
    title = 'Stormwater Puddle & Drainage Failure';
    summary =
      'Stagnant water ponding across the sidewalk due to blocked storm catch basins.',
    severity = 'high';
    recommended_priority_score = 74;
    supporting_evidence = [
      'Water sheet accumulation obscuring walkway surface',
      'Clogged curb drainage grate visible with silt and debris',
    ];
    possible_accessibility_impact =
      'Hides submerged potholes, creates slip hazards, and halts electric mobility aids susceptible to motor water ingress.';
    confidence_and_uncertainty =
      'Confidence: 87% (Heuristic simulation). Water depth cannot be determined from surface reflection.';
    recommended_next_action = [
      'Deploy suction de-silting tanker to clear curb inlet',
      'Re-grade concrete slab to promote gravity runoff',
    ];
    missing_information_requiring_clarification =
      'Downstream stormwater trunk line capacity and blockage location.';
  }

  const team = getRecommendedTeam(category);

  const rawAnalysis = {
    title,
    summary,
    category,
    severity,
    recommended_priority_score,
    suggested_responsible_team: team.team,
    supporting_evidence,
    confidence_and_uncertainty,
    recommended_next_action,
    missing_information_requiring_clarification,
    // Aliases
    likely_barrier_type: category,
    visible_evidence: supporting_evidence,
    possible_accessibility_impact,
    suggested_priority: severity,
    confidence_or_uncertainty: confidence_and_uncertainty,
    recommended_next_steps: recommended_next_action,
    human_verification_required: true,
  };

  // Validate output with Zod
  const validatedAnalysis = CivicIssueAnalysisZodSchema.parse(rawAnalysis);

  return {
    status: 200,
    success: true,
    isDemoSimulation: true,
    simulationNotice:
      'DEMO SIMULATION: This analysis was generated using civic heuristic simulation because GEMINI_API_KEY is not configured on the server. Configure GEMINI_API_KEY in .env to enable live Gemini 2.5 Flash analysis.',
    modelUsed: 'civiclens-heuristic-engine-v1',
    analysis: validatedAnalysis,
  };
}
