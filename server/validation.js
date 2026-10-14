import { z } from 'zod';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Zod Schema for Validating Gemini & Demo Simulation AI Output
 */
export const CivicIssueAnalysisZodSchema = z.object({
  title: z.string().min(1).default('Civic Infrastructure Barrier'),
  summary: z.string().min(1),
  category: z.string().min(1),
  severity: z.enum(['low', 'moderate', 'high', 'critical']).default('moderate'),
  recommended_priority_score: z.number().min(0).max(100).default(50),
  suggested_responsible_team: z.string().min(1).default('General Civic Grievance Triage Unit'),
  supporting_evidence: z.array(z.string()).default([]),
  confidence_and_uncertainty: z.string().min(1).default('Physical survey required to confirm exact dimensions.'),
  recommended_next_action: z.union([z.string(), z.array(z.string())]).transform((val) =>
    Array.isArray(val) ? val : [val]
  ),
  missing_information_requiring_clarification: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val.join('; ') : val))
    .default('Exact dimensions and underlying sub-base condition cannot be verified from a 2D photo.'),
  // Legacy & Compatibility Aliases
  likely_barrier_type: z.string().optional(),
  visible_evidence: z.array(z.string()).optional(),
  possible_accessibility_impact: z.string().optional(),
  suggested_priority: z.string().optional(),
  confidence_or_uncertainty: z.string().optional(),
  recommended_next_steps: z.array(z.string()).optional(),
  human_verification_required: z.boolean().default(true),
});

/**
 * Zod Schema for Validating Image Analysis Request Body
 */
export const ImageAnalysisRequestSchema = z.object({
  imageBase64: z.string().min(1, 'Image data (imageBase64) is required.'),
  mimeType: z.string().optional(),
  userContext: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Zod Schema for Issue Creation
 */
export const CreateIssueSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  category: z.string().min(1, 'Category is required.'),
  severity: z.enum(['low', 'moderate', 'high', 'critical']).default('moderate'),
  address: z.string().min(3, 'Address or landmark is required.'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  imageUrl: z.string().optional(),
  reportedBy: z.string().default('Civic Contributor'),
  duplicateOf: z.string().nullable().optional(),
  aiAnalysis: z.any().optional(),
});

/**
 * Zod Schema for Status / Team / Duplicate Update
 */
export const UpdateIssueSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'verified', 'resolved', 'duplicate']).optional(),
  assignedTeam: z.string().optional(),
  severity: z.enum(['low', 'moderate', 'high', 'critical']).optional(),
  priorityScore: z.number().min(0).max(100).optional(),
  duplicateOf: z.string().nullable().optional(),
  actor: z.string().default('Municipal Reviewer'),
  note: z.string().optional(),
});

/**
 * Validates base64 image data and MIME type
 */
export function validateImagePayload(payload) {
  const parsed = ImageAnalysisRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      valid: false,
      status: 400,
      error: 'INVALID_PAYLOAD',
      message: parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  const { imageBase64, mimeType } = parsed.data;

  let detectedMime = mimeType;
  let rawBase64 = imageBase64;

  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!match) {
      return {
        valid: false,
        status: 400,
        error: 'MALFORMED_DATA_URL',
        message: 'Invalid data URL format for imageBase64.',
      };
    }
    detectedMime = match[1];
    rawBase64 = match[2];
  }

  if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime.toLowerCase())) {
    return {
      valid: false,
      status: 400,
      error: 'UNSUPPORTED_MIME_TYPE',
      message: `Unsupported image format (${detectedMime || 'unknown'}). Allowed formats: ${ALLOWED_MIME_TYPES.join(', ')}.`,
    };
  }

  // Calculate approximate byte size of base64
  const estimatedBytes = Math.round((rawBase64.length * 3) / 4);
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      status: 413,
      error: 'IMAGE_TOO_LARGE',
      message: `Image size exceeds 10MB limit (estimated: ${(estimatedBytes / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  return {
    valid: true,
    mimeType: detectedMime.toLowerCase() === 'image/jpg' ? 'image/jpeg' : detectedMime.toLowerCase(),
    base64Data: rawBase64,
  };
}
