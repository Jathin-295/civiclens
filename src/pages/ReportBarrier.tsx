import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Upload,
  Sparkles,
  ChevronDown,
  Send,
  Loader2,
  FileCheck2,
  ArrowRight,
  X,
  Edit3,
  RotateCw,
  Info,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Terminal,
  Copy,
  Building2,
  ExternalLink,
} from 'lucide-react';
import {
  BARRIER_LABELS,
  BARRIER_ICONS,
  SEVERITY_CONFIG,
  type BarrierCategory,
  type Severity,
  type PotentialDuplicateMatch,
} from '../types/models';
import { useBarriers } from '../context/BarrierContext';
import { Link, useNavigate } from 'react-router-dom';

const CATEGORIES = Object.entries(BARRIER_LABELS) as [BarrierCategory, string][];

interface CivicIssueAnalysisResult {
  title: string;
  summary: string;
  category: string;
  severity: Severity;
  recommended_priority_score: number;
  suggested_responsible_team: string;
  supporting_evidence: string[];
  confidence_and_uncertainty: string;
  recommended_next_action: string[];
  missing_information_requiring_clarification: string;
  possible_accessibility_impact?: string;
  human_verification_required?: boolean;
}

const SAMPLE_EVIDENCE = [
  {
    name: 'broken_sidewalk_lip.png',
    label: 'Broken Sidewalk Lip',
    title: 'Displaced Concrete Slab with 9cm Lip',
    category: 'broken_sidewalk' as BarrierCategory,
    severity: 'high' as Severity,
    address: 'Cyber Towers Junction Crossing, Hitec City Road, Hyderabad',
    description:
      'Cracked concrete slab with visible 9cm vertical offset that creates an impassable lip for manual wheelchairs and a severe trip edge.',
    lat: 17.4468,
    lng: 78.3786,
    mimeType: 'image/png',
    previewUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    thumbnail: '🚧 Broken Slab (9cm Lip)',
  },
  {
    name: 'missing_curb_drop.png',
    label: 'Missing Curb Ramp',
    title: 'Steep Roadway Curb without Dropped Transition Ramp',
    category: 'missing_curb_ramp' as BarrierCategory,
    severity: 'critical' as Severity,
    address: 'Raidurg Metro Feeder Road Crossing, Hyderabad',
    description:
      'Unramped 15cm road edge forcing wheelchair users and stroller operators onto the busy vehicular traffic lane.',
    lat: 17.4415,
    lng: 78.3735,
    mimeType: 'image/png',
    previewUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    thumbnail: '♿ Unramped Curb (15cm)',
  },
  {
    name: 'commercial_stall_obstruction.png',
    label: 'Footpath Obstruction',
    title: 'Vendor Stalls Blocking Pedestrian Corridor Walkway',
    category: 'obstructed_path' as BarrierCategory,
    severity: 'moderate' as Severity,
    address: 'Mindspace West Gate Walkway, Madhapur, Hyderabad',
    description:
      'Temporary commercial fruit and juice stalls occupying 1.5m of the 1.8m paved corridor, pinching walkable clearance below standard minimums.',
    lat: 17.4445,
    lng: 78.381,
    mimeType: 'image/png',
    previewUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    thumbnail: '⛔ Vendor Obstruction',
  },
];

