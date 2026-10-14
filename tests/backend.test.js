import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CivicIssueAnalysisZodSchema,
  validateImagePayload,
  CreateIssueSchema,
  UpdateIssueSchema,
} from '../server/validation.js';
import { calculateExplainablePriority } from '../server/priorityScoring.js';
import {
  detectDuplicates,
  calculateDistanceMeters,
  tokenizeText,
} from '../server/duplicateDetection.js';
import { getRecommendedTeam, MUNICIPAL_DISCLAIMER } from '../server/teamMapping.js';
import {
  initDb,
  resetDb,
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  upvoteIssue,
  getGlobalActivityTimeline,
} from '../server/db.js';
import { analyzeCivicIssueWithGemini } from '../server/geminiService.js';
import { generateDemoSimulationAnalysis } from '../server/demoSimulation.js';

test('--- CivicLens AI Comprehensive Test Suite ---', async (t) => {
  // Reset clean DB before tests
  resetDb();

  // ── 1. Zod Response Validation ───────────────────────────────────
  await t.test('1.1 Zod Validates Complete Civic Issue Analysis Schema', () => {
    const validSample = {
      title: 'Broken Concrete Slab with 9cm Lip',
      summary: 'Visible vertical displacement along concrete walkway.',
      category: 'broken_sidewalk',
      severity: 'high',
      recommended_priority_score: 75,
      suggested_responsible_team: 'Road & Footpath Maintenance Wing (GHMC Engineering)',
      supporting_evidence: [
        'Displaced concrete seam with ~9cm vertical lip',
        'Visible crack spanning 1.8 meters across sidewalk',
      ],
      confidence_and_uncertainty: 'Physical depth gage required for millimeter precision.',
      recommended_next_action: [
        'Deploy municipal inspector to measure lip offset',
        'Apply cold-mix asphalt transition patch',
      ],
      missing_information_requiring_clarification: 'Sub-base soil compaction cannot be determined from 2D photo.',
      possible_accessibility_impact: 'Impassable for manual wheelchairs; severe trip hazard.',
      human_verification_required: true,
    };

    const parsed = CivicIssueAnalysisZodSchema.safeParse(validSample);
    assert.equal(parsed.success, true, 'Valid sample should pass Zod validation');
    assert.equal(parsed.data.recommended_priority_score, 75);
    assert.equal(parsed.data.severity, 'high');
  });

  await t.test('1.2 Zod Rejects Malformed Model Output', () => {
    const invalidSample = {
      // Missing title and summary
      category: 'broken_sidewalk',
      severity: 'extreme_danger', // invalid enum
      recommended_priority_score: 150, // exceeds max 100
    };

    const parsed = CivicIssueAnalysisZodSchema.safeParse(invalidSample);
    assert.equal(parsed.success, false, 'Invalid sample must fail Zod validation');
  });

  // ── 2. Image Payload & Size Validation ──────────────────────────
  await t.test('2.1 Accepts Valid JPEG and PNG Base64', () => {
    const validPng = {
      imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
    };
    const res = validateImagePayload(validPng);
    assert.equal(res.valid, true);
    assert.equal(res.mimeType, 'image/png');
  });

  await t.test('2.2 Rejects Unsupported MIME Types (e.g. text/plain, pdf)', () => {
    const invalidMime = {
      imageBase64: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
      mimeType: 'text/plain',
    };
    const res = validateImagePayload(invalidMime);
    assert.equal(res.valid, false);
    assert.equal(res.error, 'UNSUPPORTED_MIME_TYPE');
  });

  await t.test('2.3 Rejects Oversized Base64 Payload (>10MB)', () => {
    // Generate simulated oversized base64 string (> 14 million chars)
    const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(15 * 1024 * 1024);
    const res = validateImagePayload({ imageBase64: largeBase64 });
    assert.equal(res.valid, false);
    assert.equal(res.error, 'IMAGE_TOO_LARGE');
  });

  // ── 3. Missing Credentials & Honest Demo Fallback ───────────────
  await t.test('3.1 Returns 503 with Setup Instructions When Gemini Key is Missing', async () => {
    // Temporarily unset key
    const oldKey = process.env.GEMINI_API_KEY;
    const oldGoogleKey = process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    try {
      const result = await analyzeCivicIssueWithGemini({
        description: 'Test barrier with missing API credentials',
      });
      assert.equal(result.status, 503);
      assert.equal(result.success, false);
      assert.equal(result.error, 'GEMINI_API_KEY_NOT_CONFIGURED');
      assert.ok(result.setupInstructions?.step1, 'Must provide setup instruction step 1');
      assert.ok(result.setupInstructions?.step2, 'Must provide setup instruction step 2');
    } finally {
      // Restore
      if (oldKey) process.env.GEMINI_API_KEY = oldKey;
      if (oldGoogleKey) process.env.GOOGLE_API_KEY = oldGoogleKey;
    }
  });

  await t.test('3.2 Demo Simulation Fallback Clearly Labels Output as Non-Live Simulation', () => {
    const demo = generateDemoSimulationAnalysis('Missing curb ramp', 'Abrupt vertical curb step');
    assert.equal(demo.status, 200);
    assert.equal(demo.isDemoSimulation, true, 'Must set isDemoSimulation to true');
    assert.ok(demo.simulationNotice.includes('DEMO SIMULATION'), 'Must include explicit demo disclaimer');
    assert.equal(demo.analysis.category, 'missing_curb_ramp');
    assert.equal(demo.analysis.human_verification_required, true);
  });

  // ── 4. Intelligent Duplicate Detection ──────────────────────────
  await t.test('4.1 Detects Similar Reports (Same category, nearby, overlapping text)', () => {
    const existingReports = [
      {
        id: 'iss-101',
        title: 'Displaced Concrete Slab with 10cm Lip',
        description: 'Severe vertical crack with 10cm displacement making it impassable for manual wheelchairs.',
        category: 'broken_sidewalk',
        status: 'pending',
        location: { lat: 17.4468, lng: 78.3786, address: 'Cyber Towers Circle, Hitec City' },
      },
    ];

    const candidate = {
      title: 'Cracked concrete slab with vertical displacement',
      description: 'Broken concrete sidewalk with high lip blocking wheelchairs at Cyber Towers.',
      category: 'broken_sidewalk',
      address: 'Cyber Towers Circle, Hitec City Road',
      lat: 17.4470,
      lng: 78.3788, // ~30 meters away
    };

    const matches = detectDuplicates(candidate, existingReports);
    assert.ok(matches.length > 0, 'Should detect at least 1 match');
    assert.equal(matches[0].existingReportId, 'iss-101');
    assert.ok(matches[0].similarityScore >= 60, `Similarity score (${matches[0].similarityScore}) should be >= 60%`);
    assert.ok(matches[0].matchingEvidence.length >= 2, 'Should provide multiple matching evidence points');
  });

  await t.test('4.2 Rejects Unrelated Reports (Different category, unrelated text, different area)', () => {
    const existingReports = [
      {
        id: 'iss-101',
        title: 'Broken Concrete Slab with 10cm Lip',
        description: 'Severe vertical crack with 10cm displacement.',
        category: 'broken_sidewalk',
        status: 'pending',
        location: { lat: 17.4468, lng: 78.3786, address: 'Cyber Towers Circle' },
      },
    ];

    const candidate = {
      title: 'Dark streetlight outage at botanical garden',
      description: 'Luminaires completely broken along night pathway.',
      category: 'poor_lighting',
      address: 'Botanical Garden, Kondapur',
      lat: 17.4600,
      lng: 78.3600, // distant
    };

    const matches = detectDuplicates(candidate, existingReports, { threshold: 35 });
    assert.equal(matches.length, 0, 'Unrelated issue should not trigger duplicate match');
  });

  await t.test('4.3 Distant Locations Have Significantly Reduced Similarity', () => {
    const existingReports = [
      {
        id: 'iss-101',
        title: 'Missing Curb Ramp at Junction',
        description: 'Vertical curb step without dropped kerb transition.',
        category: 'missing_curb_ramp',
        status: 'pending',
        location: { lat: 17.4415, lng: 78.3735, address: 'Raidurg Metro' },
      },
    ];

    const candidate = {
      title: 'Missing Curb Ramp at Junction',
      description: 'Vertical curb step without dropped kerb transition.',
      category: 'missing_curb_ramp',
      address: 'Secunderabad Railway Station',
      lat: 17.5000,
      lng: 78.5000, // >15km away
    };

    const dist = calculateDistanceMeters(candidate.lat, candidate.lng, 17.4415, 78.3735);
    assert.ok(dist > 5000, `Distance should exceed 5km, got ${dist}m`);

    const matches = detectDuplicates(candidate, existingReports, { threshold: 75 });
    assert.equal(matches.length, 0, 'Distant report must not meet high similarity threshold');
  });

  await t.test('4.4 Handles Missing Coordinates Gracefully Without Throwing', () => {
    const existingReports = [
      {
        id: 'iss-103',
        title: 'Vendor Obstruction on Walkway',
        description: 'Fruit stalls blocking pedestrian corridor width.',
        category: 'obstructed_path',
        status: 'pending',
        location: { address: 'Mindspace Junction Footpath' }, // No lat/lng
      },
    ];

    const candidate = {
      title: 'Commercial stall blocking sidewalk',
      description: 'Vendor tables occupying pedestrian walkway at Mindspace.',
      category: 'obstructed_path',
      address: 'Mindspace Junction Footpath',
      // No lat/lng
    };

    assert.doesNotThrow(() => {
      const matches = detectDuplicates(candidate, existingReports);
      assert.ok(matches.length > 0, 'Should match based on text and category when coordinates are missing');
    });
  });

  await t.test('4.5 Excludes Resolved Issues by Default and Flags Them if Requested', () => {
    const existingReports = [
      {
        id: 'iss-104',
        title: 'Broken Streetlight',
        description: 'Dark overpass walkway.',
        category: 'poor_lighting',
        status: 'resolved',
        location: { lat: 17.4402, lng: 78.3792, address: 'Inorbit Overpass' },
      },
    ];

    const candidate = {
      title: 'Broken Streetlight at Inorbit Overpass',
      description: 'Dark overpass walkway.',
      category: 'poor_lighting',
      address: 'Inorbit Overpass',
      lat: 17.4402,
      lng: 78.3792,
    };

    // By default, exclude resolved
    const activeMatches = detectDuplicates(candidate, existingReports, { includeResolved: false });
    assert.equal(activeMatches.length, 0, 'Resolved issues must be excluded from active duplicates by default');

    // When requested, include with isResolved flag
    const allMatches = detectDuplicates(candidate, existingReports, { includeResolved: true });
    assert.equal(allMatches.length, 1);
    assert.equal(allMatches[0].isResolved, true);
  });

  // ── 5. Explainable Priority Scoring Engine ──────────────────────
  await t.test('5.1 Critical Severity and Safety Impact Yields High Priority Score', () => {
    const issue = {
      severity: 'critical',
      category: 'missing_curb_ramp',
      description: 'Extensive 15cm road edge forcing wheelchair users directly into vehicular traffic lanes.',
      imageUrl: 'data:image/png;base64,validphoto...',
    };

    const res = calculateExplainablePriority(issue, 2);
    assert.ok(res.totalScore >= 80, `Expected score >= 80 for critical ramp issue, got ${res.totalScore}`);
    assert.equal(res.priorityLevel, 'critical');
    assert.equal(res.breakdown.length, 4, 'Must have all 4 explainable dimensions');
  });

  await t.test('5.2 Low Severity and Low Recurrence Yields Low Priority Score', () => {
    const issue = {
      severity: 'low',
      category: 'other',
      description: 'Minor paint fade on curb.',
    };

    const res = calculateExplainablePriority(issue, 0);
    assert.ok(res.totalScore <= 40, `Expected score <= 40 for minor issue, got ${res.totalScore}`);
    assert.equal(res.priorityLevel, 'low');
  });

  await t.test('5.3 Score Strictly Bounded Between 0 and 100', () => {
    const maxIssue = {
      severity: 'critical',
      category: 'missing_curb_ramp',
      description: 'A'.repeat(200),
      imageUrl: 'data:image/png;base64,...',
    };
    const maxRes = calculateExplainablePriority(maxIssue, 10);
    assert.ok(maxRes.totalScore <= 100, 'Score must never exceed 100');
    assert.ok(maxRes.totalScore >= 0, 'Score must be non-negative');
  });

  // ── 6. Configurable Team Mapping & Advisory Disclaimer ──────────
  await t.test('6.1 Maps Categories to Proper Teams and Includes Municipal Disclaimer', () => {
    const team = getRecommendedTeam('broken_sidewalk');
    assert.ok(team.team.includes('Road & Footpath Maintenance Wing'));
    assert.ok(team.slaHours === 48);
    assert.equal(team.disclaimer, MUNICIPAL_DISCLAIMER);
  });

  // ── 7. Database Persistence & Activity Log ──────────────────────
  await t.test('7.1 Create Issue Persists in DB with Initial Activity Log', () => {
    const created = createIssue({
      title: 'Automated Test Sidewalk Crack',
      description: 'Test description measuring sidewalk fissure for QA verification.',
      category: 'broken_sidewalk',
      severity: 'high',
      address: 'Test Junction 42, Hitec City',
      reportedBy: 'QA Automated Agent',
    });

    assert.ok(created.id.startsWith('iss-'), 'Created issue must have valid ID');
    assert.equal(created.status, 'pending');
    assert.ok(created.priorityScore > 0);
    assert.equal(created.activityLog.length, 1);
    assert.equal(created.activityLog[0].action, 'created');

    // Verify it persists in getAllIssues()
    const found = getIssueById(created.id);
    assert.ok(found, 'Created issue must be retrievable from database');
    assert.equal(found.title, 'Automated Test Sidewalk Crack');
  });

  await t.test('7.2 Status Transition Updates Database and Logs Activity Event', () => {
    const created = createIssue({
      title: 'Status Transition Lifecycle Verification',
      description: 'Testing in_progress and resolved transitions.',
      category: 'obstructed_path',
      severity: 'moderate',
      address: 'Mindspace Road Test',
    });

    // 1. Move to in_progress
    const inProgress = updateIssue(created.id, { status: 'in_progress' }, 'Field Officer V. Kumar', 'Crew dispatched');
    assert.equal(inProgress.status, 'in_progress');
    assert.equal(inProgress.activityLog.length, 2);
    assert.equal(inProgress.activityLog[1].action, 'status_changed');
    assert.equal(inProgress.activityLog[1].newValue, 'in_progress');

    // 2. Move to resolved
    const resolved = updateIssue(created.id, { status: 'resolved' }, 'Inspector R. Sharma', 'Obstacle cleared');
    assert.equal(resolved.status, 'resolved');
    assert.equal(resolved.activityLog.length, 3);
    assert.equal(resolved.activityLog[2].newValue, 'resolved');
  });

  await t.test('7.3 Linking a Duplicate Updates Both Child and Parent with Activity Records', () => {
    const parent = createIssue({
      title: 'Parent Primary Issue for Duplicate Testing',
      description: 'Deep pavement hole near crosswalk approach.',
      category: 'broken_sidewalk',
      severity: 'critical',
      address: 'Cyber Towers Gate 1',
    });

    const child = createIssue({
      title: 'Second Report of Pavement Hole',
      description: 'Citizen report of same deep hole.',
      category: 'broken_sidewalk',
      severity: 'critical',
      address: 'Cyber Towers Gate 1 Approach',
      duplicateOf: parent.id,
    });

    assert.equal(child.status, 'duplicate');
    assert.equal(child.duplicateOf, parent.id);

    // Check parent updated with duplicateIds
    const refreshedParent = getIssueById(parent.id);
    assert.ok(refreshedParent.duplicateIds.includes(child.id), 'Parent must list child in duplicateIds');
  });

  await t.test('7.4 Global Activity Timeline Aggregates All Event Logs Chronologically', () => {
    const timeline = getGlobalActivityTimeline(10);
    assert.ok(timeline.length > 0, 'Timeline must return event items');
    assert.ok(timeline[0].timestamp, 'Event must have timestamp');
    assert.ok(timeline[0].action, 'Event must have action name');
  });
});
