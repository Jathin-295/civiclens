import { Link } from 'react-router-dom';
import {
  Compass,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  MapPin,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Eye,
  Layers,
  HeartHandshake,
  Info,
} from 'lucide-react';
import { useBarriers } from '../context/BarrierContext';

export default function Home() {
  const { barriers, routes } = useBarriers();

  // Compute live statistics based on current stored data
  const totalBarriers = barriers.length;
  const verifiedBarriers = barriers.filter((b) => b.status === 'verified').length;
  const openBarriers = barriers.filter((b) => b.status === 'pending').length;
  const resolvedBarriers = barriers.filter((b) => b.status === 'resolved').length;

  const avgAccessibilityScore = Math.round(
    routes.reduce((acc, r) => acc + r.accessibilityScore, 0) / (routes.length || 1)
  );

  return (
    <div className="animate-fade-in pb-16">
      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#132a1c] via-[#1b4332] to-[#24523d] text-white border-b border-[#2d6a4f]/40 relative overflow-hidden">
        {/* Subtle background decorative civic grid */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#d8f3dc_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8f3dc]/15 border border-[#d8f3dc]/30 text-[#d8f3dc] text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Civic Accessibility Intelligence
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Every journey should be <span className="text-[#95d5b2]">accessible.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#d8f3dc]/90 leading-relaxed max-w-2xl">
              CivicLens AI empowers wheelchair users, elderly pedestrians, cane navigators, and civic engineers to analyze pedestrian barriers with Gemini 2.5 Flash, score priority triage, detect duplicate issues, and navigate safely through our cities.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                to="/explore"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#52b788] hover:bg-[#40916c] text-[#0b1d13] font-bold text-sm transition-all shadow-md shadow-[#0b1d13]/30 active:scale-98"
              >
                <Compass className="w-4 h-4" />
                Explore Routes
              </Link>

              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 transition-all backdrop-blur-sm active:scale-98"
              >
                <AlertTriangle className="w-4 h-4 text-[#ffd166]" />
                Report a Barrier
              </Link>

              <Link
                to="/methodology"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl text-xs font-semibold text-[#d8f3dc] hover:text-white transition-colors"
              >
                How scoring works <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Stored Statistics Section ─────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-[#e2e8e3] p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#e2e8e3]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2d6a4f] animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1b4332]">
                Active Platform Corpus & Metrics
              </h2>
            </div>
            <span className="text-[11px] text-[#65796f] bg-[#f0f4f1] px-2.5 py-0.5 rounded-full font-medium self-start sm:self-auto">
              Seeded with demo corridor data & verified live storage
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-[#f8faf8] border border-[#e2e8e3]/80">
              <p className="text-xs font-medium text-[#65796f]">Total Barriers Indexed</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#132a1c]">{totalBarriers}</span>
                <span className="text-[11px] text-[#2d6a4f] font-semibold">Active</span>
              </div>
              <p className="text-[10px] text-[#65796f] mt-1">
                {openBarriers} open · {verifiedBarriers} verified · {resolvedBarriers} resolved
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8faf8] border border-[#e2e8e3]/80">
              <p className="text-xs font-medium text-[#65796f]">Avg. Corridor Compliance</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1b4332]">{avgAccessibilityScore}/100</span>
                <span className="text-[11px] text-[#2d6a4f] font-semibold">Score</span>
              </div>
              <p className="text-[10px] text-[#65796f] mt-1">Based on width, slope & surface</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8faf8] border border-[#e2e8e3]/80">
              <p className="text-xs font-medium text-[#65796f]">Mapped Route Corridors</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#132a1c]">{routes.length}</span>
                <span className="text-[11px] text-[#2d6a4f] font-semibold">Alternatives</span>
              </div>
              <p className="text-[10px] text-[#65796f] mt-1">Connecting 5 primary hubs</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8faf8] border border-[#e2e8e3]/80">
              <p className="text-xs font-medium text-[#65796f]">Civic Community Reports</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#132a1c]">
                  {barriers.filter((b) => !b.isSampleData).length}
                </span>
                <span className="text-[11px] text-[#b45309] font-semibold">Live User</span>
              </div>
              <p className="text-[10px] text-[#65796f] mt-1">Excludes pre-seeded demo entries</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Capabilities / How PathAble Works ───────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#132a1c] tracking-tight">
            Designed for real pedestrian independence
          </h2>
          <p className="text-sm text-[#3b5245] mt-2">
            Standard routing applications assume perfect, step-free sidewalks. PathAble AI accounts for the ground-level reality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl border border-[#e2e8e3] p-6 shadow-xs flex flex-col justify-between hover:border-[#2d6a4f]/50 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#eef9f2] border border-[#b7e4c7] flex items-center justify-center text-[#1b4332] mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#132a1c] mb-2">
                Accessible Route Comparison
              </h3>
              <p className="text-xs sm:text-sm text-[#3b5245] leading-relaxed">
                Compare pedestrian routes not just by distance, but by curb ramp continuity, sidewalk width, surface smoothness, and documented unpaved segments.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e2e8e3]">
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b4332] hover:text-[#2d6a4f]"
              >
                Launch Route Explorer <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl border border-[#e2e8e3] p-6 shadow-xs flex flex-col justify-between hover:border-[#2d6a4f]/50 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#eef9f2] border border-[#b7e4c7] flex items-center justify-center text-[#1b4332] mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#132a1c] mb-2">
                AI Barrier Classification
              </h3>
              <p className="text-xs sm:text-sm text-[#3b5245] leading-relaxed">
                Upload a photo or describe an obstacle. The built-in AI model categorizes barrier type, calculates severity (Low to Critical), and predicts affected user groups.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e2e8e3]">
              <Link
                to="/report"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b4332] hover:text-[#2d6a4f]"
              >
                File an AI-Assisted Report <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl border border-[#e2e8e3] p-6 shadow-xs flex flex-col justify-between hover:border-[#2d6a4f]/50 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#eef9f2] border border-[#b7e4c7] flex items-center justify-center text-[#1b4332] mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#132a1c] mb-2">
                Civic Verification Loop
              </h3>
              <p className="text-xs sm:text-sm text-[#3b5245] leading-relaxed">
                Community reports progress through a transparent validation lifecycle: unverified crowdsource, AI triage, peer review, and municipal resolution tracking.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e2e8e3]">
              <Link
                to="/community"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b4332] hover:text-[#2d6a4f]"
              >
                View Community Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Demo Area Spotlight ────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="bg-gradient-to-br from-[#f0f4f1] to-white rounded-3xl border border-[#e2e8e3] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f] bg-[#d8f3dc] px-3 py-1 rounded-full">
              Illustrative Demonstration Area
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#132a1c]">
              Hitec City Pedestrian Transit Corridor
            </h3>
            <p className="text-xs sm:text-sm text-[#3b5245] leading-relaxed">
              Experience PathAble AI in a real-world testbed centered around Hyderabad’s IT corridor — featuring real transit anchors such as Hitec City Metro Station, Cyber Towers, and Mindspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/explore"
              className="px-5 py-3 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs sm:text-sm text-center transition-all shadow-sm"
            >
              Open Interactive Corridor
            </Link>
            <Link
              to="/methodology"
              className="px-5 py-3 rounded-xl bg-white hover:bg-[#f0f4f1] text-[#132a1c] border border-[#e2e8e3] font-bold text-xs sm:text-sm text-center transition-all"
            >
              Read Scoring Methodology
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
