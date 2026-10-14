import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  CivicIssueAnalysisZodSchema,
  validateImagePayload,
} from './validation.js';
import { getRecommendedTeam } from './teamMapping.js';

dotenv.config();

// Structured JSON Schema for Gemini SDK response enforcement
const GEMINI_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Clear, concise title for the civic barrier or infrastructure issue (5-10 words).',
    },
    summary: {
      type: Type.STRING,
      description:
        'Objective factual summary of visible conditions. DO NOT state exact centimeter measurements or assert legal violations.',
    },
    category: {
      type: Type.STRING,
      description:
        'One of: broken_sidewalk, missing_curb_ramp, obstructed_path, narrow_passage, steep_slope, no_tactile_paving, poor_lighting, missing_crosswalk, temporary_construction, uneven_surface, flooding, other.',
    },
    severity: {
      type: Type.STRING,
      description: 'Advisory severity rating: low, moderate, high, or critical.',
    },
    recommended_priority_score: {
      type: Type.INTEGER,
      description: 'Advisory priority score from 0 to 100 based on safety impact and pedestrian obstruction.',
    },
    suggested_responsible_team: {
      type: Type.STRING,
      description: 'Recommended municipal or public works team to investigate this issue.',
    },
    supporting_evidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of specific observable physical elements seen in the photo or described in text.',
    },
    confidence_and_uncertainty: {
      type: Type.STRING,
      description:
        'Confidence level and explicit statement of what cannot be determined without physical ground survey.',
    },
    recommended_next_action: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Practical, actionable civic investigation or remediation steps.',
    },
    missing_information_requiring_clarification: {
      type: Type.STRING,
      description: 'Crucial details that require on-site inspection or clarification.',
    },
    possible_accessibility_impact: {
      type: Type.STRING,
      description: 'Potential impact on wheelchairs, canes, strollers, or vulnerable pedestrians.',
    },
  },
  required: [
    'title',
    'summary',
    'category',
    'severity',
    'recommended_priority_score',
    'suggested_responsible_team',
    'supporting_evidence',
    'confidence_and_uncertainty',
    'recommended_next_action',
    'missing_information_requiring_clarification',
  ],
};

const SYSTEM_INSTRUCTION = `You are a certified civic infrastructure and pedestrian accessibility analyst.
Your task is to analyze images and descriptions of sidewalks, pedestrian pathways, curbs, ramps, street lighting, and urban walking environments.

CRITICAL SAFETY AND HONESTY RULES:
1. Describe ONLY what is directly observable in the image or description.
2. DO NOT state exact numerical measurements (e.g. do not say 'the step is 14.2cm') unless a calibrated ruler is clearly visible. Use descriptive terms like 'approximate step-down', 'visible vertical lip', or 'uneven offset'.
3. DO NOT declare municipal code or ADA legal violations as settled fact. Phrase observations as 'appears non-compliant with standard ramp transitions' or 'may exceed recommended step-down thresholds'.
4. DO NOT claim that an entire route is accessible from a single photo.
5. All priority scores and team assignments are ADVISORY RECOMMENDATIONS for municipal triage, not official legal or administrative decisions.
6. Clearly document uncertainties, blind spots, or lighting limitations.
7. Always advise human engineering verification before civic remediation works.`;

/**
 * Analyzes civic issue using genuine Google Gemini API
 */
export async function analyzeCivicIssueWithGemini(payload) {
  // 1. Validate image payload first if an image is provided
  let imagePart = null;
  if (payload.imageBase64 && payload.imageBase64.trim() !== '') {
    const imgValidation = validateImagePayload(payload);
    if (!imgValidation.valid) {
      return {
        status: imgValidation.status,
        success: false,
        error: imgValidation.error,
        message: imgValidation.message,
      };
    }
    imagePart = {
      inlineData: {
        mimeType: imgValidation.mimeType,
        data: imgValidation.base64Data,
      },
    };
  }

  // 2. Check for API key securely on the server
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_API_KEY_HERE') {
    return {
      status: 503,
      success: false,
      error: 'GEMINI_API_KEY_NOT_CONFIGURED',
      message: 'The server-side GEMINI_API_KEY environment variable is not configured on this machine.',
      isConfigured: false,
      setupInstructions: {
        step1: 'Obtain an API key from Google AI Studio at https://aistudio.google.com/app/apikey',
        step2: 'Create or update the .env file in the project root with: GEMINI_API_KEY=your_actual_key_here',
        step3: 'Restart the dev server (npm run dev) to load the new environment variable.',
      },
    };
  }

  const promptText = `Analyze this civic issue report and provide structured assessment.
Report Description: ${payload.description || payload.userContext || 'Pedestrian infrastructure inspection'}
User-provided Context / Location: ${payload.address || payload.userContext || 'Corridor inspection'}`;

  const parts = [];
  if (imagePart) {
    parts.push(imagePart);
  }
  parts.push({ text: promptText });

  // 3. Call official Gemini SDK with currently supported models
  const candidateModels = [
    ...new Set(
      [
        process.env.GEMINI_MODEL,
        'gemini-3.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-3.8-flash',
      ].filter(Boolean)
    ),
  ];

