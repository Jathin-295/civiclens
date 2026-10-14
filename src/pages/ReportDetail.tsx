import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  FileText,
  Building2,
  Copy,
  Layers,
  Info,
  Calendar,
  Send,
  Loader2,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { useBarriers } from '../context/BarrierContext';
import {
  BARRIER_LABELS,
  BARRIER_ICONS,
  SEVERITY_CONFIG,
  VERIFICATION_CONFIG,
  type VerificationStatus,
  type BarrierCategory,
} from '../types/models';

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { barriers, updateBarrierStatus, assignBarrierTeam, upvoteBarrier } = useBarriers();

  const [statusNote, setStatusNote] = useState('');
  const [reviewerName, setReviewerName] = useState('Municipal Inspector');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const issue = barriers.find((b) => b.id === id);

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-[#132a1c]">Issue Not Found</h1>
        <p className="text-xs sm:text-sm text-[#65796f] mt-1 mb-6">
          The requested civic issue #{id} could not be located in the corridor registry.
        </p>
        <Link
          to="/community"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-bold hover:bg-[#2d6a4f] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community Registry
        </Link>
      </div>
    );
  }

  const categoryLabel = BARRIER_LABELS[issue.category as BarrierCategory] || issue.category;
  const categoryIcon = BARRIER_ICONS[issue.category as BarrierCategory] || '📌';
  const severityStyle = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.moderate;
  const statusStyle = VERIFICATION_CONFIG[issue.status] || VERIFICATION_CONFIG.pending;

  // Handle Quick Status Change
  const handleStatusChange = async (newStatus: VerificationStatus) => {
    setIsUpdatingStatus(true);
    await updateBarrierStatus(
      issue.id,
      newStatus,
      statusNote.trim() || undefined,
      reviewerName.trim() || undefined
    );
    setStatusNote('');
    setIsUpdatingStatus(false);
  };

  // Copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="animate-fade-in pb-16">
      {/* ── Subheader ────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#132a1c] via-[#1b4332] to-[#24523d] text-white border-b border-[#2d6a4f]/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d8f3dc] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#d8f3dc] text-[11px] font-bold transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copiedLink ? 'Link Copied!' : 'Share Issue'}
              </button>

              <button
                onClick={() => upvoteBarrier(issue.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#52b788] hover:bg-[#40916c] text-[#0b1d13] text-xs font-bold transition-all shadow-xs"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Upvote ({issue.upvotes || 0})
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/15 text-white font-bold">
                  {issue.id}
                </span>
                <span
                  className="text-xs px-3 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                  }}
                >
                  {statusStyle.label}
                </span>
                <span
                  className="text-xs px-3 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: severityStyle.bg,
                    color: severityStyle.color,
                  }}
                >
                  {severityStyle.label} Severity
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{categoryIcon}</span>
                <span>{issue.title}</span>
              </h1>
            </div>

            {/* Priority Score Meter */}
            <div className="self-start sm:self-auto bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/15 text-right">
              <span className="text-[10px] uppercase font-bold text-[#d8f3dc] block">
                Explainable Priority
              </span>
              <div className="text-2xl font-black text-white">
                {issue.priorityScore ?? 50}
                <span className="text-xs text-[#95d5b2] font-semibold"> / 100</span>
              </div>
              <span className="text-[10px] text-[#d8f3dc]/70 block capitalize">
                Level: {issue.priorityLevel || issue.severity}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Evidence, Description, AI Diagnostics */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Evidence Image & Basic Info Card */}
            <div className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-4">
              {issue.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-[#e2e8e3] bg-[#0b1d13] max-h-80 flex items-center justify-center">
                  <img
                    src={issue.imageUrl}
                    alt={issue.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#65796f]">
                  Description & Context
                </h2>
                <p className="text-xs sm:text-sm text-[#132a1c] leading-relaxed">
                  {issue.description}
                </p>
              </div>

              {/* Metadata Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#e2e8e3] text-xs">
                <div className="flex items-center gap-2 text-[#3b5245]">
                  <MapPin className="w-4 h-4 text-[#2d6a4f] shrink-0" />
                  <span className="truncate">{issue.location.address}</span>
                </div>
                <div className="flex items-center gap-2 text-[#3b5245]">
                  <Calendar className="w-4 h-4 text-[#2d6a4f] shrink-0" />
                  <span>Reported: {new Date(issue.reportedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-[#3b5245]">
                  <User className="w-4 h-4 text-[#2d6a4f] shrink-0" />
                  <span>By: {issue.reportedBy || 'Civic Contributor'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#3b5245]">
                  <Clock className="w-4 h-4 text-[#2d6a4f] shrink-0" />
                  <span>GPS: {issue.location.lat.toFixed(4)}, {issue.location.lng.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* 2. Explainable Priority Breakdown Card */}
            <div className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2d6a4f]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#132a1c]">
                    Explainable Civic Priority Breakdown
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-[#1b4332] bg-[#eef9f2] px-2.5 py-0.5 rounded-full border border-[#b7e4c7]">
                  Deterministic Rulebook v2.1
                </span>
              </div>

              <p className="text-xs text-[#65796f] leading-relaxed">
                Priority score ({issue.priorityScore ?? 50}/100) is calculated objectively from 4 civic safety dimensions. AI recommendations remain separate and advisory.
              </p>

              {/* Breakdown Rows */}
              <div className="space-y-2.5">
                {(issue.priorityBreakdown || [
                  { factor: 'Base Severity', points: issue.severity === 'critical' ? 40 : issue.severity === 'high' ? 30 : 20, max: 40, reason: `Severity rated ${issue.severity}` },
                  { factor: 'Safety & Mobility Impact', points: 18, max: 25, reason: 'Impedes wheelchair crossing safety' },
                  { factor: 'Recurrence & Area Density', points: issue.duplicateIds?.length ? 12 : 5, max: 20, reason: issue.duplicateIds?.length ? `${issue.duplicateIds.length} linked duplicate reports` : 'First logged incident in corridor' },
                  { factor: 'Evidence Reliability', points: issue.imageUrl ? 15 : 5, max: 15, reason: issue.imageUrl ? 'Photo evidence attached' : 'Text-only description' },
                ]).map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3] space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#132a1c]">{item.factor}</span>
                      <span className="text-[#1b4332] font-mono">
                        {item.points} / {item.max} pts
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#e2e8e3] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2d6a4f] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.round((item.points / item.max) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#65796f]">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. AI Vision / Issue Analysis Card (if available) */}
            {issue.aiAnalysis && (
              <div className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2d6a4f]" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#132a1c]">
                      AI Diagnostic Inspection (Advisory)
                    </h2>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      issue.aiAnalysis.isDemoSimulation
                        ? 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]'
                        : 'bg-[#eef9f2] text-[#1b4332] border border-[#b7e4c7]'
                    }`}
                  >
                    {issue.aiAnalysis.isDemoSimulation ? 'Demo Simulation' : 'Gemini 2.5 Flash'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#65796f] block">Summary</span>
                    <p className="text-[#132a1c] mt-0.5 leading-relaxed">{issue.aiAnalysis.summary}</p>
                  </div>

                  {issue.aiAnalysis.supporting_evidence && issue.aiAnalysis.supporting_evidence.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#65796f] block mb-1">
                        Supporting Evidence
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[#3b5245]">
                        {issue.aiAnalysis.supporting_evidence.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {issue.aiAnalysis.confidence_and_uncertainty && (
                    <div className="bg-[#f8faf8] p-3 rounded-xl border border-[#e2e8e3]">
                      <span className="text-[10px] uppercase font-bold text-[#65796f] block mb-0.5">
                        Confidence & Operational Uncertainty
                      </span>
                      <p className="text-[#65796f]">{issue.aiAnalysis.confidence_and_uncertainty}</p>
                    </div>
                  )}

                  <div className="bg-[#eef9f2] p-2.5 rounded-xl border border-[#b7e4c7] text-[11px] text-[#1b4332] flex items-center justify-between">
                    <span>Ground Engineering Verification:</span>
                    <strong className="bg-white px-2 py-0.5 rounded border border-[#b7e4c7]">Mandatory</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Status Lifecycle Manager, Assigned Team, Duplicate Linkage */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Status Transition Manager */}
            <div className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#132a1c]">
                    Lifecycle Status Transition
                  </h2>
                </div>
                <span className="text-[11px] text-[#65796f]">Real-time Database Update</span>
              </div>

              <p className="text-xs text-[#65796f] leading-relaxed">
                Update the official review status. Every status change persists in the database and records an activity audit entry with timestamp.
              </p>

              {/* Status Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isUpdatingStatus || issue.status === 'pending'}
                  onClick={() => handleStatusChange('pending')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    issue.status === 'pending'
                      ? 'bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]'
                      : 'bg-[#f8faf8] hover:bg-[#eef9f2] text-[#132a1c] border border-[#e2e8e3]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Open / Pending
                </button>

                <button
                  type="button"
                  disabled={isUpdatingStatus || issue.status === 'in_progress'}
                  onClick={() => handleStatusChange('in_progress')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    issue.status === 'in_progress'
                      ? 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
                      : 'bg-[#eff6ff]/50 hover:bg-[#eff6ff] text-[#1e40af] border border-[#dbeafe]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  In Progress
                </button>

                <button
                  type="button"
                  disabled={isUpdatingStatus || issue.status === 'verified'}
                  onClick={() => handleStatusChange('verified')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    issue.status === 'verified'
                      ? 'bg-[#e8f5e9] text-[#1b4332] border border-[#b7e4c7]'
                      : 'bg-[#e8f5e9]/50 hover:bg-[#e8f5e9] text-[#1b4332] border border-[#b7e4c7]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verify Issue
                </button>

                <button
                  type="button"
                  disabled={isUpdatingStatus || issue.status === 'resolved'}
                  onClick={() => handleStatusChange('resolved')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    issue.status === 'resolved'
                      ? 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                      : 'bg-[#dcfce7]/50 hover:bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Resolved
                </button>
              </div>

              {/* Optional Note & Reviewer Input */}
              <div className="space-y-2 pt-2 border-t border-[#e2e8e3]">
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Reviewer Actor Name"
                  className="w-full px-3 py-2 bg-[#f8faf8] border border-[#e2e8e3] rounded-xl text-xs text-[#132a1c] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                />
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional audit log note (e.g., Crew dispatched to level curb)"
                  className="w-full px-3 py-2 bg-[#f8faf8] border border-[#e2e8e3] rounded-xl text-xs text-[#132a1c] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                />
              </div>
            </div>

            {/* 2. Responsible Municipal Team Card */}
            <div className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2d6a4f]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#132a1c]">
                    Responsible Civic Team
                  </h2>
                </div>
                <span className="text-[10px] text-[#65796f]">Configurable SLA</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#65796f] block">Assigned Unit</span>
                <p className="text-xs font-bold text-[#132a1c]">
                  {issue.assignedTeam || 'Road & Footpath Maintenance Wing (GHMC Engineering)'}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#65796f] pt-1.5 border-t border-[#e2e8e3] mt-2">
                  <span>Target SLA:</span>
                  <strong className="text-[#1b4332]">48 Hours</strong>
                </div>
              </div>

              <p className="text-[11px] text-[#b45309] bg-[#fffbeb] p-2.5 rounded-xl border border-[#fde68a] leading-relaxed">
                <strong>Advisory Notice:</strong> Advisory dispatch recommendation only — official municipal authorities are not automatically notified.
              </p>
            </div>

            {/* 3. Duplicate Relationships (if any) */}
            <div className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-3">
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-[#2d6a4f]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#132a1c]">
                    Duplicate Linkages
                  </h2>
                </div>
                <span className="text-[10px] text-[#65796f]">Relationship Graph</span>
              </div>

              {issue.duplicateOf ? (
                <div className="p-3 bg-[#f5f3ff] rounded-xl border border-[#ddd6fe] text-xs text-[#6d28d9] space-y-1">
                  <p className="font-bold">Linked as Duplicate of:</p>
                  <Link
                    to={`/issues/${issue.duplicateOf}`}
                    className="font-mono text-sm underline flex items-center gap-1 text-[#5b21b6]"
                  >
                    <span>Issue #{issue.duplicateOf}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : issue.duplicateIds && issue.duplicateIds.length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-[#65796f]">
                    Linked Duplicate Reports ({issue.duplicateIds.length}):
                  </span>
                  <div className="space-y-1">
                    {issue.duplicateIds.map((dupId) => (
                      <Link
                        key={dupId}
                        to={`/issues/${dupId}`}
                        className="p-2 rounded-lg bg-[#f8faf8] border border-[#e2e8e3] hover:border-[#2d6a4f] flex items-center justify-between transition-colors font-mono text-[11px] text-[#1b4332]"
                      >
                        <span>Issue #{dupId}</span>
                        <ArrowLeft className="w-3 h-3 rotate-180" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#65796f]">
                  No duplicate links established for this report.
                </p>
              )}
            </div>

            {/* 4. Complete Activity History Timeline */}
            <div className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2d6a4f]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#132a1c]">
                    Activity History Timeline
                  </h2>
                </div>
                <span className="text-[10px] text-[#65796f]">
                  {(issue.activityLog || []).length} Event(s)
                </span>
              </div>

              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2e8e3]">
                {(issue.activityLog || [
                  {
                    id: 'act-1',
                    timestamp: issue.reportedAt,
                    action: 'created',
                    actor: issue.reportedBy,
                    details: 'Report created and registered.',
                  },
                ]).map((log, idx) => (
                  <div key={idx} className="relative pl-6 text-xs space-y-0.5">
                    <span className="absolute left-0.5 top-1 w-3 h-3 rounded-full bg-[#2d6a4f] ring-4 ring-white" />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#132a1c] capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[#65796f] font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[#65796f] text-[11px]">{log.details}</p>
                    <p className="text-[10px] text-[#2d6a4f] font-medium">Actor: {log.actor}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
