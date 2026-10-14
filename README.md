# CivicLens AI — Pedestrian Infrastructure & Civic Barrier Intelligence Platform

> **Honest, Explainable Civic Intelligence powered by Google Gemini 2.5 Flash**  
> Identifies pedestrian accessibility obstacles, calculates transparent deterministic priority triage, detects duplicate reports, and tracks civic remediation lifecycles in real time.

---

## 1. System Architecture

CivicLens AI uses a decoupled client-server architecture with persistent file-backed civic ledger storage and native server-side Gemini AI integration:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT (React 19)                       │
│  - Community Dashboard (/community): 4 Live Metrics, Category & Status │
│    distribution charts, search, multi-axis filters, pagination.        │
│  - Issue Intake & Vision Inspector (/report): Side-by-side evidence,    │
│    real-time duplicate detection banner, editable overrides.          │
│  - Issue Lifecycle Detail (/issues/:id): Explainable Priority gauge,   │
│    responsible municipal team, duplicate links, activity timeline.     │
│  - Accessibility Explorer (/explore) & Corridor Route Navigation.      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (/api/*)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       SERVER MIDDLEWARE & API ENGINE                    │
│  - Vite middleware (dev) / Node HTTP Server (server/index.js)          │
│  - server/apiHandler.js: REST routing, validation, error boundaries.    │
│  - server/geminiService.js: Official @google/genai SDK, gemini-2.5-flash│
│    system instructions, strict safety rules, and secret protection.   │
│  - server/validation.js: Zod schemas for all model outputs & payloads. │
│  - server/duplicateDetection.js: Text Jaccard, category matching, and  │
│    Haversine distance (meters). Never silently deletes or merges.      │
│  - server/priorityScoring.js: 4-factor deterministic scoring (0-100).  │
│  - server/teamMapping.js: Configurable SLA & category-to-team mapping. │
│  - server/db.js: Persistent storage in server/data/issues.json with     │
│    complete audit activity logs and timestamps.                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Features & Implementation Locations

| Feature | Description | Implementation File(s) |
| :--- | :--- | :--- |
| **Server-Side Gemini Vision & Issue Analysis** | Uses `@google/genai` with `gemini-2.5-flash` to return validated 9-field structured JSON. Protects API keys; validates MIME types (JPEG, PNG, WebP) and size (<10MB). | [geminiService.js](file:///server/geminiService.js), [validation.js](file:///server/validation.js) |
| **Honest Demo Simulation Fallback** | When `GEMINI_API_KEY` is not configured, provides a clearly labeled heuristic simulation with explicit disclaimers. Never pretends to be live AI. | [demoSimulation.js](file:///server/demoSimulation.js) |
| **Intelligent Duplicate Detection** | Real-time comparison against active unresolved issues using token Jaccard similarity, category equivalence, and Haversine distance in meters. | [duplicateDetection.js](file:///server/duplicateDetection.js) |
| **Explainable Priority Scoring** | Deterministic 4-factor scoring (Base Severity, Safety Impact, Recurrence Density, Evidence Reliability). Keeps deterministic rules strictly separate from advisory AI. | [priorityScoring.js](file:///server/priorityScoring.js) |
| **Responsible Team Recommendations** | Configurable category-to-department routing with SLA response targets and mandatory municipal advisory disclaimer. | [teamMapping.js](file:///server/teamMapping.js) |
| **Persistent Civic Ledger & Activity Logs** | File-backed JSON database persisting issue state, duplicate links, and timestamped activity logs across browser refreshes. | [db.js](file:///server/db.js), [BarrierContext.tsx](file:///src/context/BarrierContext.tsx) |
| **Live Community Dashboard** | Real-time metrics derived from actual database records, category distribution, status triage, search, filters, and pagination. | [CommunityDashboard.tsx](file:///src/pages/CommunityDashboard.tsx) |
| **Interactive Issue Detail Page** | Deep-linked detail page (`/issues/:id`) with status transitions, priority breakdown, duplicate graphs, and audit history. | [ReportDetail.tsx](file:///src/pages/ReportDetail.tsx) |

---

## 3. Prerequisites

- **Node.js**: v20+ or v22+ (tested on v26.4.0)
- **npm**: v10+
- **Google Gemini API Key** *(optional for live vision; honest demo simulation operates automatically if unconfigured)*

---

## 4. Environment Variables Configuration

Create a `.env` file in the root directory (copied from `.env.example`):

```bash
# Copy example file
cp .env.example .env
```

Set your Google Gemini API key:
```ini
# Google Gemini API Key from Google AI Studio: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Optional standalone backend port
PORT=3001
```

> **Security Guarantee**:
> The `GEMINI_API_KEY` is loaded strictly on the server-side via `dotenv`. It is never exposed in browser bundles, network responses, client headers, or log files. Any error message containing a key pattern is automatically redacted with `key=REDACTED`.

---

## 5. Quickstart & Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
Seeds the database with reproducible, realistic pedestrian barrier reports in the Hitec City, Hyderabad corridor:
```bash
npm run seed
```
*Output: Seeds 6 verified issues across broken sidewalks, missing curb ramps, commercial obstructions, lighting failures, and temporary construction.*

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Run Automated Test Suite
Runs the comprehensive 21-test suite testing Zod validation, missing credentials handling, malformed responses, payload sizing, duplicate detection edge-cases, and database persistence:
```bash
npm test
```

### 5. Production Build
Validates TypeScript compilation and builds the optimized production bundle:
```bash
npm run build
```

---

## 6. Vercel Deployment Guide

CivicLens AI is pre-configured for full-stack deployment on [Vercel](https://vercel.com) using a static Vite frontend combined with Node.js Serverless Functions (`api/index.js`) and [`vercel.json`](file:///vercel.json).

### Method A: Deploy via GitHub (Recommended)
1. Push this repository to your GitHub account:
   ```bash
   git push origin main
   ```
2. Navigate to [vercel.com/new](https://vercel.com/new) and import your `hack2skill` repository.
3. In **Project Settings > Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google AI Studio API key (`AQ.Ab8RN6...`)
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite` (or leave default)
4. Click **Deploy**. Vercel will build the frontend with `npm run build` and route all `/api/*` endpoints to the serverless function handler.

### Method B: Deploy via Vercel CLI
1. Log in to Vercel:
   ```bash
   npx vercel login
   ```
2. Deploy the project:
   ```bash
   npx vercel --prod
   ```
3. Set your production environment variable:
   ```bash
   npx vercel env add GEMINI_API_KEY production
   ```

> **Serverless Resilience**:
> In serverless environments (AWS Lambda / Vercel), the database layer in `server/db.js` automatically uses `/tmp/civiclens-data` with in-memory caching to guarantee zero `EROFS` crashes while maintaining active session consistency.

---

## 7. Actual Test & Build Verification Outcomes

### Automated Test Suite (`npm test`)
```
▶ --- CivicLens AI Comprehensive Test Suite ---
  ✔ 1.1 Zod Validates Complete Civic Issue Analysis Schema (9.25ms)
  ✔ 1.2 Zod Rejects Malformed Model Output (3.03ms)
  ✔ 2.1 Accepts Valid JPEG and PNG Base64 (3.26ms)
  ✔ 2.2 Rejects Unsupported MIME Types (e.g. text/plain, pdf) (0.72ms)
  ✔ 2.3 Rejects Oversized Base64 Payload (>10MB) (33.76ms)
  ✔ 3.1 Returns 503 with Setup Instructions When Gemini Key is Missing (0.83ms)
  ✔ 3.2 Demo Simulation Fallback Clearly Labels Output as Non-Live Simulation (0.92ms)
  ✔ 4.1 Detects Similar Reports (Same category, nearby, overlapping text) (3.44ms)
  ✔ 4.2 Rejects Unrelated Reports (Different category, unrelated text, different area) (0.96ms)
  ✔ 4.3 Distant Locations Have Significantly Reduced Similarity (0.76ms)
  ✔ 4.4 Handles Missing Coordinates Gracefully Without Throwing (1.04ms)
  ✔ 4.5 Excludes Resolved Issues by Default and Flags Them if Requested (0.32ms)
  ✔ 5.1 Critical Severity and Safety Impact Yields High Priority Score (0.41ms)
  ✔ 5.2 Low Severity and Low Recurrence Yields Low Priority Score (0.22ms)
  ✔ 5.3 Score Strictly Bounded Between 0 and 100 (0.13ms)
  ✔ 6.1 Maps Categories to Proper Teams and Includes Municipal Disclaimer (0.11ms)
  ✔ 7.1 Create Issue Persists in DB with Initial Activity Log (3.94ms)
  ✔ 7.2 Status Transition Updates Database and Logs Activity Event (7.28ms)
  ✔ 7.3 Linking a Duplicate Updates Both Child and Parent with Activity Records (8.20ms)
  ✔ 7.4 Global Activity Timeline Aggregates All Event Logs Chronologically (2.49ms)
✔ --- CivicLens AI Comprehensive Test Suite --- (91.87ms)
ℹ tests 21 | pass 21 | fail 0 | cancelled 0
```

### Production Build (`npm run build`)
```
✓ 1649 modules transformed.
dist/index.html                   0.93 kB │ gzip:   0.50 kB
dist/assets/index-Ce5myk-f.css   77.61 kB │ gzip:  21.28 kB
dist/assets/index-y6j96Aqj.js   580.68 kB │ gzip: 170.33 kB
✓ built in 5.08s (0 errors)
```

---

## 8. 90-Second Live Judging Demo Script

Follow these steps for a live presentation or evaluator walkthrough:

1. **Step 1: Open the Dashboard (0:00 - 0:15)**
   - Navigate to `http://localhost:5173/community`.
   - Highlight the **4 Live Metrics**: Total Issues (6), Unresolved Issues (5), High Priority (4), Resolution Rate (17%).
   - Show the **Category Distribution** bar chart and click the **Unresolved** filter pill to filter the grid in real time.

2. **Step 2: Submit a New Issue with AI Vision Analysis (0:15 - 0:40)**
   - Click **Report Civic Barrier** (or navigate to `/report`).
   - Under *1-Click Evidence Presets*, click **Broken Sidewalk Lip**.
   - Show the side-by-side photo preview and the structured **Gemini Analysis Result card** displaying:
     - Likely barrier classification (`broken_sidewalk`)
     - Summary of physical conditions
     - Observable evidence bullets
     - Recommended priority score (e.g. 78/100)
     - Suggested responsible team (`Road & Footpath Maintenance Wing`)
     - Mandatory human ground verification notice.

3. **Step 3: Real-Time Duplicate Detection (0:40 - 0:55)**
   - Notice the purple **Potential Duplicate Issues Detected nearby** banner that automatically appears.
   - Point out that it detected an existing report (`iss-101`) with an **84% Match**, showing exact matching evidence (*Same category: Broken Sidewalk; Close corridor proximity: ~30m away; Shared keywords*).
   - Click **Link as Duplicate to #iss-101** to demonstrate how CivicLens tracks recurrence without discarding citizen reports.

4. **Step 4: Submit to Database & Open Issue Detail (0:55 - 1:15)**
   - Click **Submit Report as Duplicate**.
   - On the success card, click **View Issue Details** (`/issues/:id`).
   - Inspect the **Explainable Civic Priority Breakdown** showing points per dimension (Base Severity: 30/40, Safety Impact: 18/25, Recurrence: 12/20, Evidence: 15/15).
   - Point out the **Responsible Civic Team** with the mandatory advisory disclaimer.

5. **Step 5: Transition Status & Verify Updated Analytics (1:15 - 1:30)**
   - Under *Lifecycle Status Transition*, enter reviewer name `"Inspector Rao"` and note `"Civil patchwork crew dispatched"`, then click **In Progress**.
   - Notice the status badge immediately updates and a new event is appended to the **Activity History Timeline**.
   - Return to `/community`: demonstrate that the Total Count increased, the In Progress status count incremented, and the recent activity timeline logs the event!

---

## 9. REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/status` | `GET` | Health check, Gemini configuration status, supported model (`gemini-3.5-flash-lite`), allowed MIME types. |
| `/api/issues` | `GET` | Query issues with `search`, `status`, `category`, `severity`, `sort`, `page`, `limit`. Returns live dashboard metrics. |
| `/api/issues/:id` | `GET` | Retrieve single issue with full activity audit log and linked duplicates. |
| `/api/issues` | `POST` | Create new civic issue. Runs duplicate check and explainable priority scoring. |
| `/api/issues/:id` | `PATCH` | Update status (`pending`, `in_progress`, `verified`, `resolved`, `duplicate`), assigned team, or priority. Logs activity. |
| `/api/issues/:id/upvote`| `POST` | Increment community upvotes. |
| `/api/issues/check-duplicates` | `POST` | Compare candidate report with active issues via text Jaccard, category, and Haversine distance. |
| `/api/analyze-civic-issue` | `POST` | Genuine Gemini multimodal image and issue analysis with Zod validation. Returns 503 if unconfigured. |
| `/api/analyze-demo` | `POST` | Deterministic demo fallback clearly labeled as non-live simulation. |
| `/api/activity` | `GET` | Global chronological timeline of recent civic events across all corridor reports. |
| `/api/issues/reset-seed` | `POST` | Reset database to pristine 6-issue seed dataset for fresh demo runs. |

---

## 10. Known Limitations & Civic Disclaimers

1. **Advisory Decisions Only**:
   AI recommendations and priority scores are initial triage aids for human municipal evaluators. They do not constitute official municipal work orders or legal determinations.
2. **No Direct Emergency Dispatch**:
   CivicLens AI does not connect directly to 911/112 emergency services or municipal road crew dispatchers. Emergency road hazards must be reported through official municipal hotlines.
3. **2D Photo Limitations**:
   Millimeter-accurate lip heights and sub-base soil stability cannot be certified from standard smartphone photographs without physical survey equipment (calibrated depth gages or LiDAR). Mandatory human ground inspection is required before structural repairs.