// Module-level client cache for high-throughput reuse
let cachedAiClient = null;
let lastApiKey = null;

function getAiClient(apiKey) {
  if (cachedAiClient && lastApiKey === apiKey) {
    return cachedAiClient;
  }
  cachedAiClient = new GoogleGenAI({ apiKey });
  lastApiKey = apiKey;
  return cachedAiClient;
}

  try {
    const ai = getAiClient(apiKey);

    const callModelWithTimeout = async (selectedModel, timeoutMs = 15000) => {
      let timerId;
      const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(
          () => reject(new Error(`MODEL_TIMEOUT: Request to ${selectedModel} exceeded ${timeoutMs}ms.`)),
          timeoutMs
        );
      });

      const executePromise = ai.models.generateContent({
        model: selectedModel,
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_ANALYSIS_SCHEMA,
          temperature: 0.2,
        },
      });

      try {
        const res = await Promise.race([executePromise, timeoutPromise]);
        clearTimeout(timerId);
        return res;
      } catch (err) {
        clearTimeout(timerId);
        throw err;
      }
    };

    let response;
    let actualModel = candidateModels[0];
    let lastError = null;

    for (const model of candidateModels) {
      try {
        actualModel = model;
        response = await callModelWithTimeout(model, 15000);
        if (response && response.text) break;
      } catch (modelErr) {
        lastError = modelErr;
        // If 404, 503 high demand, or per-model timeout, try next model in candidate list
        if (
          modelErr?.message?.includes('NOT_FOUND') ||
          modelErr?.message?.includes('not available') ||
          modelErr?.message?.includes('high demand') ||
          modelErr?.message?.includes('503') ||
          modelErr?.message?.includes('MODEL_TIMEOUT')
        ) {
          continue;
        }
        throw modelErr;
      }
    }

    if (!response && lastError) {
      throw lastError;
    }
    const responseText = response.text;

    if (!responseText) {
      throw new Error('Gemini returned an empty response body.');
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error(`MALFORMED_JSON_FROM_GEMINI: ${parseErr.message}`);
    }

    // Assign recommended team if model returned generic
    if (!parsedJson.suggested_responsible_team || parsedJson.suggested_responsible_team.includes('Triage')) {
      parsedJson.suggested_responsible_team = getRecommendedTeam(parsedJson.category).team;
    }

    // Populate aliases
    parsedJson.likely_barrier_type = parsedJson.category;
    parsedJson.visible_evidence = parsedJson.supporting_evidence;
    parsedJson.suggested_priority = parsedJson.severity;
    parsedJson.confidence_or_uncertainty = parsedJson.confidence_and_uncertainty;
    parsedJson.recommended_next_steps = Array.isArray(parsedJson.recommended_next_action)
      ? parsedJson.recommended_next_action
      : [parsedJson.recommended_next_action];
    parsedJson.human_verification_required = true;

    // 4. Validate output with Zod
    const validated = CivicIssueAnalysisZodSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.warn('Zod validation warning on Gemini output:', validated.error.format());
      // Coerce with safe defaults
      return {
        status: 200,
        success: true,
        modelUsed: actualModel,
        isLiveGemini: true,
        analysis: {
          ...parsedJson,
          recommended_priority_score: Number(parsedJson.recommended_priority_score) || 50,
          human_verification_required: true,
        },
      };
    }

    return {
      status: 200,
      success: true,
      modelUsed: actualModel,
      isLiveGemini: true,
      analysis: validated.data,
    };
  } catch (error) {
    const errorMsg = error?.message || 'Unknown Gemini API error';
    let statusCode = 502;
    let errorCode = 'GEMINI_API_ERROR';

    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('invalid API key')) {
      statusCode = 401;
      errorCode = 'INVALID_API_KEY';
    } else if (errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota') || errorMsg.includes('429')) {
      statusCode = 429;
      errorCode = 'QUOTA_EXCEEDED';
    } else if (errorMsg.includes('GEMINI_TIMEOUT')) {
      statusCode = 504;
      errorCode = 'GATEWAY_TIMEOUT';
    } else if (errorMsg.includes('MODEL_NOT_FOUND')) {
      statusCode = 500;
      errorCode = 'MODEL_UNAVAILABLE';
    }

    // Never leak API key in error message
    const sanitizedMsg = errorMsg.replace(/key=[^&\s]+/gi, 'key=REDACTED');

    return {
      status: statusCode,
      success: false,
      error: errorCode,
      message: `Gemini API execution failed: ${sanitizedMsg}`,
      isConfigured: true,
    };
  }
}
