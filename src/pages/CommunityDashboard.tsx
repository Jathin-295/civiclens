import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ThumbsUp,
  MapPin,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Building2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  Copy,
  Info,
} from 'lucide-react';
import { useBarriers } from '../context/BarrierContext';
import {
  BARRIER_LABELS,
  BARRIER_ICONS,
  SEVERITY_CONFIG,
  VERIFICATION_CONFIG,
  type BarrierReport,
  type BarrierCategory,
  type Severity,
  type VerificationStatus,
} from '../types/models';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 6;

export default function CommunityDashboard() {
  const {
    barriers,
    metrics,
    activityTimeline,
    upvoteBarrier,
    resetToSeedData,
    isLoading,
    serverError,
  } = useBarriers();

  // Active View Tab: 'reports' | 'activity' | 'analytics'
  const [activeTab, setActiveTab] = useState<'reports' | 'activity' | 'analytics'>('reports');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'upvotes'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);

  // Category Breakdown calculation from actual database records
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    barriers.forEach((b) => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([cat, count]) => ({
        category: cat as BarrierCategory,
        label: BARRIER_LABELS[cat as BarrierCategory] || cat,
        icon: BARRIER_ICONS[cat as BarrierCategory] || '📌',
        count,
        percentage: Math.round((count / (metrics.total || 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [barriers, metrics.total]);

  // Status Breakdown calculation
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      verified: 0,
      resolved: 0,
      duplicate: 0,
    };
    barriers.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  }, [barriers]);

  // Filtered & Sorted Reports List
  const filteredReports = useMemo(() => {
    return barriers
      .filter((report) => {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          report.title.toLowerCase().includes(q) ||
          report.description.toLowerCase().includes(q) ||
          report.location.address.toLowerCase().includes(q) ||
          report.id.toLowerCase().includes(q);

        const matchStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'unresolved'
            ? report.status !== 'resolved'
            : report.status === statusFilter;

        const matchCategory =
          categoryFilter === 'all' || report.category === categoryFilter;

        const matchSeverity =
          severityFilter === 'all' || report.severity === severityFilter;

        return matchSearch && matchStatus && matchCategory && matchSeverity;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
        }
        if (sortBy === 'priority') {
          return (b.priorityScore ?? 50) - (a.priorityScore ?? 50);
        }
        if (sortBy === 'upvotes') {
          return (b.upvotes || 0) - (a.upvotes || 0);
        }
        // Default newest
        return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
      });
  }, [barriers, searchQuery, statusFilter, categoryFilter, severityFilter, sortBy]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  // Handle Reset to Seed Data
  const handleResetData = async () => {
    setIsResetting(true);
    await resetToSeedData();
    setIsResetting(false);
    setResetSuccessNotice(true);
    setTimeout(() => setResetSuccessNotice(false), 3000);
  };

  return (
    <div className="animate-fade-in pb-16">
      {/* ── Subheader with 4 Real-time Metrics ─────────────────── */}
      <section className="bg-gradient-to-r from-[#132a1c] via-[#1b4332] to-[#24523d] text-white border-b border-[#2d6a4f]/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8f3dc]/15 text-[#d8f3dc] text-xs font-semibold uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" />
                CivicLens AI · Civic Barrier Registry
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Civic Infrastructure & Barrier Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-[#d8f3dc]/80 mt-1 max-w-2xl leading-relaxed">
                Live municipal tracking for pedestrian obstacles, explainable priority triage, and duplicate resolution across the Hitec City Corridor.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <button
                type="button"
                onClick={handleResetData}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#d8f3dc] text-xs font-bold transition-all border border-white/15"
                title="Reset database to pristine reproducible seed data for demo judging"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                Reset Seed Data
              </button>

              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#52b788] hover:bg-[#40916c] text-[#0b1d13] font-bold text-xs sm:text-sm transition-all shadow-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Report Civic Barrier
              </Link>
            </div>
          </div>

          {/* Reset Success Feedback Banner */}
          {resetSuccessNotice && (
            <div className="mt-3 p-2.5 rounded-xl bg-[#52b788]/20 border border-[#52b788]/40 text-xs text-[#d8f3dc] flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#52b788]" />
              Database reset to clean reproducible seed dataset with 6 verified corridor issues.
            </div>
          )}

          {/* ── 4 Primary Dashboard Metrics (Actual Database Records) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
            {/* Metric 1: Total Issues */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="flex items-center justify-between text-[#d8f3dc] text-xs font-semibold mb-1">
                <span>Total Issues</span>
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-white">{metrics.total}</p>
              <p className="text-[10px] text-[#d8f3dc]/70 mt-1">Logged across corridor registry</p>
            </div>

            {/* Metric 2: Unresolved Issues */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="flex items-center justify-between text-[#ffd166] text-xs font-semibold mb-1">
                <span>Unresolved Issues</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-white">{metrics.unresolved}</p>
              <p className="text-[10px] text-[#d8f3dc]/70 mt-1">Pending inspection or repair</p>
            </div>

            {/* Metric 3: High Priority Issues */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="flex items-center justify-between text-[#ff9f1c] text-xs font-semibold mb-1">
                <span>High / Critical Priority</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-white">{metrics.highPriority}</p>
              <p className="text-[10px] text-[#d8f3dc]/70 mt-1">Score &ge; 60 or critical grade</p>
            </div>

            {/* Metric 4: Resolution Rate */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="flex items-center justify-between text-[#95d5b2] text-xs font-semibold mb-1">
                <span>Resolution Rate</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-white">{metrics.resolutionRate}%</p>
              <p className="text-[10px] text-[#d8f3dc]/70 mt-1">{metrics.resolved} of {metrics.total} issues resolved</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Dashboard Content Area ────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e2e8e3] pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-[#65796f] hover:bg-[#f0f4f1] hover:text-[#132a1c]'
            }`}
          >
            <Layers className="w-4 h-4" />
            Registry Reports ({filteredReports.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-[#65796f] hover:bg-[#f0f4f1] hover:text-[#132a1c]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Category & Status Analytics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-[#65796f] hover:bg-[#f0f4f1] hover:text-[#132a1c]'
            }`}
          >
            <Clock className="w-4 h-4" />
            Activity Timeline ({activityTimeline.length})
          </button>
        </div>

        {/* ── TAB 1: REPORTS LIST WITH SEARCH, FILTERS & PAGINATION ── */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="bg-white rounded-3xl border border-[#e2e8e3] p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#65796f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by title, description, address, or issue ID (e.g. iss-101)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8faf8] border border-[#e2e8e3] rounded-xl text-xs sm:text-sm text-[#132a1c] placeholder:text-[#65796f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#65796f] hover:text-[#132a1c]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#65796f] shrink-0">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="px-3 py-2.5 bg-[#f8faf8] border border-[#e2e8e3] rounded-xl text-xs font-medium text-[#132a1c] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priority">Highest Priority Score</option>
                    <option value="upvotes">Most Upvoted</option>
                  </select>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e2e8e3] text-xs">
                <span className="font-bold text-[#65796f] flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Status:
                </span>
                {[
                  { key: 'all', label: 'All Statuses' },
                  { key: 'unresolved', label: `Unresolved (${metrics.unresolved})` },
                  { key: 'pending', label: 'Open' },
                  { key: 'in_progress', label: 'In Progress' },
                  { key: 'verified', label: 'Verified' },
                  { key: 'resolved', label: 'Resolved' },
                  { key: 'duplicate', label: 'Duplicates' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(item.key);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      statusFilter === item.key
                        ? 'bg-[#1b4332] text-white shadow-xs'
                        : 'bg-[#f0f4f1] text-[#3b5245] hover:bg-[#e2e8e3]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <span className="font-bold text-[#65796f] ml-2 flex items-center gap-1">
                  Severity:
                </span>
                {['all', 'critical', 'high', 'moderate', 'low'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSeverityFilter(s);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-all ${
                      severityFilter === s
                        ? 'bg-[#1b4332] text-white shadow-xs'
                        : 'bg-[#f0f4f1] text-[#3b5245] hover:bg-[#e2e8e3]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports Grid */}
            {paginatedReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedReports.map((report) => {
                  const statusConf = VERIFICATION_CONFIG[report.status] || VERIFICATION_CONFIG.pending;
                  const sevConf = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.moderate;

                  return (
                    <div
                      key={report.id}
                      className="bg-white rounded-3xl border border-[#e2e8e3] hover:border-[#2d6a4f]/50 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Card Top: Badges and ID */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-[#65796f] bg-[#f8faf8] px-2 py-0.5 rounded-md border border-[#e2e8e3]">
                              {report.id}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider"
                              style={{
                                backgroundColor: statusConf.bg,
                                color: statusConf.color,
                              }}
                            >
                              {statusConf.label}
                            </span>
                          </div>

                          <span
                            className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider"
                            style={{
                              backgroundColor: sevConf.bg,
                              color: sevConf.color,
                            }}
                          >
                            {sevConf.label}
                          </span>
                        </div>

                        {/* Title & Category */}
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-[#2d6a4f] font-semibold mb-1">
                            <span>{BARRIER_ICONS[report.category] || '📌'}</span>
                            <span>{BARRIER_LABELS[report.category] || report.category}</span>
                          </div>
                          <Link
                            to={`/issues/${report.id}`}
                            className="text-sm font-bold text-[#132a1c] hover:text-[#1b4332] line-clamp-2 transition-colors"
                          >
                            {report.title}
                          </Link>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#65796f] line-clamp-2 leading-relaxed">
                          {report.description}
                        </p>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-[#3b5245]">
                          <MapPin className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                          <span className="truncate">{report.location.address}</span>
                        </div>

                        {/* Explainable Priority Gauge */}
                        <div className="p-2.5 rounded-xl bg-[#f8faf8] border border-[#e2e8e3] flex items-center justify-between text-xs">
                          <span className="text-[#65796f] text-[11px] font-semibold">Priority Score:</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-[#1b4332]">
                            <span className="text-sm">{report.priorityScore ?? 50}</span>
                            <span className="text-[10px] text-[#65796f]">/100</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom: Upvotes & Detail Link */}
                      <div className="pt-3 mt-4 border-t border-[#e2e8e3] flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => upvoteBarrier(report.id)}
                          className="flex items-center gap-1.5 text-[#65796f] hover:text-[#1b4332] font-semibold transition-colors"
                          title="Upvote community priority"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{report.upvotes || 0}</span>
                        </button>

                        <Link
                          to={`/issues/${report.id}`}
                          className="flex items-center gap-1 text-[#1b4332] hover:text-[#2d6a4f] font-bold text-xs group"
                        >
                          <span>View Detail & Lifecycle</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#e2e8e3] p-12 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f8faf8] border border-[#e2e8e3] flex items-center justify-center text-[#65796f]">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#132a1c]">No issues match your current filters</h3>
                <p className="text-xs text-[#65796f] max-w-sm mx-auto">
                  Try clearing your search query or switching your status filter to 'All Statuses'.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setSeverityFilter('all');
                  }}
                  className="px-4 py-2 bg-[#1b4332] text-white rounded-xl text-xs font-bold hover:bg-[#2d6a4f] transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl border border-[#e2e8e3] p-4 flex items-center justify-between text-xs">
                <span className="text-[#65796f]">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)} of{' '}
                  {filteredReports.length} issues
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-lg border border-[#e2e8e3] hover:bg-[#f8faf8] disabled:opacity-40 transition-all"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg font-bold transition-all ${
                        currentPage === i + 1
                          ? 'bg-[#1b4332] text-white shadow-xs'
                          : 'border border-[#e2e8e3] text-[#132a1c] hover:bg-[#f8faf8]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-lg border border-[#e2e8e3] hover:bg-[#f8faf8] disabled:opacity-40 transition-all"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: CATEGORY & STATUS CHARTS ─────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Category Breakdown (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#132a1c]">
                    Category Distribution
                  </h2>
                  <p className="text-[11px] text-[#65796f]">
                    Calculated directly from {metrics.total} database records
                  </p>
                </div>
                <span className="text-xs font-bold text-[#1b4332] bg-[#eef9f2] px-2.5 py-1 rounded-full border border-[#b7e4c7]">
                  {categoryCounts.length} Distinct Categories
                </span>
              </div>

              <div className="space-y-3">
                {categoryCounts.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#132a1c] flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                      <span className="font-mono text-[#65796f]">
                        {item.count} report(s) ({item.percentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-[#f0f4f1] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2d6a4f] h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown & Triage Summary (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-4">
                <div className="border-b border-[#e2e8e3] pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#132a1c]">
                    Lifecycle Status Triage
                  </h2>
                  <p className="text-[11px] text-[#65796f]">
                    Real-time status breakdown across civic workflow
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-[#f3f4f6] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#4b5563]">Open / Pending Review</span>
                    <span className="font-mono font-black text-sm text-[#1f2937]">
                      {statusCounts.pending || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#eff6ff] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1e40af]">In Progress (Work Order)</span>
                    <span className="font-mono font-black text-sm text-[#1d4ed8]">
                      {statusCounts.in_progress || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#e8f5e9] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1b4332]">Reviewed & Verified</span>
                    <span className="font-mono font-black text-sm text-[#1b4332]">
                      {statusCounts.verified || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#dcfce7] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#15803d]">Civic Resolved</span>
                    <span className="font-mono font-black text-sm text-[#15803d]">
                      {statusCounts.resolved || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#f5f3ff] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#6d28d9]">Duplicate Linked</span>
                    <span className="font-mono font-black text-sm text-[#5b21b6]">
                      {statusCounts.duplicate || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Integrity Notice */}
              <div className="bg-[#f8faf8] rounded-2xl p-4 border border-[#e2e8e3] text-xs text-[#65796f] space-y-1">
                <p className="font-bold text-[#132a1c] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#2d6a4f]" /> Truth in Metrics Policy
                </p>
                <p>
                  All counts and resolution percentages are computed strictly from stored database records in server/data/issues.json.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: REAL-TIME ACTIVITY TIMELINE ──────────────────── */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#132a1c]">
                  Corridor Activity & Audit Trail
                </h2>
                <p className="text-[11px] text-[#65796f]">
                  Persistent timeline of issue creations, status changes, team assignments, and duplicate linkages
                </p>
              </div>
              <span className="text-xs font-mono text-[#1b4332] font-bold">
                {activityTimeline.length} Total Events
              </span>
            </div>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2e8e3]">
              {activityTimeline.map((item, index) => (
                <div key={item.id || index} className="relative pl-8 text-xs space-y-1">
                  <span className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-[#2d6a4f] ring-4 ring-white" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#132a1c] text-sm">
                      {item.action === 'created'
                        ? 'New Report Filed'
                        : item.action === 'status_changed'
                        ? 'Status Updated'
                        : item.action === 'duplicate_linked'
                        ? 'Duplicate Linked'
                        : item.action === 'team_assigned'
                        ? 'Team Assigned'
                        : item.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[#65796f] font-mono text-[11px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#3b5245] leading-relaxed">{item.details}</p>

                  <div className="flex items-center gap-3 text-[11px] text-[#65796f]">
                    <span>Actor: <strong className="text-[#132a1c]">{item.actor}</strong></span>
                    {item.issueId && (
                      <Link
                        to={`/issues/${item.issueId}`}
                        className="text-[#2d6a4f] hover:underline font-mono"
                      >
                        Target: #{item.issueId}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