export default function ReportBarrier() {
  const { addBarrier, checkDuplicates } = useBarriers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Form Fields (fully editable by user)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BarrierCategory | ''>('');
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [reporterName, setReporterName] = useState('Civic Navigator');

  // Image State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');

  // Backend API Status
  const [serverStatus, setServerStatus] = useState<{
    geminiConfigured: boolean;
    supportedModel: string;
  } | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CivicIssueAnalysisResult | null>(null);
  const [isDemoSimulation, setIsDemoSimulation] = useState(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);
  const [apiError, setApiError] = useState<{
    code: string;
    message: string;
    setupInstructions?: { step1: string; step2: string; step3: string };
  } | null>(null);

  // Duplicate Detection State
  const [potentialDuplicates, setPotentialDuplicates] = useState<PotentialDuplicateMatch[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [linkedDuplicateOf, setLinkedDuplicateOf] = useState<string | null>(null);
  const [hasDismissedDuplicates, setHasDismissedDuplicates] = useState(false);

  // Submission State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<string>('');
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  // Check Backend Status on mount
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setServerStatus(data))
      .catch((err) => console.warn('Could not contact /api/status:', err));
  }, []);

  // ── Trigger Duplicate Check (Debounced) ─────────────────
  const runDuplicateCheck = useCallback(async () => {
    if ((title.trim().length >= 4 || description.trim().length >= 8) && !linkedDuplicateOf) {
      setIsCheckingDuplicates(true);
      const matches = await checkDuplicates({
        title,
        description,
        category: category || undefined,
        address: address || undefined,
        lat,
        lng,
      });
      setPotentialDuplicates(matches);
      setIsCheckingDuplicates(false);
    } else {
      setPotentialDuplicates([]);
    }
  }, [title, description, category, address, lat, lng, linkedDuplicateOf, checkDuplicates]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runDuplicateCheck();
    }, 600);
    return () => clearTimeout(timer);
  }, [runDuplicateCheck]);

  // Handle Photo File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const mime = file.type || 'image/jpeg';
      setImageMime(mime);
      setImageName(file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        triggerRealAnalysis(base64, mime, title || file.name, description);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Select Sample Photo
  const handleSelectSample = (sample: typeof SAMPLE_EVIDENCE[0]) => {
    setTitle(sample.title);
    setDescription(sample.description);
    setCategory(sample.category);
    setSeverity(sample.severity);
    setAddress(sample.address);
    setLat(sample.lat);
    setLng(sample.lng);
    setImagePreview(sample.previewUrl);
    setImageName(sample.name);
    setImageMime(sample.mimeType);
    setLinkedDuplicateOf(null);
    setHasDismissedDuplicates(false);

    triggerRealAnalysis(sample.previewUrl, sample.mimeType, sample.title, sample.description);
  };

  // ── Trigger Real Server-Side Gemini Analysis ────────────
  const triggerRealAnalysis = async (
    imageBase64: string,
    mimeType: string,
    userTitle: string,
    userDesc: string
  ) => {
    setIsAnalyzing(true);
    setApiError(null);
    setAnalysisResult(null);
    setIsDemoSimulation(false);
    setSimulationNotice(null);

    try {
      const response = await fetch('/api/analyze-civic-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          description: userDesc || userTitle || 'Pedestrian infrastructure inspection',
          userContext: address || 'Civic corridor inspection',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setApiError({
          code: data.error || `HTTP_${response.status}`,
          message: data.message || 'Image analysis failed.',
          setupInstructions: data.setupInstructions,
        });
        setIsAnalyzing(false);
        return;
      }

      // Success with live Gemini
      setAnalysisResult(data.analysis);
      setIsDemoSimulation(false);
      syncAnalysisToForm(data.analysis);
    } catch (err: any) {
      setApiError({
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to reach server-side analysis endpoint.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Trigger Demo Simulation Fallback ────────────────────
  const triggerDemoSimulation = async () => {
    setIsAnalyzing(true);
    setApiError(null);

    try {
      const response = await fetch('/api/analyze-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview || undefined,
          mimeType: imageMime,
          userContext: title || 'Demo inspection',
          description: description || title || 'Pedestrian barrier inspection',
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        setIsDemoSimulation(true);
        setSimulationNotice(data.simulationNotice);
        syncAnalysisToForm(data.analysis);
      }
    } catch (err: any) {
      setApiError({
        code: 'SIMULATION_ERROR',
        message: 'Could not execute demo simulation fallback.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Map AI analysis to editable form fields
  const syncAnalysisToForm = (analysis: CivicIssueAnalysisResult) => {
    if (analysis.category) {
      const matchedCat = CATEGORIES.find(([k]) =>
        analysis.category.toLowerCase().includes(k)
      );
      if (matchedCat && !category) {
        setCategory(matchedCat[0]);
      }
    }

    if (analysis.severity && !severity) {
      const p = analysis.severity.toLowerCase() as Severity;
      if (['low', 'moderate', 'high', 'critical'].includes(p)) {
        setSeverity(p);
      }
    }

    if (analysis.summary && !description) {
      setDescription(analysis.summary);
    }

    if (analysis.title && !title) {
      setTitle(analysis.title);
    }
  };

  // Handle Link as Duplicate
  const handleLinkAsDuplicate = (matchId: string) => {
    setLinkedDuplicateOf(matchId);
    setHasDismissedDuplicates(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!title.trim() || title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters.';
    }
    if (!description.trim() || description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
    }
    if (!category) {
      newErrors.category = 'Please choose a barrier category.';
    }
    if (!severity) {
      newErrors.severity = 'Please choose a severity level.';
    }
    if (!address.trim()) {
      newErrors.address = 'Location address or landmark is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmissionProgress('Submitting to civic ledger...');

    try {
      const report = await addBarrier({
        title,
        description,
        category: category as BarrierCategory,
        severity: severity as Severity,
        address,
        lat,
        lng,
        imageUrl: imagePreview || undefined,
        duplicateOf: linkedDuplicateOf,
        reportedBy: reporterName,
        aiAnalysis: analysisResult,
      });

      setIsSubmitting(false);
      setSubmittedReportId(report.id);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrors({ form: err.message || 'Submission failed. Please retry.' });
    }
  };

  // ── Success Screen ──────────────────────────────────────
  if (submittedReportId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-4 animate-fade-in">
        <div className="text-center max-w-lg bg-white rounded-3xl p-8 border border-[#e2e8e3] shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#eef9f2] border-2 border-[#b7e4c7] flex items-center justify-center text-[#1b4332]">
            <CheckCircle className="w-9 h-9" />
          </div>

          <span className="text-[11px] font-bold text-[#1b4332] bg-[#eef9f2] px-3 py-1 rounded-full uppercase tracking-wider">
            Issue Published
          </span>

          <h2 className="text-2xl font-black text-[#132a1c] mt-2 mb-2">
            Civic Barrier Registered in Corridor Ledger
          </h2>

          <p className="text-xs sm:text-sm text-[#3b5245] mb-6 leading-relaxed">
            Your report with AI diagnostic inspection has been indexed. Changes are saved permanently in the database and visible in the community dashboard.
          </p>

          <div className="bg-[#f8faf8] rounded-2xl p-4 text-left text-xs space-y-2 mb-6 border border-[#e2e8e3]">
            <div className="flex justify-between text-[#65796f]">
              <span>Tracking ID:</span>
              <strong className="font-mono text-[#1b4332]">{submittedReportId}</strong>
            </div>
            <div className="flex justify-between text-[#65796f]">
              <span>Title:</span>
              <span className="truncate max-w-[220px] font-medium text-[#132a1c]">{title}</span>
            </div>
            <div className="flex justify-between text-[#65796f]">
              <span>Category:</span>
              <span className="text-[#132a1c] font-medium">
                {category ? BARRIER_LABELS[category] : ''}
              </span>
            </div>
            {linkedDuplicateOf && (
              <div className="flex justify-between text-[#7c3aed]">
                <span>Linked Duplicate:</span>
                <span className="font-mono font-bold">Issue #{linkedDuplicateOf}</span>
              </div>
            )}
            <div className="flex justify-between text-[#65796f]">
              <span>Severity:</span>
              <span className="font-bold uppercase text-[#c2410c]">{severity}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/issues/${submittedReportId}`}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold transition-all shadow-sm"
            >
              <FileCheck2 className="w-4 h-4 text-[#52b788]" />
              View Issue Details
            </Link>

            <Link
              to="/community"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#f0f4f1] hover:bg-[#e2e8e3] text-[#132a1c] text-xs font-bold transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              Community Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-16">
      {/* ── Subheader with Live Gemini Status Indicator ─────────── */}
      <section className="bg-gradient-to-r from-[#132a1c] via-[#1b4332] to-[#24523d] text-white border-b border-[#2d6a4f]/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8f3dc]/15 text-[#d8f3dc] text-xs font-semibold uppercase tracking-wider mb-2">
                <Camera className="w-3.5 h-3.5 text-[#52b788]" />
                CivicLens AI Vision & Intake
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Report a Barrier with AI Vision Inspection
              </h1>
              <p className="text-xs sm:text-sm text-[#d8f3dc]/80 mt-1 max-w-2xl leading-relaxed">
                Analyze photo evidence with genuine Gemini 2.5 Flash for curb drop compliance, sidewalk lip detection, and intelligent duplicate triage.
              </p>
            </div>

            {/* Backend Engine Status Indicator */}
            <div className="self-start sm:self-auto bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 text-xs">
              <div className="flex items-center gap-2 font-bold">
                {serverStatus?.geminiConfigured ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#52b788] animate-pulse" />
                    <span>Gemini 2.5 Flash Connected</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffd166]" />
                    <span className="text-[#ffd166]">API Key Setup Ready</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-[#d8f3dc]/70 mt-0.5">
                {serverStatus?.geminiConfigured
                  ? 'Official @google/genai SDK active'
                  : 'Backend endpoint active at /api/analyze-civic-issue'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Evaluator 1-Click Sample Evidence Presets */}
        <div className="bg-[#eef9f2] border border-[#b7e4c7] rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#1b4332] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2d6a4f]" />
              1-Click Evidence Presets (Instant Evaluator Testing)
            </span>
            <span className="text-[11px] text-[#2d6a4f]">Click any preset to trigger server analysis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAMPLE_EVIDENCE.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="text-left p-3 rounded-xl bg-white border border-[#b7e4c7] hover:border-[#2d6a4f] hover:shadow-xs transition-all text-xs"
              >
                <p className="font-bold text-[#132a1c] line-clamp-1">{sample.thumbnail}</p>
                <p className="text-[11px] text-[#65796f] mt-0.5 line-clamp-1">{sample.address}</p>
                <span className="mt-1.5 inline-block text-[10px] font-bold text-[#1b4332] uppercase">
                  Analyze Preset &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Two-Column Layout: Evidence & Side-by-Side Analysis ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5 cols): Photo Upload & Side-by-Side Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-[#e2e8e3] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#132a1c] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#2d6a4f]" />
                  Uploaded Evidence Photo
                </label>
                {imageName && (
                  <span className="text-[10px] text-[#65796f] font-mono truncate max-w-[140px]">
                    {imageName}
                  </span>
                )}
              </div>

              {/* Photo Upload Zone or Preview */}
              {imagePreview ? (
                <div className="relative rounded-2xl border border-[#e2e8e3] overflow-hidden bg-[#0b1d13] group">
                  <img
                    src={imagePreview}
                    alt="Uploaded pedestrian barrier evidence"
                    className="w-full h-64 object-contain"
                  />

                  {/* Overlay Actions */}
                  <div className="absolute bottom-2 left-2 right-2 p-2 bg-[#0b1d13]/80 backdrop-blur-md rounded-xl flex items-center justify-between text-xs text-white">
                    <span className="text-[11px] text-[#d8f3dc] truncate max-w-[160px]">
                      {imageName || 'Selected photo'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          triggerRealAnalysis(imagePreview, imageMime, title, description)
                        }
                        disabled={isAnalyzing}
                        title="Re-run Server Analysis"
                        className="px-2.5 py-1 bg-[#1b4332] hover:bg-[#2d6a4f] text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                      >
                        <RotateCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        Re-Analyze
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageName(null);
                          setAnalysisResult(null);
                          setApiError(null);
                        }}
                        className="p-1 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#e2e8e3] hover:border-[#2d6a4f] rounded-2xl p-8 text-center hover:bg-[#eef9f2]/30 transition-all cursor-pointer group"
                >
                  <Upload className="w-10 h-10 text-[#65796f] mx-auto mb-2 group-hover:text-[#1b4332] transition-colors" />
                  <p className="text-xs sm:text-sm font-bold text-[#132a1c]">
                    Upload barrier photo for Gemini Vision
                  </p>
                  <p className="text-[11px] text-[#65796f] mt-1 leading-relaxed">
                    Select JPEG, PNG, or WebP up to 10MB.<br />
                    Server model identifies lip height, missing curb ramps & obstructions.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Photo Analysis Status Info */}
              <div className="text-[11px] text-[#65796f] bg-[#f8faf8] p-3 rounded-xl border border-[#e2e8e3] space-y-1">
                <p className="font-semibold text-[#132a1c] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2d6a4f]" /> Photo Quality Standards
                </p>
                <p>Ensure curb edge or crack is clearly lit from pedestrian perspective.</p>
              </div>
            </div>

            {/* AI Safety and Honesty Notice */}
            <div className="bg-[#f0f4f1] rounded-2xl p-4 border border-[#e2e8e3] text-xs text-[#3b5245] space-y-1.5">
              <p className="font-bold text-[#132a1c] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#1b4332]" /> AI Safety & Honesty Protocol
              </p>
              <ul className="text-[11px] text-[#65796f] list-disc list-inside space-y-1 leading-relaxed">
                <li>AI priorities are recommendations, not official municipal determinations.</li>
                <li>Exact measurements are never asserted without physical survey instruments.</li>
                <li>Single photos never confer total route accessibility status.</li>
              </ul>
            </div>
          </div>

          {/* Right Column (7 cols): Analysis Results, Duplicate Detection & Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* ── Real Analysis Card / Loading / Error State ── */}
            <div className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2d6a4f]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#132a1c]">
                    Server-Side Gemini Analysis Results
                  </h2>
                </div>

                {isAnalyzing ? (
                  <span className="flex items-center gap-1.5 text-xs text-[#2d6a4f] font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing with Gemini...
                  </span>
                ) : analysisResult ? (
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isDemoSimulation
                        ? 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                        : 'bg-[#eef9f2] text-[#1b4332] border border-[#b7e4c7]'
                    }`}
                  >
                    {isDemoSimulation ? 'Demo Simulation' : 'Gemini 2.5 Flash Verified'}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#65796f]">Awaiting photo</span>
                )}
              </div>

              {/* State A: Loading Spinner */}
              {isAnalyzing && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#eef9f2] border border-[#b7e4c7] flex items-center justify-center text-[#1b4332]">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#132a1c]">
                      Transmitting to server-side Gemini 2.5 Flash pipeline...
                    </h3>
                    <p className="text-xs text-[#65796f] mt-1 max-w-sm">
                      Evaluating surface displacement, curb ramp continuity, and pedestrian clearance parameters.
                    </p>
                  </div>
                </div>
              )}

              {/* State B: Error / Missing Key Setup Banner */}
              {!isAnalyzing && apiError && (
                <div className="p-4 rounded-2xl bg-[#fffbeb] border border-[#fde68a] text-xs text-[#b45309] space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-sm font-bold text-[#92400e]">
                        {apiError.code === 'GEMINI_API_KEY_NOT_CONFIGURED'
                          ? 'Gemini API Key Required on Server'
                          : `Server Analysis Notice (${apiError.code})`}
                      </strong>
                      <p className="leading-relaxed text-[#78350f]">{apiError.message}</p>
                    </div>
                  </div>

                  {apiError.setupInstructions && (
                    <div className="bg-white/80 p-3.5 rounded-xl border border-[#fde68a] text-[11px] space-y-1.5 text-[#78350f]">
                      <p className="font-bold flex items-center gap-1 text-[#92400e]">
                        <Terminal className="w-3.5 h-3.5" /> Setup Instructions to Enable Live Vision:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 font-mono text-[10px]">
                        <li>{apiError.setupInstructions.step1}</li>
                        <li className="font-bold text-[#1b4332] bg-[#f8faf8] p-1 rounded">
                          {apiError.setupInstructions.step2}
                        </li>
                        <li>{apiError.setupInstructions.step3}</li>
                      </ol>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        imagePreview && triggerRealAnalysis(imagePreview, imageMime, title, description)
                      }
                      className="px-3.5 py-2 bg-[#92400e] hover:bg-[#78350f] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> Retry Live Request
                    </button>

                    <button
                      type="button"
                      onClick={triggerDemoSimulation}
                      className="px-3.5 py-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#52b788]" /> Test with Demo Simulation
                    </button>
                  </div>
                </div>
              )}

              {/* State C: Simulation Notice Banner */}
              {!isAnalyzing && isDemoSimulation && simulationNotice && (
                <div className="p-3 bg-[#fef3c7] rounded-xl border border-[#fde68a] text-xs text-[#92400e] flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Demo Simulation Notice:</strong> {simulationNotice}
                  </p>
                </div>
              )}

              {/* State D: Render Structured Cards for all 9 fields */}
              {!isAnalyzing && analysisResult && (
                <div className="space-y-3.5 text-xs">
                  {/* Category, Severity, and Recommended Priority */}
                  <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#65796f] block">
                        Category Classification
                      </span>
                      <strong className="text-sm text-[#132a1c] capitalize flex items-center gap-1.5 mt-0.5">
                        <span>{BARRIER_ICONS[analysisResult.category as BarrierCategory] || '📌'}</span>
                        {BARRIER_LABELS[analysisResult.category as BarrierCategory] || analysisResult.category.replace(/_/g, ' ')}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#65796f] block">
                        Recommended Priority Score
                      </span>
                      <span className="text-sm font-black uppercase text-[#c2410c] bg-[#fff7ed] px-2.5 py-0.5 rounded-full border border-[#ffedd5] inline-block mt-0.5">
                        {analysisResult.recommended_priority_score} / 100 ({analysisResult.severity})
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3]">
                    <span className="text-[10px] uppercase font-bold text-[#65796f] block mb-1">
                      Summary
                    </span>
                    <p className="text-xs text-[#132a1c] leading-relaxed">
                      {analysisResult.summary}
                    </p>
                  </div>

                  {/* Supporting Evidence */}
                  <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3]">
                    <span className="text-[10px] uppercase font-bold text-[#65796f] block mb-1.5">
                      Supporting Observable Evidence
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-[#3b5245] leading-relaxed">
                      {analysisResult.supporting_evidence.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggested Responsible Team */}
                  <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#65796f] block">
                        Suggested Responsible Team
                      </span>
                      <p className="text-xs font-bold text-[#132a1c] mt-0.5">
                        {analysisResult.suggested_responsible_team}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#65796f] bg-white px-2 py-0.5 rounded border border-[#e2e8e3]">
                      Advisory
                    </span>
                  </div>

                  {/* Confidence and Uncertainty */}
                  <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3]">
                    <span className="text-[10px] uppercase font-bold text-[#65796f] block mb-1">
                      Confidence & Uncertainty
                    </span>
                    <p className="text-xs text-[#3b5245] leading-relaxed">
                      {analysisResult.confidence_and_uncertainty}
                    </p>
                  </div>

                  {/* Recommended Next Action */}
                  <div className="p-3.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e3]">
                    <span className="text-[10px] uppercase font-bold text-[#65796f] block mb-1.5">
                      Recommended Next Actions
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.recommended_next_action.map((step, i) => (
                        <span
                          key={i}
                          className="bg-white text-[#1b4332] border border-[#b7e4c7] px-2.5 py-1 rounded-lg text-[11px] font-medium"
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Information Requiring Clarification */}
                  <div className="p-3.5 rounded-2xl bg-[#fffbeb] border border-[#fde68a]">
                    <span className="text-[10px] uppercase font-bold text-[#92400e] block mb-0.5">
                      Missing Information Requiring Ground Clarification
                    </span>
                    <p className="text-xs text-[#78350f] leading-relaxed">
                      {analysisResult.missing_information_requiring_clarification}
                    </p>
                  </div>

                  {/* Mandatory Human Verification Badge */}
                  <div className="p-3 rounded-xl bg-[#eef9f2] border border-[#b7e4c7] flex items-center justify-between text-[11px] text-[#1b4332]">
                    <span className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#2d6a4f]" />
                      Human Verification Requirement
                    </span>
                    <strong className="bg-white px-2 py-0.5 rounded border border-[#b7e4c7]">
                      Mandatory Ground Survey Required
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* ── Real-Time Duplicate Detection Panel ─────────── */}
            {potentialDuplicates.length > 0 && !hasDismissedDuplicates && !linkedDuplicateOf && (
              <div className="p-5 rounded-3xl bg-[#fbf7fe] border-2 border-[#d8b4fe] shadow-sm space-y-4 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Copy className="w-5 h-5 text-[#7c3aed]" />
                    <div>
                      <h3 className="text-sm font-black text-[#581c87]">
                        Potential Duplicate Issues Detected nearby ({potentialDuplicates.length})
                      </h3>
                      <p className="text-xs text-[#6b21a8]">
                        We found active reports with similar text, category, or location. You can link this report as a duplicate to track recurrence without silently discarding it.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasDismissedDuplicates(true)}
                    className="p-1 rounded-lg text-[#7c3aed] hover:bg-[#eedcfd] transition-colors"
                    title="Dismiss duplicate notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {potentialDuplicates.slice(0, 3).map((match) => (
                    <div
                      key={match.existingReportId}
                      className="p-3.5 rounded-2xl bg-white border border-[#e9d5ff] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#6b21a8]">
                          {match.existingReportId}
                        </span>
                        <span className="font-black text-xs text-[#6b21a8] bg-[#f3e8ff] px-2 py-0.5 rounded-full border border-[#d8b4fe]">
                          {match.similarityScore}% Match
                        </span>
                      </div>

                      <p className="font-bold text-[#1f2937]">{match.existingTitle}</p>

                      <div className="text-[11px] text-[#6b7280] space-y-0.5">
                        <p>Location: {match.location.address}</p>
                        {match.location.distanceMeters !== undefined && (
                          <p>Distance: ~{match.location.distanceMeters}m away</p>
                        )}
                        <p>Status: <strong className="capitalize">{match.currentStatus}</strong></p>
                      </div>

                      {/* Evidence bullets */}
                      <ul className="list-disc list-inside text-[11px] text-[#4b5563] space-y-0.5 pt-1 border-t border-[#f3e8ff]">
                        {match.matchingEvidence.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>

                      {/* Action Button */}
                      <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleLinkAsDuplicate(match.existingReportId)}
                          className="px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Link as Duplicate to #{match.existingReportId}
                        </button>

                        <Link
                          to={`/issues/${match.existingReportId}`}
                          target="_blank"
                          className="text-[11px] text-[#7c3aed] hover:underline flex items-center gap-1"
                        >
                          Inspect #{match.existingReportId}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-[#6b21a8]">
                    Prefer to file as a distinct, independent obstacle?
                  </span>
                  <button
                    type="button"
                    onClick={() => setHasDismissedDuplicates(true)}
                    className="font-bold text-[#581c87] hover:underline"
                  >
                    Continue as Distinct Issue &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Linked Duplicate Confirmation Banner */}
            {linkedDuplicateOf && (
              <div className="p-3.5 rounded-2xl bg-[#f5f3ff] border border-[#d8b4fe] text-xs text-[#6b21a8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-[#7c3aed]" />
                  <span>
                    Linked as duplicate of <strong>Issue #{linkedDuplicateOf}</strong>. Submitting will register this occurrence and increment corridor recurrence weight.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLinkedDuplicateOf(null)}
                  className="text-[11px] font-bold underline hover:text-[#581c87]"
                >
                  Unlink
                </button>
              </div>
            )}

            {/* ── Editable Report Submission Form ─────────────── */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl border border-[#e2e8e3] p-6 shadow-xs space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#2d6a4f]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#132a1c]">
                    Review & Edit Report Fields
                  </h2>
                </div>
                <span className="text-[11px] text-[#65796f]">User edits override AI suggestions</span>
              </div>

              {errors.form && (
                <div className="p-3 rounded-xl bg-[#fee2e2] border border-[#fecaca] text-xs text-[#b91c1c] font-semibold">
                  {errors.form}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#132a1c] mb-1.5">
                  Barrier Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 9cm Concrete Slab Offset at Cyber Towers Walkway"
                  className={`w-full px-4 py-2.5 bg-[#f8faf8] border rounded-xl text-xs sm:text-sm text-[#132a1c] placeholder:text-[#65796f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] ${
                    errors.title ? 'border-[#b91c1c]' : 'border-[#e2e8e3]'
                  }`}
                />
                {errors.title && (
                  <p className="text-[11px] text-[#b91c1c] mt-1 font-semibold">{errors.title}</p>
                )}
              </div>

              {/* Category & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#132a1c] mb-1.5">
                    Category (Editable) *
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as BarrierCategory)}
                      className={`w-full px-4 py-2.5 bg-[#f8faf8] border rounded-xl text-xs sm:text-sm text-[#132a1c] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] font-medium ${
                        errors.category ? 'border-[#b91c1c]' : 'border-[#e2e8e3]'
                      }`}
                    >
                      <option value="">Select barrier classification...</option>
                      {CATEGORIES.map(([key, label]) => (
                        <option key={key} value={key}>
                          {BARRIER_ICONS[key]} {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#65796f] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.category && (
                    <p className="text-[11px] text-[#b91c1c] mt-1 font-semibold">
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#132a1c] mb-1.5">
                    Severity Rating *
                  </label>
                  <div className="relative">
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as Severity)}
                      className={`w-full px-4 py-2.5 bg-[#f8faf8] border rounded-xl text-xs sm:text-sm text-[#132a1c] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] font-medium ${
                        errors.severity ? 'border-[#b91c1c]' : 'border-[#e2e8e3]'
                      }`}
                    >
                      <option value="">Select severity level...</option>
                      <option value="low">Low — Minor surface irregularity</option>
                      <option value="moderate">Moderate — Impedes manual wheelchair or stroller</option>
                      <option value="high">High — Dangerous trip hazard or heavy slope</option>
                      <option value="critical">Critical — Absolute impassable blockage</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#65796f] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.severity && (
                    <p className="text-[11px] text-[#b91c1c] mt-1 font-semibold">
                      {errors.severity}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#132a1c] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#2d6a4f]" />
                  Location Address or Landmark *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Cyber Towers Junction, Hitec City Road, Hyderabad"
                  className={`w-full px-4 py-2.5 bg-[#f8faf8] border rounded-xl text-xs sm:text-sm text-[#132a1c] placeholder:text-[#65796f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] ${
                    errors.address ? 'border-[#b91c1c]' : 'border-[#e2e8e3]'
                  }`}
                />
                {errors.address && (
                  <p className="text-[11px] text-[#b91c1c] mt-1 font-semibold">{errors.address}</p>
                )}
              </div>

              {/* Description (editable) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#132a1c] mb-1.5">
                  Description & Context Notes *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe step height, bypass availability, lighting, and wheelchair accessibility notes..."
                  className={`w-full px-4 py-2.5 bg-[#f8faf8] border rounded-xl text-xs sm:text-sm text-[#132a1c] placeholder:text-[#65796f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] resize-none leading-relaxed ${
                    errors.description ? 'border-[#b91c1c]' : 'border-[#e2e8e3]'
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] text-[#b91c1c] mt-1 font-semibold">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] disabled:bg-[#65796f] text-white font-bold text-sm transition-all shadow-md active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#d8f3dc]" />
                    <span>{submissionProgress}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {linkedDuplicateOf
                        ? `Submit as Duplicate of Issue #${linkedDuplicateOf}`
                        : 'Submit Report to Civic Ledger'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
