import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  CircleMarker,
} from 'react-leaflet';
import L from 'leaflet';
import {
  BARRIER_ICONS,
  BARRIER_LABELS,
  SEVERITY_CONFIG,
  VERIFICATION_CONFIG,
  type BarrierReport,
  type Route as RouteType,
  type LandmarkLocation,
} from '../types/models';
import { MAP_CENTER, MAP_ZOOM, DEMO_LANDMARKS } from '../data/demo';
import { MapPin, Navigation, Loader2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

// Fix Leaflet default icon path issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function createBarrierIcon(report: BarrierReport): L.DivIcon {
  const severity = SEVERITY_CONFIG[report.severity];
  const emoji = BARRIER_ICONS[report.category] || '⚠️';
  const isVerified = report.status === 'verified';

  return L.divIcon({
    className: '',
    html: `
      <div class="barrier-marker" style="border-color: ${severity.color};">
        <span>${emoji}</span>
        ${isVerified ? '<span style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#1b4332;border:1.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:8px;">✓</span>' : ''}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function createLandmarkIcon(name: string, isOrigin: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div class="landmark-marker" style="background:${isOrigin ? '#1b4332' : '#0b1d13'};border-color:${isOrigin ? '#52b788' : '#ffd166'};">
        ${isOrigin ? 'A' : 'B'}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Center controller when route or coordinates change
function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true });
  }, [center, map]);
  return null;
}

interface AccessibilityMapProps {
  barriers: BarrierReport[];
  routes: RouteType[];
  selectedRoute: string | null;
  originLocation?: LandmarkLocation;
  destLocation?: LandmarkLocation;
  onBarrierClick?: (barrier: BarrierReport) => void;
  className?: string;
}

export default function AccessibilityMap({
  barriers,
  routes,
  selectedRoute,
  originLocation,
  destLocation,
  onBarrierClick,
  className = '',
}: AccessibilityMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [tileError, setTileError] = useState(false);

  // Compute map center based on origin or selected route
  const currentCenter: [number, number] = originLocation
    ? originLocation.coordinates
    : MAP_CENTER;

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-xs border border-[#e2e8e3] ${className}`}>
      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#f0f4f1]">
          <div className="flex flex-col items-center gap-2.5">
            <Loader2 className="w-7 h-7 text-[#1b4332] animate-spin" />
            <p className="text-xs text-[#3b5245] font-semibold">Initializing Corridor Map Tiles...</p>
          </div>
        </div>
      )}

      {/* Tile error graceful alert */}
      {tileError && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-[#fffbeb] border border-[#fde68a] text-[#b45309] px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Network connection slow. Retrying OpenStreetMap tiles...</span>
        </div>
      )}

      <MapContainer
        center={currentCenter}
        zoom={MAP_ZOOM}
        className="w-full h-full min-h-[420px]"
        zoomControl={true}
        whenReady={() => setMapReady(true)}
      >
        <MapResizer />
        <MapCenterController center={currentCenter} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => setTileError(false),
          }}
        />

        {/* ── Route Polylines ─────────────────────────── */}
        {routes.map((route) => {
          const isSelected = selectedRoute === null || selectedRoute === route.id;
          return route.segments.map((segment) => {
            const isUnsurveyed = !segment.isSurveyed;
            return (
              <Polyline
                key={segment.id}
                positions={segment.coordinates.map(([lat, lng]) => [lat, lng])}
                pathOptions={{
                  color: isSelected ? route.color : '#94a3b8',
                  weight: isSelected ? 6 : 3,
                  opacity: isSelected ? 0.95 : 0.35,
                  dashArray: isUnsurveyed ? '4 8' : route.accessibilityScore < 70 ? '8 6' : undefined,
                }}
              >
                <Popup>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-[#132a1c]">{route.name}</p>
                    <p className="text-[#3b5245]">{segment.name}</p>
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <span className="font-semibold text-[#1b4332]">{route.accessibilityScore}% Accessible</span>
                      <span>·</span>
                      <span>{segment.distance}m</span>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          });
        })}

        {/* ── Landmark Origin & Destination Markers ─────── */}
        {originLocation && (
          <Marker
            position={originLocation.coordinates}
            icon={createLandmarkIcon(originLocation.name, true)}
          >
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-[#1b4332] uppercase text-[10px] block">Origin (Start)</span>
                <strong className="text-sm text-[#132a1c]">{originLocation.name}</strong>
                <p className="text-[#65796f] mt-0.5">{originLocation.description}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {destLocation && (
          <Marker
            position={destLocation.coordinates}
            icon={createLandmarkIcon(destLocation.name, false)}
          >
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-[#b45309] uppercase text-[10px] block">Destination</span>
                <strong className="text-sm text-[#132a1c]">{destLocation.name}</strong>
                <p className="text-[#65796f] mt-0.5">{destLocation.description}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ── Barrier Markers ─────────────────────────── */}
        {barriers.map((barrier) => {
          const sev = SEVERITY_CONFIG[barrier.severity];
          const ver = VERIFICATION_CONFIG[barrier.status];

          return (
            <Marker
              key={barrier.id}
              position={[barrier.location.lat, barrier.location.lng]}
              icon={createBarrierIcon(barrier)}
              eventHandlers={{
                click: () => onBarrierClick?.(barrier),
              }}
            >
              <Popup maxWidth={300}>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[#132a1c] text-sm leading-snug">
                      {barrier.title}
                    </h3>
                    <span
                      className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: sev.color, backgroundColor: sev.bg }}
                    >
                      {sev.label}
                    </span>
                  </div>

                  <p className="text-[#3b5245] leading-relaxed line-clamp-2">
                    {barrier.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1.5 border-t border-gray-100 text-[11px] text-[#65796f]">
                    <span>{BARRIER_LABELS[barrier.category]}</span>
                    <span>·</span>
                    <span style={{ color: ver.color }} className="font-semibold">
                      {ver.label}
                    </span>
                    {barrier.isSampleData && (
                      <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                        Sample Data
                      </span>
                    )}
                  </div>

                  {barrier.aiAnalysis && (
                    <div className="mt-2 p-2 bg-[#eef9f2] rounded-lg border border-[#b7e4c7]/80 text-[#1b4332]">
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#2d6a4f]" /> AI Diagnostic
                        </span>
                        <span>{Math.round(barrier.aiAnalysis.confidence * 100)}% Confidence</span>
                      </div>
                      <p className="text-[11px] leading-tight">
                        Hazard Rating: <strong>{barrier.aiAnalysis.impactScore}/10</strong> ({barrier.aiAnalysis.suggestedPriority.toUpperCase()})
                      </p>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-[11px] text-[#65796f]">
                    <span>👍 {barrier.upvotes} upvotes</span>
                    <a
                      href={`#/issues/${barrier.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/issues/${barrier.id}`;
                      }}
                      className="text-[#1b4332] font-bold hover:underline"
                    >
                      Lifecycle Details &rarr;
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── Rich Civic Map Legend ───────────────────────── */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-[#e2e8e3] p-3 max-w-[210px] text-[11px]">
        <p className="font-bold text-[#132a1c] mb-1.5 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1b4332]" /> Map Intelligence Legend
        </p>

        <div className="space-y-1.5 text-[#3b5245]">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-[#1b4332] rounded" />
            <span>Verified Accessible (Solid)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 border-t-2 border-dashed border-[#c2410c]" />
            <span>Active Barriers (Dashed)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 border-t-2 border-dotted border-[#6b7280]" />
            <span>Unsurveyed / Sensor Gap</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <span className="w-3 h-3 rounded-full bg-white border-2 border-[#1b4332] flex items-center justify-center text-[7px] font-bold text-[#1b4332]">✓</span>
            <span>Verified Ground Truth</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white border-2 border-[#b45309]" />
            <span>Open Community Report</span>
          </div>
        </div>
      </div>
    </div>
  );
}
