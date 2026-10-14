import { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Route as RouteIcon,
  Navigation,
  ThumbsUp,
  X,
  Layers,
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import AccessibilityMap from '../components/AccessibilityMap';
import { useBarriers } from '../context/BarrierContext';
import { DEMO_LANDMARKS } from '../data/demo';
import {
  SEVERITY_CONFIG,
  BARRIER_ICONS,
  BARRIER_LABELS,
  VERIFICATION_CONFIG,
  type BarrierReport,
} from '../types/models';
import { Link } from 'react-router-dom';

export default function ExploreRoutes() {
  const {
    barriers,
    routes,
    selectedRoute,
    setSelectedRoute,
    upvoteBarrier,
  } = useBarriers();

  // Origin & Destination State
  const [originId, setOriginId] = useState<string>('hitec-metro');
  const [destinationId, setDestinationId] = useState<string>('mindspace');

  // Filter & Modal State
  const [selectedBarrier, setSelectedBarrier] = useState<BarrierReport | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDataStatus, setFilterDataStatus] = useState<string>('all'); // all | verified | unverified

  const originLocation = useMemo(
    () => DEMO_LANDMARKS.find((l) => l.id === originId) || DEMO_LANDMARKS[0],
    [originId]
  );

  const destLocation = useMemo(
    () => DEMO_LANDMARKS.find((l) => l.id === destinationId) || DEMO_LANDMARKS[2],
    [destinationId]
  );

  // Filter routes: prioritize routes matching current origin/dest, or show all available
  const displayedRoutes = useMemo(() => {
    const matching = routes.filter(
      (r) => r.originId === originId && r.destinationId === destinationId
    );
    return matching.length > 0 ? matching : routes;
  }, [routes, originId, destinationId]);

  // Active route
  const activeRoute = useMemo(() => {
    if (selectedRoute) {
      return routes.find((r) => r.id === selectedRoute) || displayedRoutes[0];
    }
    return displayedRoutes[0];
  }, [routes, selectedRoute, displayedRoutes]);

  // Filter barriers
  const filteredBarriers = useMemo(() => {
    return barriers.filter((b) => {
      const matchSev = filterSeverity === 'all' || b.severity === filterSeverity;
      const matchCat = filterCategory === 'all' || b.category === filterCategory;
      const matchStatus =
        filterDataStatus === 'all'
          ? true
          : filterDataStatus === 'verified'
          ? b.status === 'verified'
          : b.status !== 'verified';
      return matchSev && matchCat && matchStatus;
    });
  }, [barriers, filterSeverity, filterCategory, filterDataStatus]);

  const swapOriginDestination = () => {
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
  };

  return (
    <div className="animate-fade-in pb-16">
      {/* ── Subheader / Route Selector Strip ─────────────── */}
      <section className="bg-gradient-to-r from-[#132a1c] via-[#1b4332] to-[#24523d] text-white border-b border-[#2d6a4f]/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8f3dc]/15 text-[#d8f3dc] text-xs font-semibold uppercase tracking-wider mb-2">
                <Compass className="w-3.5 h-3.5" />
                Screen 2 · Accessibility Explorer
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Pedestrian Route Accessibility Explorer
              </h1>
              <p className="text-xs sm:text-sm text-[#d8f3dc]/80 mt-1 max-w-2xl leading-relaxed">
                Plan and compare walking corridors based on ground-truth barrier reports, sidewalk widths, curb ramp continuity, and sensor data confidence.
              </p>
            </div>

            {/* Quick action */}
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#52b788] hover:bg-[#40916c] text-[#0b1d13] font-bold text-xs sm:text-sm transition-all self-start lg:self-auto shadow-sm active:scale-95"
            >
              <AlertTriangle className="w-4 h-4" />
              Report Barrier on Route
            </Link>
          </div>

          {/* ── Origin & Destination Selectors ─────────────── */}
          <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
              {/* Origin Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8f3dc] mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#52b788]" />
                  Origin (Starting Hub)
                </label>
                <select
                  value={originId}
                  onChange={(e) => setOriginId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white text-[#132a1c] font-semibold text-xs sm:text-sm rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#52b788] shadow-xs"
                >
                  {DEMO_LANDMARKS.map((landmark) => (
                    <option key={landmark.id} value={landmark.id}>
                      {landmark.name} ({landmark.description.slice(0, 32)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center pt-3 md:pt-4">
                <button
                  type="button"
                  onClick={swapOriginDestination}
                  title="Swap Origin and Destination"
                  className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>

              {/* Destination Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#d8f3dc] mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ffd166]" />
                  Destination (Arrival Hub)
                </label>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white text-[#132a1c] font-semibold text-xs sm:text-sm rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#52b788] shadow-xs"
                >
                  {DEMO_LANDMARKS.map((landmark) => (
                    <option key={landmark.id} value={landmark.id}>
                      {landmark.name} ({landmark.description.slice(0, 32)}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ── Map Filter Strip ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#e2e8e3] p-3.5 sm:p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[#1b4332] text-[11px]">
              Corridor Layer Filters:
            </span>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-[#f0f4f1] p-1 rounded-xl">
              {(['all', 'critical', 'high', 'moderate', 'low'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    filterSeverity === sev
                      ? 'bg-[#1b4332] text-white shadow-xs'
                      : 'text-[#3b5245] hover:text-[#132a1c]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Data Verification Filter */}
            <div className="flex items-center gap-1 bg-[#f0f4f1] p-1 rounded-xl">
              {[
                { id: 'all', label: 'All Data' },
                { id: 'verified', label: 'Verified Only' },
                { id: 'unverified', label: 'Open Reports' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setFilterDataStatus(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterDataStatus === st.id
                      ? 'bg-[#1b4332] text-white shadow-xs'
                      : 'text-[#3b5245] hover:text-[#132a1c]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] text-[#65796f]">
            Displaying <strong>{filteredBarriers.length}</strong> of {barriers.length} obstacles on map
          </span>
        </div>

        {/* ── Main Explorer Content: Map + Route Comparison ─ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Map Column */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1b4332] animate-pulse" />
                <h2 className="text-base font-bold text-[#132a1c]">
                  Hitec City Interactive Corridor Map
                </h2>
              </div>
              <span className="text-xs text-[#2d6a4f] bg-[#eef9f2] font-semibold px-2.5 py-0.5 rounded-full border border-[#b7e4c7]">
                Live Ground-Truth Tiles
              </span>
            </div>

            <AccessibilityMap
              barriers={filteredBarriers}
              routes={displayedRoutes}
              selectedRoute={activeRoute?.id || null}
              originLocation={originLocation}
              destLocation={destLocation}
              onBarrierClick={(b) => setSelectedBarrier(b)}
              className="h-[460px] sm:h-[540px]"
            />

            {/* Active Route Summary Bar */}
            {activeRoute && (
              <div className="bg-white rounded-2xl border border-[#e2e8e3] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: activeRoute.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-[#132a1c]">
                        {activeRoute.name}
                      </strong>
                      {activeRoute.isVerified ? (
                        <span className="text-[10px] font-bold text-[#1b4332] bg-[#eef9f2] px-2 py-0.2 rounded-full border border-[#b7e4c7] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Field Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#b45309] bg-[#fffbeb] px-2 py-0.2 rounded-full border border-[#fde68a]">
                          Community Sample
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#3b5245] mt-0.5">{activeRoute.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e2e8e3]">
                  <div>
                    <span className="text-[#65796f] block text-[10px] uppercase font-semibold">Length</span>
                    <strong className="text-sm text-[#132a1c]">{activeRoute.totalDistance}m</strong>
                  </div>
                  <div>
                    <span className="text-[#65796f] block text-[10px] uppercase font-semibold">Walk Time</span>
                    <strong className="text-sm text-[#132a1c]">
                      {Math.round(activeRoute.totalTime / 60)} min
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#65796f] block text-[10px] uppercase font-semibold">Data Confidence</span>
                    <strong className="text-sm text-[#1b4332] font-black">
                      {activeRoute.dataConfidence}%
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Route Comparison Cards Column ─────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#132a1c] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1b4332]" />
                Route Alternatives Comparison
              </h2>
              <span className="text-xs text-[#65796f]">Select to preview</span>
            </div>

            <div className="space-y-3">
              {displayedRoutes.map((route) => {
                const isSelected = activeRoute?.id === route.id;
                const isHighCompliance = route.accessibilityScore >= 80;

                return (
                  <button
                    key={route.id}
                    onClick={() => setSelectedRoute(route.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-[#1b4332] bg-[#f8faf8] shadow-md ring-2 ring-[#1b4332]/10'
                        : 'border-[#e2e8e3] bg-white hover:border-[#2d6a4f]/50'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: route.color }}
                        />
                        <h3 className="font-bold text-sm text-[#132a1c]">
                          {route.name}
                        </h3>
                      </div>

                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                          isHighCompliance
                            ? 'bg-[#eef9f2] text-[#1b4332] border border-[#b7e4c7]'
                            : 'bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5]'
                        }`}
                      >
                        {route.accessibilityScore}/100 Score
                      </span>
                    </div>

                    <p className="text-xs text-[#3b5245] leading-relaxed mb-3 line-clamp-2">
                      {route.description}
                    </p>

                    {/* Score Bar */}
                    <div className="w-full bg-[#f0f4f1] rounded-full h-2 mb-3 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${route.accessibilityScore}%`,
                          backgroundColor: route.color,
                        }}
                      />
                    </div>

                    {/* Key Metrics: Distance, Known Barriers, Unknown Segments, Confidence */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#e2e8e3] text-[#3b5245]">
                      <div className="flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-[#65796f]" />
                        <span>Distance: <strong>{route.totalDistance}m</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#65796f]" />
                        <span>Duration: <strong>{Math.round(route.totalTime / 60)}m</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${route.knownBarriers > 0 ? 'text-[#c2410c]' : 'text-[#2d6a4f]'}`} />
                        <span>Known Barriers: <strong>{route.knownBarriers}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <HelpCircle className={`w-3.5 h-3.5 ${route.unknownSegments > 0 ? 'text-[#b45309]' : 'text-[#2d6a4f]'}`} />
                        <span>Unknown Segments: <strong>{route.unknownSegments}</strong></span>
                      </div>
                    </div>

                    {/* Data Confidence & Survey Badge */}
                    <div className="mt-3 pt-2.5 border-t border-[#e2e8e3]/70 flex items-center justify-between text-[11px]">
                      <span className="text-[#65796f]">
                        Data Confidence: <strong className="text-[#1b4332]">{route.dataConfidence}%</strong>
                      </span>

                      {route.isVerified ? (
                        <span className="text-[10px] font-bold text-[#1b4332] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#2d6a4f]" /> Ground Surveyed
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#65796f] flex items-center gap-1">
                          Sensor Estimate
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* AI Decision Advisory Card */}
            <div className="bg-[#eef9f2] rounded-2xl p-4.5 border border-[#b7e4c7] text-[#132a1c] space-y-2">
              <div className="flex items-center gap-2 text-[#1b4332] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#2d6a4f]" />
                PathAble AI Recommendation
              </div>
              <p className="text-xs text-[#1b4332] leading-relaxed">
                For wheelchair users travelling between <strong>{originLocation.name}</strong> and <strong>{destLocation.name}</strong>, the <strong>Accessible Main Boulevard</strong> is recommended with zero step-downs and 96% survey confidence.
              </p>
            </div>
          </div>
        </div>

        {/* ── Barrier Detail Modal ──────────────────────── */}
        {selectedBarrier && (
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedBarrier(null)}
          >
            <div
              className="bg-white rounded-3xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-[#e2e8e3] p-6 text-xs text-[#3b5245]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#eef9f2] border border-[#b7e4c7] flex items-center justify-center text-2xl">
                    {BARRIER_ICONS[selectedBarrier.category]}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#132a1c]">
                      {selectedBarrier.title}
                    </h2>
                    <p className="text-xs text-[#2d6a4f] font-semibold">
                      {BARRIER_LABELS[selectedBarrier.category]}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBarrier(null)}
                  className="p-1.5 hover:bg-[#f0f4f1] rounded-full text-[#65796f] hover:text-[#132a1c]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2.5 py-0.5 rounded-full font-bold text-[10px]"
                  style={{
                    color: SEVERITY_CONFIG[selectedBarrier.severity].color,
                    backgroundColor: SEVERITY_CONFIG[selectedBarrier.severity].bg,
                  }}
                >
                  {SEVERITY_CONFIG[selectedBarrier.severity].label} Severity
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full font-semibold text-[10px]"
                  style={{
                    color: VERIFICATION_CONFIG[selectedBarrier.status].color,
                    backgroundColor: VERIFICATION_CONFIG[selectedBarrier.status].bg,
                  }}
                >
                  {VERIFICATION_CONFIG[selectedBarrier.status].label}
                </span>
                {selectedBarrier.isSampleData && (
                  <span className="text-[10px] bg-[#f0f4f1] text-[#65796f] px-2 py-0.5 rounded-full">
                    Demo Seed
                  </span>
                )}
              </div>

              <p className="text-sm text-[#132a1c] leading-relaxed mb-4">
                {selectedBarrier.description}
              </p>

              <div className="bg-[#f8faf8] p-3 rounded-xl border border-[#e2e8e3] space-y-1.5 text-xs text-[#3b5245] mb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  <span>{selectedBarrier.location.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  <span>Reported by: <strong>{selectedBarrier.reportedBy}</strong></span>
                </div>
              </div>

              {selectedBarrier.aiAnalysis && (
                <div className="bg-[#eef9f2] p-4 rounded-xl border border-[#b7e4c7] space-y-2 mb-4">
                  <div className="flex items-center justify-between text-[#1b4332] font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#2d6a4f]" /> AI Diagnostic Analysis
                    </span>
                    <span>{Math.round(selectedBarrier.aiAnalysis.confidence * 100)}% Confidence</span>
                  </div>
                  <p className="text-xs text-[#1b4332] leading-relaxed">
                    {selectedBarrier.aiAnalysis.summary}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-[#65796f] block">Hazard Rating:</span>
                      <strong className="text-sm text-[#132a1c]">{selectedBarrier.aiAnalysis.impactScore}/10</strong>
                    </div>
                    <div>
                      <span className="text-[#65796f] block">Civic Remediation Cost:</span>
                      <strong className="text-xs text-[#132a1c]">{selectedBarrier.aiAnalysis.estimatedFixCost}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => upvoteBarrier(selectedBarrier.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold rounded-xl transition-all shadow-xs active:scale-95"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Upvote Barrier ({selectedBarrier.upvotes})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBarrier(null)}
                  className="px-4 py-2.5 bg-[#f0f4f1] hover:bg-[#e2e8e3] text-[#132a1c] font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
