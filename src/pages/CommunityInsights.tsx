import { useState, useMemo } from 'react';
import {
  Users,
  Heart,
  MessageSquare,
  Lightbulb,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import { useBarriers } from '../context/BarrierContext';
import type { CommunityInsight } from '../types/models';

const CATEGORY_CONFIG: Record<
  CommunityInsight['category'],
  { icon: typeof Lightbulb; label: string; color: string; bg: string }
> = {
  tip: { icon: Lightbulb, label: 'Access Tip', color: '#0d9488', bg: '#f0fdfa' },
  experience: { icon: MessageSquare, label: 'Pedestrian Experience', color: '#6366f1', bg: '#eef2ff' },
  suggestion: { icon: TrendingUp, label: 'Civic Suggestion', color: '#8b5cf6', bg: '#f5f3ff' },
  alert: { icon: AlertCircle, label: 'Hazard Alert', color: '#ef4444', bg: '#fef2f2' },
};

export default function CommunityInsightsPage() {
  const { insights, addInsight, likeInsight } = useBarriers();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Insight Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState<CommunityInsight['category']>('tip');
  const [newTags, setNewTags] = useState('hitec-city, pedestrian');

  const filtered = useMemo(() => {
    return insights.filter((insight) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        insight.title.toLowerCase().includes(q) ||
        insight.content.toLowerCase().includes(q) ||
        insight.tags.some((t) => t.toLowerCase().includes(q));
      const matchesCategory = filterCategory === 'all' || insight.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [insights, searchQuery, filterCategory]);

  const handleCreateInsight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    addInsight({
      title: newTitle,
      content: newContent,
      author: newAuthor || 'Community Contributor',
      category: newCategory,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
    });

    setNewTitle('');
    setNewContent('');
    setNewAuthor('');
    setShowAddModal(false);
  };

  return (
    <div className="animate-fade-in pb-12">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-navy-900 via-indigo-900 to-navy-800 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" />
                Crowdsourced Civic Knowledge
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Community Accessibility Insights
              </h1>
              <p className="mt-1 text-indigo-200 text-sm max-w-xl">
                Real-world tips, transit detours, safe walkway routes, and civic advocacy shared by local pedestrians and wheelchair users.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-950/40 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Share Insight
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search accessible venues, metro tips, detours, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-xl text-xs sm:text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-surface-alt p-1 rounded-xl">
            {(['all', 'tip', 'experience', 'suggestion', 'alert'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                  filterCategory === cat
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-navy-600 hover:text-navy-900 hover:bg-white/60'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Insights Stream */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-border p-8">
            <Search className="w-12 h-12 text-navy-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-navy-800">No matching insights found</h3>
            <p className="text-xs text-navy-500 mt-1">Try modifying your keyword search or filter category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((insight) => {
              const config = CATEGORY_CONFIG[insight.category];
              const Icon = config.icon;

              return (
                <article
                  key={insight.id}
                  className="bg-white rounded-2xl border border-border p-5 sm:p-6 hover:shadow-md hover:border-indigo-200 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: config.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="text-base sm:text-lg font-bold text-navy-900 leading-snug">
                          {insight.title}
                        </h3>
                        <span
                          className="shrink-0 text-[11px] font-extrabold px-3 py-1 rounded-full"
                          style={{ color: config.color, backgroundColor: config.bg }}
                        >
                          {config.label}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-navy-600 leading-relaxed mb-4">
                        {insight.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        {insight.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-medium bg-navy-50 text-navy-600 px-2.5 py-0.5 rounded-lg border border-navy-100"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-navy-500">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-navy-800">{insight.author}</span>
                          <span>•</span>
                          <span>
                            {new Date(insight.createdAt).toLocaleDateString('en-IN', {
                              dateStyle: 'medium',
                            })}
                          </span>
                        </div>

                        <button
                          onClick={() => likeInsight(insight.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50/60 hover:bg-rose-50 text-rose-600 transition-all font-semibold active:scale-95"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                          <span>{insight.likes} Helpful</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Share Insight Modal ──────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Share Accessibility Insight
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-surface-alt rounded-full text-navy-400 hover:text-navy-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInsight} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                  Insight Headline *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Inorbit Mall West Gate Step-Free Entrance Guide"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                  >
                    <option value="tip">Access Tip</option>
                    <option value="experience">Pedestrian Experience</option>
                    <option value="suggestion">Civic Suggestion</option>
                    <option value="alert">Hazard Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                    Your Name / Pseudonym
                  </label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. AccessChampion"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                  Content & Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share details on curb cuts, accessible restrooms, elevator keys, or construction bypasses..."
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. hitec-city, metro, elevators"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-surface-alt hover:bg-navy-100 text-navy-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Insight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
