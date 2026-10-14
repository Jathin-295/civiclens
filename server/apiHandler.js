import { analyzeCivicIssueWithGemini } from './geminiService.js';
import { generateDemoSimulationAnalysis } from './demoSimulation.js';
import {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  resetDb,
  getGlobalActivityTimeline,
  upvoteIssue,
} from './db.js';
import { detectDuplicates } from './duplicateDetection.js';
import {
  CreateIssueSchema,
  UpdateIssueSchema,
  validateImagePayload,
} from './validation.js';

export async function handleApiRequest(req, res) {
  let rawUrl = req.url || '';
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    rawUrl = req.originalUrl;
  }
  const [urlPath, queryString] = rawUrl.split('?');
  // Ensure path is normalized to start with /api
  let path = urlPath;
  if (!path.startsWith('/api')) {
    path = path.startsWith('/') ? `/api${path}` : `/api/${path}`;
  }

  const method = req.method;
  const queryParams = new URLSearchParams(queryString || '');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const sendJson = (statusCode, data) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  // Helper to read JSON body (supports both raw Node streams and pre-parsed Vercel serverless bodies)
  const readJsonBody = () =>
    new Promise((resolve, reject) => {
      if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === 'object') {
          return resolve(req.body);
        }
        if (typeof req.body === 'string') {
          try {
            return resolve(req.body ? JSON.parse(req.body) : {});
          } catch {
            return reject(new Error('MALFORMED_JSON'));
          }
        }
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 15 * 1024 * 1024) {
          req.destroy();
          reject(new Error('PAYLOAD_TOO_LARGE'));
        }
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (err) {
          reject(new Error('MALFORMED_JSON'));
        }
      });
      req.on('error', (err) => reject(err));
    });

  // 1. GET /api/status
  if (path === '/api/status' && method === 'GET') {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const isConfigured = Boolean(key && key.trim() !== '' && key !== 'YOUR_API_KEY_HERE');

    return sendJson(200, {
      status: 'online',
      service: 'CivicLens AI Infrastructure & Accessibility Platform',
      geminiConfigured: isConfigured,
      supportedModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      version: '2.1.0',
      maxUploadBytes: 10 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
      features: {
        geminiVision: true,
        explainablePriority: true,
        duplicateDetection: true,
        activityTimeline: true,
        persistentDatabase: true,
      },
    });
  }

  // 2. GET /api/issues - List issues with query filtering & pagination
  if (path === '/api/issues' && method === 'GET') {
    let issues = getAllIssues();

    // Filters
    const search = queryParams.get('search')?.toLowerCase();
    const status = queryParams.get('status');
    const category = queryParams.get('category');
    const severity = queryParams.get('severity');
    const sort = queryParams.get('sort') || 'newest';
    const page = parseInt(queryParams.get('page') || '1', 10);
    const limit = parseInt(queryParams.get('limit') || '50', 10);

    if (search) {
      issues = issues.filter(
        (i) =>
          i.title?.toLowerCase().includes(search) ||
          i.description?.toLowerCase().includes(search) ||
          i.location?.address?.toLowerCase().includes(search) ||
          i.id?.toLowerCase().includes(search)
      );
    }

    if (status && status !== 'all') {
      if (status === 'unresolved') {
        issues = issues.filter((i) => i.status !== 'resolved');
      } else {
        issues = issues.filter((i) => i.status === status);
      }
    }

    if (category && category !== 'all') {
      issues = issues.filter((i) => i.category === category);
    }

    if (severity && severity !== 'all') {
      issues = issues.filter((i) => i.severity === severity);
    }

    // Sorting
    if (sort === 'oldest') {
      issues.sort((a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime());
    } else if (sort === 'priority') {
      issues.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    } else if (sort === 'upvotes') {
      issues.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else {
      // Default newest
      issues.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
    }

    // Counts for dashboard
    const all = getAllIssues();
    const metrics = {
      total: all.length,
      unresolved: all.filter((i) => i.status !== 'resolved').length,
      highPriority: all.filter((i) => i.severity === 'critical' || i.severity === 'high' || (i.priorityScore || 0) >= 60).length,
      resolved: all.filter((i) => i.status === 'resolved').length,
      resolutionRate: Math.round(
        (all.filter((i) => i.status === 'resolved').length / (all.length || 1)) * 100
      ),
    };

    // Pagination
    const totalFiltered = issues.length;
    const startIndex = (page - 1) * limit;
    const paginatedIssues = issues.slice(startIndex, startIndex + limit);

    return sendJson(200, {
      success: true,
      metrics,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit),
      },
      issues: paginatedIssues,
    });
  }

  // 3. GET /api/issues/:id - Single issue detail
  const issueMatch = path.match(/^\/api\/issues\/([a-zA-Z0-9-_]+)$/);
  if (issueMatch && method === 'GET') {
    const issueId = issueMatch[1];
    const issue = getIssueById(issueId);
    if (!issue) {
      return sendJson(404, { success: false, error: 'NOT_FOUND', message: `Issue #${issueId} not found.` });
    }
    return sendJson(200, { success: true, issue });
  }

  // 4. POST /api/issues - Create new issue
  if (path === '/api/issues' && method === 'POST') {
    try {
      const body = await readJsonBody();
      const parsed = CreateIssueSchema.safeParse(body);
      if (!parsed.success) {
        return sendJson(400, {
          success: false,
          error: 'VALIDATION_FAILED',
          message: parsed.error.issues.map((i) => i.message).join(', '),
        });
      }

      const newIssue = createIssue(parsed.data);
      return sendJson(201, { success: true, issue: newIssue });
    } catch (err) {
      return sendJson(400, { success: false, error: 'BAD_REQUEST', message: err.message });
    }
  }

  // 5. PATCH /api/issues/:id - Update status / assigned team / duplicate link
  if (issueMatch && method === 'PATCH') {
    try {
      const issueId = issueMatch[1];
      const body = await readJsonBody();
      const parsed = UpdateIssueSchema.safeParse(body);
      if (!parsed.success) {
        return sendJson(400, {
          success: false,
          error: 'VALIDATION_FAILED',
          message: parsed.error.issues.map((i) => i.message).join(', '),
        });
      }

      const updated = updateIssue(issueId, parsed.data, parsed.data.actor, parsed.data.note);
      if (!updated) {
        return sendJson(404, { success: false, error: 'NOT_FOUND', message: `Issue #${issueId} not found.` });
      }
      return sendJson(200, { success: true, issue: updated });
    } catch (err) {
      return sendJson(400, { success: false, error: 'BAD_REQUEST', message: err.message });
    }
  }

  // 6. POST /api/issues/:id/upvote
  const upvoteMatch = path.match(/^\/api\/issues\/([a-zA-Z0-9-_]+)\/upvote$/);
  if (upvoteMatch && method === 'POST') {
    const issueId = upvoteMatch[1];
    const updated = upvoteIssue(issueId);
    if (!updated) {
      return sendJson(404, { success: false, error: 'NOT_FOUND', message: `Issue #${issueId} not found.` });
    }
    return sendJson(200, { success: true, upvotes: updated.upvotes });
  }

  // 7. POST /api/issues/check-duplicates
  if (path === '/api/issues/check-duplicates' && method === 'POST') {
    try {
      const candidate = await readJsonBody();
      const existing = getAllIssues();
      const matches = detectDuplicates(candidate, existing, {
        threshold: candidate.threshold || 35,
        includeResolved: Boolean(candidate.includeResolved),
      });

      return sendJson(200, {
        success: true,
        matchCount: matches.length,
        potentialDuplicates: matches,
      });
    } catch (err) {
      return sendJson(400, { success: false, error: 'BAD_REQUEST', message: err.message });
    }
  }

  // 8. POST /api/analyze-image & POST /api/analyze-civic-issue - Real Gemini Image & Issue Analysis
  if ((path === '/api/analyze-image' || path === '/api/analyze-civic-issue') && method === 'POST') {
    try {
      const payload = await readJsonBody();
      const result = await analyzeCivicIssueWithGemini(payload);
      return sendJson(result.status || 200, result);
    } catch (err) {
      if (err.message === 'PAYLOAD_TOO_LARGE') {
        return sendJson(413, {
          status: 413,
          success: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload exceeds the maximum 15MB limit.',
        });
      }
      return sendJson(400, {
        status: 400,
        success: false,
        error: 'INVALID_REQUEST',
        message: err.message || 'Malformed JSON payload.',
      });
    }
  }

  // 9. POST /api/analyze-demo - Explicit Demo Fallback
  if (path === '/api/analyze-demo' && method === 'POST') {
    try {
      const payload = await readJsonBody();
      if (payload.imageBase64) {
        const validation = validateImagePayload(payload);
        if (!validation.valid) {
          return sendJson(validation.status, validation);
        }
      }

      const result = generateDemoSimulationAnalysis(payload.userContext, payload.description);
      return sendJson(200, result);
    } catch (err) {
      return sendJson(400, { status: 400, success: false, error: 'INVALID_JSON', message: err.message });
    }
  }

  // 10. GET /api/activity - Recent Global Activity Timeline
  if (path === '/api/activity' && method === 'GET') {
    const limit = parseInt(queryParams.get('limit') || '25', 10);
    const events = getGlobalActivityTimeline(limit);
    return sendJson(200, { success: true, count: events.length, events });
  }

  // 11. POST /api/issues/reset-seed - Reset Database to clean seed
  if (path === '/api/issues/reset-seed' && method === 'POST') {
    const seeded = resetDb();
    return sendJson(200, {
      success: true,
      message: 'Civic database successfully reset to clean reproducible seed dataset.',
      count: seeded.length,
      issues: seeded,
    });
  }

  // Fallthrough 404 for unmatched API routes
  if (path.startsWith('/api/')) {
    return sendJson(404, {
      status: 404,
      error: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${method} ${path} not found.`,
    });
  }
}
