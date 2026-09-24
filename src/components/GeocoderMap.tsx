import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  RotateCcw, 
  Search, 
  MapPin, 
  Crosshair, 
  Compass, 
  CheckCircle2, 
  Layers, 
  Info,
  Sparkles
} from 'lucide-react';
import { FlatTransaction, GeocoderResult, FlatType } from '../types/housing';
import { SINGAPORE_TOWNS, getTownSummaries } from '../data/singaporeHousingData';
import { 
  SINGAPORE_MAINLAND_OUTLINE, 
  REGIONAL_BOUNDARIES, 
  geocodeAddress, 
  latLngToCanvasXY 
} from '../utils/geocoder';

interface GeocoderMapProps {
  dataset: FlatTransaction[];
  selectedTown: string;
  onSelectTown: (town: string) => void;
  onSelectFlat: (flat: FlatTransaction) => void;
  maxBudget?: number;
}

export const GeocoderMap: React.FC<GeocoderMapProps> = ({
  dataset,
  selectedTown,
  onSelectTown,
  onSelectFlat,
  maxBudget = 750000,
}) => {
  const [mapMode, setMapMode] = useState<'psm' | 'affordability' | 'lease'>('psm');
  const [addressSearch, setAddressSearch] = useState<string>('Blk 212 Tampines St 21');
  const [geocodedTarget, setGeocodedTarget] = useState<GeocoderResult | null>(null);
  
  // Auto-Draw Animation State
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawProgress, setDrawProgress] = useState<number>(100); // 0 to 100
  const [drawStage, setDrawStage] = useState<string>('Map Complete');

  const townSummaries = useMemo(() => getTownSummaries(dataset), [dataset]);

  // Initial geocoding on mount
  useEffect(() => {
    const res = geocodeAddress(addressSearch);
    if (res) setGeocodedTarget(res);
  }, []);

  // Trigger Tab05 Geocoder Auto-Draw Sequence
  const triggerAutoDraw = () => {
    setIsDrawing(true);
    setDrawProgress(0);
    setDrawStage('Streaming Tab05 SVY21 Coordinates...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      setDrawProgress(progress);

      if (progress < 25) {
        setDrawStage('Tab05: Ingesting National Grid EPSG:3414 Boundaries...');
      } else if (progress < 55) {
        setDrawStage('Tab05: Projecting 5 Regional Subzones (SVY21 -> WGS84)...');
      } else if (progress < 85) {
        setDrawStage('Tab05: Triangulating 23 HDB Town Centroids & Elevation...');
      } else if (progress < 100) {
        setDrawStage('Tab05: Plotting Active Resale Transactions...');
      } else {
        clearInterval(interval);
        setIsDrawing(false);
        setDrawStage('Tab05 Auto-Draw Rendered Successfully');
      }
    }, 45);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = geocodeAddress(addressSearch);
    if (result) {
      setGeocodedTarget(result);
      onSelectTown(result.matchedTown);
    }
  };

  const activeTownData = townSummaries.find((t) => t.name === selectedTown) || townSummaries[0];

  // Helper for color coding towns
  const getTownFillColor = (townName: string, medianPrice: number, psm: number) => {
    if (mapMode === 'affordability') {
      if (medianPrice <= maxBudget * 0.90) return '#10b981'; // Green
      if (medianPrice <= maxBudget) return '#f59e0b'; // Amber
      return '#94a3b8'; // Grey
    }

    if (mapMode === 'psm') {
      // PSM range roughly 4800 to 9000
      if (psm > 7800) return '#0f172a'; // Deepest dark slate
      if (psm > 6500) return '#334155';
      if (psm > 5500) return '#64748b';
      return '#94a3b8';
    }

    // Default Lease
    return '#3b82f6';
  };

  // Convert geocoded target to map coordinates
  const targetMapXY = geocodedTarget
    ? latLngToCanvasXY(geocodedTarget.lat, geocodedTarget.lng)
    : { x: 78, y: 48 };

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-slate-900" />
              <span>Tab05 Geocoder Interactive Map</span>
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Singapore SVY21 national grid projection with dynamic auto-draw mapping and instant address resolution.
            </p>
          </div>

          {/* Action & Auto-Draw Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={triggerAutoDraw}
              disabled={isDrawing}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isDrawing ? 'Drawing Map...' : 'Run Tab05 Auto-Draw'}</span>
            </button>

            {/* Map Layer Mode Switcher */}
            <div className="flex bg-slate-100 p-0.5 rounded">
              <button
                onClick={() => setMapMode('psm')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  mapMode === 'psm'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Price / SQM
              </button>
              <button
                onClick={() => setMapMode('affordability')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  mapMode === 'affordability'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Budget Fit (&lt;${Math.round(maxBudget / 1000)}k)
              </button>
            </div>
          </div>
        </div>

        {/* Address Search Geocoder Bar */}
        <form onSubmit={handleAddressSubmit} className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                placeholder="Enter Singapore Address (e.g. 'Blk 123 Tampines', 'Bishan St 22', 'Punggol Walk')..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:border-slate-500 bg-white"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Geocode Address</span>
            </button>
          </div>

          {/* Geocoder Telemetry Display */}
          {geocodedTarget && (
            <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500 flex-wrap font-mono">
              <span className="text-slate-900 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Matched: {geocodedTarget.matchedTown}
              </span>
              <span aria-hidden="true">·</span>
              <span>WGS84: {geocodedTarget.lat}, {geocodedTarget.lng}</span>
              <span aria-hidden="true">·</span>
              <span>SVY21: E:{geocodedTarget.svy21_x} N:{geocodedTarget.svy21_y}</span>
              <span aria-hidden="true">·</span>
              <span>Confidence: {Math.round(geocodedTarget.confidence * 100)}%</span>
            </div>
          )}
        </form>
      </div>

      {/* Main Map Canvas & Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Geocoded Map Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between min-h-[460px]">
          {/* Map Header Status */}
          <div className="flex items-center justify-between text-xs text-slate-300 z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="font-mono text-[11px] text-slate-300">
                {drawStage}
              </span>
            </div>

            {/* Scale & Coordinate Grid Status */}
            <div className="font-mono text-[11px] text-slate-400">
              SVY21 / EPSG:3414 · Zoom 1.0x
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="relative w-full h-[360px] my-auto">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full filter drop-shadow"
            >
              {/* Coordinate Grid Lines */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />

              {/* Singapore Mainland Coastline with Auto-Draw strokeDashoffset */}
              <path
                d={SINGAPORE_MAINLAND_OUTLINE}
                fill={drawProgress > 30 ? '#1e293b' : 'none'}
                stroke="#475569"
                strokeWidth="0.8"
                strokeDasharray="400"
                strokeDashoffset={400 - (drawProgress / 100) * 400}
                className="transition-all duration-300"
              />

              {/* Regional Subzone Polygons */}
              {drawProgress > 40 &&
                Object.entries(REGIONAL_BOUNDARIES).map(([regName, pathD]) => (
                  <path
                    key={regName}
                    d={pathD}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="0.4"
                    strokeDasharray="1 1"
                  />
                ))}

              {/* Town Centroids & Heatmap Circles */}
              {drawProgress > 60 &&
                townSummaries.map((town) => {
                  const townCoords = SINGAPORE_TOWNS[town.name];
                  if (!townCoords) return null;

                  const isSelected = selectedTown === town.name;
                  const fillColor = getTownFillColor(town.name, town.medianPrice, town.medianPsm);

                  return (
                    <g
                      key={town.name}
                      onClick={() => onSelectTown(town.name)}
                      className="cursor-pointer group"
                    >
                      {/* Outer pulse when selected */}
                      {isSelected && (
                        <circle
                          cx={townCoords.mapX}
                          cy={townCoords.mapY}
                          r="5.5"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="0.7"
                          className="animate-ping origin-center"
                        />
                      )}

                      {/* Main Town Node */}
                      <circle
                        cx={townCoords.mapX}
                        cy={townCoords.mapY}
                        r={isSelected ? 3.2 : 2.2}
                        fill={fillColor}
                        stroke="#ffffff"
                        strokeWidth="0.6"
                        className="group-hover:scale-125 transition-transform"
                      />

                      {/* Quiet Town Name Label */}
                      <text
                        x={townCoords.mapX}
                        y={townCoords.mapY - 3.2}
                        textAnchor="middle"
                        className={`text-[3.2px] font-sans font-medium transition-colors ${
                          isSelected ? 'fill-sky-300 font-bold' : 'fill-slate-400 group-hover:fill-slate-200'
                        }`}
                      >
                        {town.name}
                      </text>
                    </g>
                  );
                })}

              {/* Geocoded Address Pin */}
              {geocodedTarget && drawProgress > 80 && (
                <g className="cursor-pointer">
                  {/* Pin Circle Indicator */}
                  <circle
                    cx={targetMapXY.x}
                    cy={targetMapXY.y}
                    r="4.5"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="0.8"
                    strokeDasharray="2 1"
                    className="animate-spin origin-center"
                  />
                  <circle
                    cx={targetMapXY.x}
                    cy={targetMapXY.y}
                    r="2"
                    fill="#f43f5e"
                    stroke="#ffffff"
                    strokeWidth="0.5"
                  />
                  <text
                    x={targetMapXY.x}
                    y={targetMapXY.y + 4.5}
                    textAnchor="middle"
                    className="text-[3px] fill-rose-300 font-mono font-bold"
                  >
                    TAB05 PIN
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Map Footer Bar with Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 gap-2 z-10">
            <div className="flex items-center gap-4">
              {mapMode === 'psm' ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px]">PSM Density:</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#94a3b8]"></span>
                    <span>&lt;$5.5k</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#64748b]"></span>
                    <span>$6.5k</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#334155]"></span>
                    <span>$7.8k</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0f172a] border border-slate-700"></span>
                    <span>&gt;$7.8k</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px]">Budget Match:</span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
                    <span>Affordable (&lt;90%)</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span>
                    <span>Tight (90-100%)</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-400"></span>
                    <span>Exceeds Budget</span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Click any town node to inspect resale data
            </div>
          </div>
        </div>

        {/* Selected Town Inspector Sidebar (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Town Intelligence
                </span>
                <h2 className="text-lg font-bold text-slate-900">{activeTownData.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Region: {activeTownData.region}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Median Benchmark</span>
                <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                  ${Math.round(activeTownData.medianPrice / 1000)}k
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Rate per SQM</span>
                <p className="text-sm font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
                  ${activeTownData.medianPsm.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  (~${Math.round(activeTownData.medianPsm / 10.764)}/sqft)
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Avg Remaining Lease</span>
                <p className="text-sm font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
                  {activeTownData.avgLeaseRemaining} Yrs
                </p>
                <span className="text-[10px] text-slate-400">99-Year Leasehold</span>
              </div>
            </div>

            {/* Coordinates Specification */}
            <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100 text-xs font-mono space-y-1">
              <div className="text-slate-500 font-medium font-sans text-[11px]">
                Tab05 Geodetic Projection:
              </div>
              <div className="text-slate-700 flex justify-between">
                <span>SVY21 Easting:</span>
                <span className="font-semibold">{activeTownData.svy21_easting} m</span>
              </div>
              <div className="text-slate-700 flex justify-between">
                <span>SVY21 Northing:</span>
                <span className="font-semibold">{activeTownData.svy21_northing} m</span>
              </div>
              <div className="text-slate-700 flex justify-between">
                <span>WGS84 Lat / Lng:</span>
                <span className="font-semibold">{activeTownData.lat}, {activeTownData.lng}</span>
              </div>
            </div>

            {/* Recent Transaction Highlights in Selected Town */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-900 block mb-2">
                Recent Sample Transactions in {activeTownData.name}
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {dataset
                  .filter((d) => d.town === activeTownData.name)
                  .slice(0, 4)
                  .map((flat) => (
                    <div
                      key={flat.id}
                      onClick={() => onSelectFlat(flat)}
                      className="p-2 border border-slate-200 rounded hover:border-slate-400 cursor-pointer transition-colors text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {flat.flat_type} · Blk {flat.block}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {flat.floor_area_sqm} sqm · {flat.remaining_lease_years}y lease
                        </div>
                      </div>
                      <div className="text-right font-mono font-semibold text-slate-900 tabular-nums">
                        ${flat.resale_price.toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onSelectTown(activeTownData.name)}
              className="w-full py-2 text-xs font-semibold text-center bg-slate-100 hover:bg-slate-200 text-slate-900 rounded transition-colors"
            >
              Filter Entire Applet by {activeTownData.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
