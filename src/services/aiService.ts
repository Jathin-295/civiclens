import type { BarrierCategory, AIAnalysis, Severity } from '../types/models';

export interface AIAnalysisRequest {
  title: string;
  description: string;
  category?: BarrierCategory;
  imageDataUrl?: string;
}

export function analyzeBarrierWithAI(req: AIAnalysisRequest): AIAnalysis {
  const text = `${req.title} ${req.description}`.toLowerCase();

  let category: BarrierCategory = req.category || 'broken_sidewalk';
  let severity: Severity = 'moderate';
  let impactScore = 6;
  let confidence = 0.91;
  let affectedGroups: string[] = ['Pedestrians with reduced mobility'];
  let estimatedFixCost = '₹15,000 - ₹30,000';

  if (text.includes('wheelchair') || text.includes('curb') || text.includes('ramp') || text.includes('step')) {
    category = 'missing_curb_ramp';
    severity = 'critical';
    impactScore = 9;
    confidence = 0.96;
    affectedGroups = ['Wheelchair users', 'Electric wheelchair riders', 'Parents with strollers', 'Cane users'];
    estimatedFixCost = '₹40,000 - ₹75,000';
  } else if (text.includes('crack') || text.includes('hole') || text.includes('broken') || text.includes('pavement') || text.includes('slab')) {
    category = 'broken_sidewalk';
    severity = 'high';
    impactScore = 8;
    confidence = 0.93;
    affectedGroups = ['Wheelchair users', 'Elderly pedestrians', 'Visually impaired cane users'];
    estimatedFixCost = '₹20,000 - ₹45,000';
  } else if (text.includes('vendor') || text.includes('stall') || text.includes('park') || text.includes('car') || text.includes('block')) {
    category = 'obstructed_path';
    severity = 'moderate';
    impactScore = 7;
    confidence = 0.89;
    affectedGroups = ['All pedestrians', 'Stroller users', 'Wheelchair users'];
    estimatedFixCost = '₹5,000 - ₹12,000 (enforcement & bollards)';
  } else if (text.includes('dark') || text.includes('light') || text.includes('night') || text.includes('lamp')) {
    category = 'poor_lighting';
    severity = 'high';
    impactScore = 8;
    confidence = 0.94;
    affectedGroups = ['Night commuters', 'Visually impaired pedestrians', 'Women & solo walkers'];
    estimatedFixCost = '₹120,000 - ₹250,000 (solar LED installation)';
  } else if (text.includes('slope') || text.includes('steep') || text.includes('gradient') || text.includes('incline')) {
    category = 'steep_slope';
    severity = 'high';
    impactScore = 8;
    confidence = 0.92;
    affectedGroups = ['Manual wheelchair users', 'Elderly citizens', 'Cardiopulmonary patients'];
    estimatedFixCost = '₹60,000 - ₹110,000';
  } else if (text.includes('tactile') || text.includes('blind') || text.includes('braille') || text.includes('yellow tiles')) {
    category = 'no_tactile_paving';
    severity = 'moderate';
    impactScore = 7;
    confidence = 0.95;
    affectedGroups = ['Visually impaired pedestrians', 'Guide dog users'];
    estimatedFixCost = '₹35,000 - ₹60,000';
  } else if (text.includes('metro') || text.includes('construction') || text.includes('debris') || text.includes('digging')) {
    category = 'temporary_construction';
    severity = 'critical';
    impactScore = 9;
    confidence = 0.97;
    affectedGroups = ['All pedestrians', 'Mobility impaired commuters'];
    estimatedFixCost = '₹25,000 - ₹45,000 (temporary accessible rampway)';
  } else if (text.includes('water') || text.includes('flood') || text.includes('drain') || text.includes('mud')) {
    category = 'flooding';
    severity = 'high';
    impactScore = 8;
    confidence = 0.91;
    affectedGroups = ['Wheelchair users', 'Elderly pedestrians', 'School children'];
    estimatedFixCost = '₹50,000 - ₹90,000';
  }

  const summary = `AI analyzed the barrier as a ${severity.toUpperCase()} severity ${category.replace(/_/g, ' ')}. It generates an accessibility hazard rating of ${impactScore}/10 for ${affectedGroups.slice(0, 2).join(' and ')}. Recommended remediation priority: ${severity === 'critical' ? 'Urgent civic response required' : 'Scheduled maintenance recommended'}.`;

  return {
    confidence,
    detectedCategory: category,
    summary,
    impactScore,
    suggestedPriority: severity,
    affectedGroups,
    estimatedFixCost,
  };
}
