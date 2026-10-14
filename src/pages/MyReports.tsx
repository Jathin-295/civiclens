import { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ThumbsUp,
  MapPin,
  Plus,
  Inbox,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useBarriers } from '../context/BarrierContext';
import {
  BARRIER_ICONS,
  BARRIER_LABELS,
  SEVERITY_CONFIG,
  VERIFICATION_CONFIG,
} from '../types/models';
import { Link } from 'react-router-dom';

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  verified: CheckCircle2,
  resolved: ShieldCheck,
  disputed: AlertTriangle,
};

export default function MyReports() {
  const { myReports, upvoteBarrier } = useBarriers();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredReports = useMemo(() => {
    if (filterStatus === 'all') return myReports;
    return myReports.filter((r) => r.status === filterStatus);
  }, [myReports, filterStatus]);

  const verifiedCount = myReports.filter((r) => r.status === 'verified').length;
  const totalUpvotes = myReports.reduce((s, r) => s + r.upvotes, 0);

  return (
    <div className="animate-fade-in pb-12">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-teal-950 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5" />
                Personal Civic Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                My Reported Barriers
              </h1>
              <p className="mt-1 text-navy-200 text-sm max-w-xl">
                Track civic review statuses, community upvotes, and municipal validation for your submitted accessibility issues.
              </p>
            </div>

            <Link
              to="/report"
              className="flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-950/40 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Report New Barrier
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold mb-1">
                <FileText className="w-4 h-4" />
                <span>Total Submitted</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{myReports.length}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified by City</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{verifiedCount}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold mb-1">
                <ThumbsUp className="w-4 h-4 text-teal-300" />
                <span>Community Endorsements</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{totalUpvotes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-border shadow-xs">
            {(['all', 'pending', 'verified', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  filterStatus === st
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-navy-600 hover:text-navy-900 hover:bg-surface-alt'
                }`}
              >
                {st === 'all' ? 'All Reports' : st}
              </button>
            ))}
          </div>

          <span className="text-xs text-navy-500 font-medium">
            Showing {filteredReports.length} reports
          </span>
        </div>

        {filteredReports.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-3xl border border-border p-8 animate-fade-in shadow-xs">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center">
              <Inbox className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-navy-900 mb-1">No barrier reports in this view</h2>
            <p className="text-xs sm:text-sm text-navy-500 max-w-md mx-auto mb-6 leading-relaxed">
              You haven't submitted any reports matching this filter. Start crowdsourcing barrier data to improve pedestrian mobility for everyone.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
            >
              <AlertTriangle className="w-4 h-4" />
              File an Accessibility Barrier
            </Link>
          </div>
        ) : (
          /* Reports Grid */
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const StatusIcon = STATUS_ICONS[report.status] || Clock;
              const vConfig = VERIFICATION_CONFIG[report.status];
              const sConfig = SEVERITY_CONFIG[report.severity];

              return (
                <article
                  key={report.id}
                  className="bg-white rounded-2xl border border-border p-5 sm:p-6 hover:shadow-md hover:border-teal-300 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-alt flex items-center justify-center text-2xl shrink-0 shadow-xs">
                        {BARRIER_ICONS[report.category]}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-navy-900">
                            {report.title}
                          </h3>
                          <span
                            className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full"
                            style={{ color: sConfig.color, backgroundColor: sConfig.bg }}
                          >
                            {sConfig.label}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-teal-700">
                          {BARRIER_LABELS[report.category]}
                        </p>

                        <p className="text-xs sm:text-sm text-navy-600 leading-relaxed pt-1">
                          {report.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          color: vConfig.color,
                          backgroundColor: `${vConfig.color}15`,
                          border: `1px solid ${vConfig.color}30`,
                        }}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{vConfig.label}</span>
                      </div>

                      <span className="text-[11px] text-navy-400 font-medium">
                        {new Date(report.reportedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* AI Analysis Diagnostic Bar */}
                  {report.aiAnalysis && (
                    <div className="mt-4 bg-teal-50/70 rounded-xl p-3 border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-teal-900">
                        <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="font-semibold text-teal-900">
                          AI Impact Score: <strong>{report.aiAnalysis.impactScore}/10</strong> • {report.aiAnalysis.estimatedFixCost}
                        </span>
                      </div>
                      <span className="text-teal-700 font-medium text-[11px]">
                        Confidence: {Math.round(report.aiAnalysis.confidence * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-navy-500">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="font-medium">{report.location.address}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => upvoteBarrier(report.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-alt hover:bg-teal-50 text-navy-700 hover:text-teal-700 font-bold transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{report.upvotes} Upvotes</span>
                      </button>

                      <Link
                        to={`/issues/${report.id}`}
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-bold hover:underline"
                      >
                        View Lifecycle Detail <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
