import {
  Sparkles,
  ShieldCheck,
  Compass,
  AlertTriangle,
  Info,
  CheckCircle2,
  Cpu,
  Layers,
  HelpCircle,
  FileText,
  Eye,
  Sliders,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutMethodology() {
  return (
    <div className="animate-fade-in pb-16">
      {/* ── Subheader ────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#132a1c] via-[#1b4332] to-[#24523d] text-white border-b border-[#2d6a4f]/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8f3dc]/15 text-[#d8f3dc] text-xs font-semibold uppercase tracking-wider mb-2">
            <Info className="w-3.5 h-3.5" />
            Screen 5 · About & Methodology
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Methodology, Route Scoring & AI Architecture
          </h1>
          <p className="text-xs sm:text-sm text-[#d8f3dc]/80 mt-2 max-w-2xl leading-relaxed">
            Transparent documentation of our computer-vision heuristics, accessibility weighted formulas, sensor data limitations, and municipal peer-verification protocols.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10 text-xs sm:text-sm text-[#3b5245]">
        {/* ── Section 1: How AI Analysis Works ───────────── */}
        <section className="bg-white rounded-3xl border border-[#e2e8e3] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#1b4332]">
            <div className="w-10 h-10 rounded-xl bg-[#eef9f2] border border-[#b7e4c7] flex items-center justify-center text-[#1b4332]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#132a1c]">
                1. How the AI Analysis Works
              </h2>
              <span className="text-[11px] font-semibold text-[#2d6a4f]">
                Computer Vision & Semantic Natural Language Heuristics
              </span>
            </div>
          </div>

          <p className="leading-relaxed">
            PathAble AI couples multimodal vision algorithms with semantic pedestrian transit models to automatically analyze uploaded obstacle imagery and user descriptions. When a user captures a barrier photo, the model evaluates four geometric and environmental attributes:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3]">
              <div className="flex items-center gap-2 font-bold text-[#132a1c] mb-1">
                <Eye className="w-4 h-4 text-[#2d6a4f]" />
                Vertical Lip & Step Extraction
              </div>
              <p className="text-xs leading-relaxed text-[#65796f]">
                Identifies concrete displacement and pavement offsets. Offsets exceeding 1.25 cm (0.5 inches) violate ADA standards and are flagged as severe trip/wheelchair hazards.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3]">
              <div className="flex items-center gap-2 font-bold text-[#132a1c] mb-1">
                <Sliders className="w-4 h-4 text-[#2d6a4f]" />
                Curb Drop & Gradient Detection
              </div>
              <p className="text-xs leading-relaxed text-[#65796f]">
                Detects whether pedestrian road crossings have tapered curb ramps (1:12 maximum slope) or unramped drops that force wheelchairs into motorized traffic.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3]">
              <div className="flex items-center gap-2 font-bold text-[#132a1c] mb-1">
                <Layers className="w-4 h-4 text-[#2d6a4f]" />
                Usable Passage Width
              </div>
              <p className="text-xs leading-relaxed text-[#65796f]">
                Measures unobstructed sidewalk width between light poles, vendor stalls, and building facades. Standard wheelchairs require a continuous clearance of at least 92 cm (36 inches).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3]">
              <div className="flex items-center gap-2 font-bold text-[#132a1c] mb-1">
                <Sparkles className="w-4 h-4 text-[#2d6a4f]" />
                Confidence Scoring Metric
              </div>
              <p className="text-xs leading-relaxed text-[#65796f]">
                The AI generates a confidence score (0.0 to 1.0). High confidence (&gt;0.90) requires clear photographic evidence and specific text; lower scores trigger prompt requests for more data.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 2: Route Scoring & Its Limitations ─── */}
        <section className="bg-white rounded-3xl border border-[#e2e8e3] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#1b4332]">
            <div className="w-10 h-10 rounded-xl bg-[#eef9f2] border border-[#b7e4c7] flex items-center justify-center text-[#1b4332]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#132a1c]">
                2. Route Scoring & Its Limitations
              </h2>
              <span className="text-[11px] font-semibold text-[#2d6a4f]">
                Accessibility Index (0–100) & Operational Sensor Boundaries
              </span>
            </div>
          </div>

          <p className="leading-relaxed">
            The <strong>Accessibility Score</strong> is a composite weighted index calculated for each route alternative based on four fundamental dimensions:
          </p>

          <div className="bg-[#f8faf8] p-4 rounded-2xl border border-[#e2e8e3] font-mono text-xs text-[#132a1c] space-y-1">
            <p className="font-bold text-[#1b4332]">Score = (W_curb * 0.35) + (W_surface * 0.25) + (W_slope * 0.20) + (W_lighting * 0.10) - (Barrier_Penalty * 0.10)</p>
            <p className="text-[11px] text-[#65796f] font-sans">
              Where critical barriers apply immediate deductions, capped at zero.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-sm text-[#132a1c] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#b45309]" />
              Known Technical & Data Limitations
            </h3>

            <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-[#3b5245] leading-relaxed">
              <li>
                <strong>Dynamic & Transient Obstacles:</strong> Illegally parked vehicles, temporary market stalls, and movable construction scaffolding can appear or disappear in hours, preceding map updates.
              </li>
              <li>
                <strong>Weather & Monsoon Variations:</strong> Sidewalk flooding and storm drain blockages vary drastically between dry and monsoon seasons in Hyderabad.
              </li>
              <li>
                <strong>Sensor & Field Survey Gaps:</strong> In secondary residential and commercial feeder alleys, OpenStreetMap sidewalk data is partially incomplete. Routes passing through these blocks are explicitly marked with <em>"Unknown Segments"</em> and reduced <em>Data Confidence</em>.
              </li>
            </ul>
          </div>
        </section>

        {/* ── Section 3: Verification Requirements ───────── */}
        <section className="bg-white rounded-3xl border border-[#e2e8e3] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#1b4332]">
            <div className="w-10 h-10 rounded-xl bg-[#eef9f2] border border-[#b7e4c7] flex items-center justify-center text-[#1b4332]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#132a1c]">
                3. Why Community Reports Require Verification
              </h2>
              <span className="text-[11px] font-semibold text-[#2d6a4f]">
                Multi-Stage Civic Validation Lifecycle
              </span>
            </div>
          </div>

          <p className="leading-relaxed">
            Public pedestrian safety requires that unvetted crowd reports are not immediately assumed to be authoritative facts. To avoid malicious reports or false alarms, PathAble AI implements a <strong>Four-Stage Civic Verification Protocol</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3] space-y-1">
              <span className="w-6 h-6 rounded-full bg-[#f0f4f1] text-[#132a1c] font-black text-xs flex items-center justify-center">1</span>
              <h4 className="font-bold text-xs text-[#132a1c]">Open Report</h4>
              <p className="text-[11px] text-[#65796f] leading-relaxed">
                Crowdsourced report submitted by pedestrian. Marked with dashed amber styling on map.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3] space-y-1">
              <span className="w-6 h-6 rounded-full bg-[#eef9f2] text-[#1b4332] font-black text-xs flex items-center justify-center">2</span>
              <h4 className="font-bold text-xs text-[#132a1c]">AI Automated Triage</h4>
              <p className="text-[11px] text-[#65796f] leading-relaxed">
                Photo edge-detection scores hazard severity and checks for duplicate reports within a 20m radius.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3] space-y-1">
              <span className="w-6 h-6 rounded-full bg-[#d8f3dc] text-[#1b4332] font-black text-xs flex items-center justify-center">3</span>
              <h4 className="font-bold text-xs text-[#132a1c]">Reviewed & Verified</h4>
              <p className="text-[11px] text-[#65796f] leading-relaxed">
                Peer upvotes or physical field validation by civic engineers / disability champions.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3] space-y-1">
              <span className="w-6 h-6 rounded-full bg-[#1b4332] text-white font-black text-xs flex items-center justify-center">4</span>
              <h4 className="font-bold text-xs text-[#132a1c]">Civic Resolution</h4>
              <p className="text-[11px] text-[#65796f] leading-relaxed">
                Municipal work order (e.g., GHMC repair crew) repairs slab or adds curb ramp. Marked as Resolved.
              </p>
            </div>
          </div>
        </section>

        {/* ── Call to action footer ───────────────────────── */}
        <div className="bg-gradient-to-r from-[#132a1c] to-[#1b4332] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Ready to test the accessibility pipeline?</h3>
            <p className="text-xs text-[#d8f3dc]/80 mt-1">Explore live routes in Hitec City or submit a simulated barrier report.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/explore"
              className="px-4 py-2.5 bg-[#52b788] hover:bg-[#40916c] text-[#0b1d13] font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Explore Routes
            </Link>
            <Link
              to="/report"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl border border-white/20 transition-all"
            >
              Report Barrier
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
