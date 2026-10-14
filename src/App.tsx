import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  Compass,
  AlertTriangle,
  Users,
  Info,
  Menu,
  X,
  Sparkles,
  Home as HomeIcon,
  ShieldCheck,
  MapPin,
  Loader2,
} from 'lucide-react';
import { useBarriers } from './context/BarrierContext';

// Fast, route-level code splitting
const Home = lazy(() => import('./pages/Home'));
const ExploreRoutes = lazy(() => import('./pages/ExploreRoutes'));
const ReportBarrier = lazy(() => import('./pages/ReportBarrier'));
const CommunityDashboard = lazy(() => import('./pages/CommunityDashboard'));
const AboutMethodology = lazy(() => import('./pages/AboutMethodology'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-[#2d6a4f]" role="status" aria-label="Loading page">
      <Loader2 className="w-8 h-8 animate-spin text-[#2d6a4f]" />
      <span className="text-sm font-semibold tracking-wide text-[#40534c]">Loading view...</span>
    </div>
  );
}

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: HomeIcon, ariaLabel: 'Home and Overview' },
  { path: '/explore', label: 'Accessibility Explorer', icon: Compass, ariaLabel: 'Explore Accessible Routes' },
  { path: '/report', label: 'Report Barrier', icon: AlertTriangle, ariaLabel: 'Report a Pedestrian Barrier' },
  { path: '/community', label: 'Community Dashboard', icon: Users, ariaLabel: 'Community Reports & Metrics' },
  { path: '/methodology', label: 'About & Methodology', icon: Info, ariaLabel: 'AI Scoring Methodology' },
];

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { barriers } = useBarriers();

  const openBarriersCount = barriers.filter((b) => b.status === 'pending').length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8faf8] text-[#132a1c]">
      {/* ── Desktop Sidebar ─────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0b1d13] text-white shrink-0 border-r border-[#1b4332]/60">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1b4332]/70 bg-[#0e2418]">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] border border-[#52b788]/30 shadow-sm text-white">
            <Compass className="w-5 h-5 text-[#95d5b2]" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white block">
              CivicLens AI
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#95d5b2] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#52b788]" />
              Civic Infrastructure Platform
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
          {NAV_ITEMS.map(({ path, label, icon: Icon, ariaLabel }) => {
            const isActive =
              path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

            return (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                aria-label={ariaLabel}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1b4332] text-white shadow-xs border border-[#2d6a4f]/50'
                    : 'text-[#95d5b2]/80 hover:bg-[#132a1c] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#52b788]' : 'text-[#95d5b2]/70'}`} />
                  <span>{label}</span>
                </div>

                {path === '/community' && openBarriersCount > 0 && (
                  <span className="text-[10px] bg-[#c2410c] text-white px-1.5 py-0.2 rounded-full font-bold">
                    {openBarriersCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Metric */}
        <div className="p-4 border-t border-[#1b4332]/70 bg-[#0e2418]/60">
          <div className="rounded-2xl bg-[#132a1c] border border-[#1b4332] p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#95d5b2] font-bold">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#52b788]" /> Corridor Status
              </span>
              <span className="w-2 h-2 rounded-full bg-[#52b788] animate-pulse" />
            </div>

            <p className="text-[11px] text-[#d8f3dc]/80 leading-relaxed">
              Hitec City, Hyderabad corridor active with {barriers.length} indexed obstacles.
            </p>

            <div className="pt-2 border-t border-[#1b4332]/80 flex items-center justify-between text-[10px] text-[#95d5b2]">
              <span>Ground Verified:</span>
              <strong className="text-white">
                {barriers.filter((b) => b.status === 'verified').length}
              </strong>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Layout Container ──────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0b1d13] text-white border-b border-[#1b4332] shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1b4332] flex items-center justify-center text-[#52b788]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight block">CivicLens AI</span>
              <span className="text-[10px] text-[#95d5b2] block leading-none">Civic Infrastructure Platform</span>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-[#132a1c] hover:bg-[#1b4332] text-white transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="lg:hidden absolute top-14 left-0 right-0 z-50 bg-[#0b1d13] border-b border-[#1b4332] shadow-xl animate-fade-in p-3 space-y-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-[#1b4332] text-white'
                      : 'text-[#95d5b2] hover:bg-[#132a1c] hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        )}

        {/* ── Main Viewport ─────────────────────────── */}
        <main className="flex-1 overflow-y-auto" id="main-content">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<ExploreRoutes />} />
              <Route path="/report" element={<ReportBarrier />} />
              <Route path="/community" element={<CommunityDashboard />} />
              <Route path="/methodology" element={<AboutMethodology />} />
              <Route path="/issues/:id" element={<ReportDetail />} />
              <Route path="/reports/:id" element={<ReportDetail />} />
            </Routes>
          </Suspense>
        </main>

        {/* ── Mobile Bottom Navigation Bar ──────────── */}
        <nav className="lg:hidden flex items-center justify-around bg-white border-t border-[#e2e8e3] py-2 px-1 shadow-sm shrink-0">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive =
              path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

            return (
              <NavLink
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  isActive ? 'text-[#1b4332]' : 'text-[#65796f] hover:text-[#132a1c]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1b4332]' : 'text-[#65796f]'}`} />
                <span className="truncate max-w-[62px]">{label.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
