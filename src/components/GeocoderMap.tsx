import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Sparkles,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { FlatTransaction, GeocoderResult, FlatType } from '../types/housing';
import { SINGAPORE_TOWNS, getTownSummaries } from '../data/singaporeHousingData';
import { 
  SINGAPORE_MAINLAND_OUTLINE, 
  REGIONAL_BOUNDARIES, 
  geocodeAddress, 
  latLngToCanvasXY 
} from '../utils/geocoder';
import { 
  getStoredOneMapToken, 
  searchOneMap, 
  StoredOneMapAuth, 
  OneMapSearchResultItem 
} from '../utils/onemap';
import { OneMapTokenModal } from './OneMapTokenModal';
import { OneMapLeafletView } from './OneMapLeafletView';

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
  const [basemapStyle, setBasemapStyle] = useState<'vector' | 'onemap-default' | 'onemap-night' | 'onemap-grey' | 'onemap-original'>('vector');
  const [addressSearch, setAddressSearch] = useState<string>('Blk 212 Tampines St 21');
  const [geocodedTarget, setGeocodedTarget] = useState<GeocoderResult | null>(null);
  
  // OneMap Token Authentication & Search State
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);
  const [tokenState, setTokenState] = useState<StoredOneMapAuth>(getStoredOneMapToken());
  const [searchResults, setSearchResults] = useState<OneMapSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  // Update token state from storage periodically
  useEffect(() => {
    setTokenState(getStoredOneMapToken());
  }, []);

  // Click outside to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search debouncing against OneMap API
  useEffect(() => {
    if (addressSearch.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchOneMap(addressSearch, tokenState.token || undefined);
        setSearchResults(results.slice(0, 6));
        if (results.length > 0) {
          setShowDropdown(true);
        }
      } catch (e) {
        // Handled silently
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [addressSearch, tokenState.token]);

  // Trigger Tab05 Geocoder Auto-Draw Sequence
  const triggerAutoDraw = () => {
    setBasemapStyle('vector');
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

  // Find nearest HDB town for geocoded lat/lng
  const findClosestHdbTown = (lat: number, lng: number): string => {
    let closestTown = 'TAMPINES';
    let minDistance = Infinity;

    for (const [name, town] of Object.entries(SINGAPORE_TOWNS)) {
      const dLat = lat - town.lat;
      const dLng = lng - town.lng;
      const dist = dLat * dLat + dLng * dLng;
      if (dist < minDistance) {
        minDistance = dist;
        closestTown = name;
      }
    }
    return closestTown;
  };

  const handleSelectOneMapResult = (item: OneMapSearchResultItem) => {
    const lat = parseFloat(item.LATITUDE);
    const lng = parseFloat(item.LONGITUDE);
    const svy21X = Math.round(parseFloat(item.X));
    const svy21Y = Math.round(parseFloat(item.Y));
    const matchedTown = findClosestHdbTown(lat, lng);

    const displayName = item.BUILDING && item.BUILDING !== 'NIL' 
      ? `${item.BUILDING} (Blk ${item.BLK_NO} ${item.ROAD_NAME})`
      : `Blk ${item.BLK_NO} ${item.ROAD_NAME}`;

    setAddressSearch(item.ADDRESS || displayName);
    setShowDropdown(false);

    setGeocodedTarget({
      query: item.ADDRESS,
      matchedTown,
      lat,
      lng,
      svy21_x: svy21X,
      svy21_y: svy21Y,
      confidence: 0.99,
      source: 'OneMap_SLA_Official',
    });

    onSelectTown(matchedTown);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);

    if (searchResults.length > 0) {
      handleSelectOneMapResult(searchResults[0]);
      return;
    }

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
      if (psm > 7800) return '#0f172a';
      if (psm > 6500) return '#334155';
      if (psm > 5500) return '#64748b';
      return '#94a3b8';
    }

    return '#3b82f6';
  };

  const targetMapXY = geocodedTarget
    ? latLngToCanvasXY(geocodedTarget.lat, geocodedTarget.lng)
    : { x: 78, y: 48 };

  const copyTokenCommand = () => {
    const cmd = `# Mint a token (POST, JSON body {"email":"...","password":"..."}; lasts 3 days):\nhttps://www.onemap.gov.sg/api/auth/post/getToken`;
    navigator.clipboard.writeText(cmd);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* OneMap SLA Token Authentication Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                SLA ONEMAP v2
              </span>
              <span className="text-xs font-mono text-slate-400">
                # Mint a token (POST, JSON body &#123;"email":"...","password":"..."&#125;; lasts 3 days)
              </span>
            </div>
            <p className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 break-all">
              <Terminal className="w-3.5 h-3.5 shrink-0" />
              <span>https://www.onemap.gov.sg/api/auth/post/getToken</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyTokenCommand}
              className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Copy endpoint specification"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Spec'}</span>
            </button>

            <button
              onClick={() => setIsTokenModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>
                {tokenState.token && !tokenState.isExpired
                  ? `Token Active (${tokenState.hoursRemaining}h)`
                  : 'Mint 3-Day OneMap Token'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Controller Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-slate-900" />
              <span>Tab05 Geocoder & OneMap SLA Interactive Map</span>
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Singapore SVY21 national grid projection (EPSG:3414) with SLA OneMap official basemaps & dynamic auto-draw mapping.
            </p>
          </div>

          {/* Action & Map Layer Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Basemap Switcher */}
            <div className="flex bg-slate-100 p-0.5 rounded text-xs">
              <button
                onClick={() => setBasemapStyle('vector')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  basemapStyle === 'vector'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vector Grid
              </button>
              <button
                onClick={() => setBasemapStyle('onemap-default')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  basemapStyle === 'onemap-default'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OneMap SLA
              </button>
              <button
                onClick={() => setBasemapStyle('onemap-night')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  basemapStyle === 'onemap-night'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Night
              </button>
              <button
                onClick={() => setBasemapStyle('onemap-grey')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  basemapStyle === 'onemap-grey'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grey
              </button>
            </div>

            {/* Run Auto-Draw (Available in Vector Mode) */}
            {basemapStyle === 'vector' && (
              <button
                onClick={triggerAutoDraw}
                disabled={isDrawing}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isDrawing ? 'Drawing Map...' : 'Run Auto-Draw'}</span>
              </button>
            )}

            {/* Map Filter Mode */}
            <div className="flex bg-slate-100 p-0.5 rounded text-xs">
              <button
                onClick={() => setMapMode('psm')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  mapMode === 'psm'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Price / SQM
              </button>
              <button
                onClick={() => setMapMode('affordability')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  mapMode === 'affordability'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Budget Fit
              </button>
            </div>
          </div>
        </div>

        {/* Address Search Geocoder Bar with OneMap Autocomplete */}
        <div ref={searchContainerRef} className="relative mt-4 pt-4 border-t border-slate-100">
          <form onSubmit={handleAddressSubmit} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={addressSearch}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                onChange={(e) => setAddressSearch(e.target.value)}
                placeholder="Search any Singapore address or postal code (e.g. 'Blk 212 Tampines', '520512', 'Bishan St 22')..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:border-slate-500 bg-white"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono">
                  Searching OneMap...
                </div>
              )}
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Geocode & Pin</span>
            </button>
          </form>

          {/* Autocomplete Dropdown from OneMap Elastic Search */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-30 max-h-64 overflow-y-auto">
              <div className="p-2 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>OneMap SLA Official Address Matches</span>
                <span className="font-mono text-emerald-600">EPSG:3414 SVY21</span>
              </div>
              {searchResults.map((item, idx) => (
                <div
                  key={`${item.POSTAL}-${idx}`}
                  onClick={() => handleSelectOneMapResult(item)}
                  className="p-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 cursor-pointer transition-colors text-xs"
                >
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>
                      {item.BUILDING && item.BUILDING !== 'NIL' ? item.BUILDING : `Blk ${item.BLK_NO} ${item.ROAD_NAME}`}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      S({item.POSTAL})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {item.ADDRESS}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                    <span>SVY21: X:{Math.round(parseFloat(item.X))} Y:{Math.round(parseFloat(item.Y))}</span>
                    <span>·</span>
                    <span>WGS84: {parseFloat(item.LATITUDE).toFixed(4)}, {parseFloat(item.LONGITUDE).toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Geocoder Telemetry Display */}
          {geocodedTarget && (
            <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500 flex-wrap font-mono">
              <span className="text-slate-900 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Matched: {geocodedTarget.matchedTown}
              </span>
              <span aria-hidden="true">·</span>
              <span>Source: {geocodedTarget.source}</span>
              <span aria-hidden="true">·</span>
              <span>WGS84: {geocodedTarget.lat}, {geocodedTarget.lng}</span>
              <span aria-hidden="true">·</span>
              <span>SVY21: E:{geocodedTarget.svy21_x} N:{geocodedTarget.svy21_y}</span>
              <span aria-hidden="true">·</span>
              <span>Confidence: {Math.round(geocodedTarget.confidence * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Map Canvas & Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          {/* Map Header Status */}
          <div className="flex items-center justify-between text-xs text-slate-300 z-10 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="font-mono text-[11px] text-slate-300">
                {basemapStyle === 'vector' ? drawStage : `OneMap SLA Basemap (${basemapStyle.replace('onemap-', '').toUpperCase()})`}
              </span>
            </div>

            {/* Scale & Coordinate Grid Status */}
            <div className="font-mono text-[11px] text-slate-400">
              SVY21 / EPSG:3414 · Singapore SLA Grid
            </div>
          </div>

          {/* Map Body: Either OneMap Leaflet View OR Animated Tab05 Vector Grid */}
          {basemapStyle !== 'vector' ? (
            <div className="relative w-full h-[380px] rounded overflow-hidden my-auto border border-slate-800">
              <OneMapLeafletView
                style={
                  basemapStyle === 'onemap-night' 
                    ? 'Night' 
                    : basemapStyle === 'onemap-grey' 
                    ? 'Grey' 
                    : basemapStyle === 'onemap-original' 
                    ? 'Original' 
                    : 'Default'
                }
                targetCoords={
                  geocodedTarget
                    ? {
                        lat: geocodedTarget.lat,
                        lng: geocodedTarget.lng,
                        label: geocodedTarget.matchedTown,
                      }
                    : null
                }
                selectedTown={selectedTown}
                onSelectTown={onSelectTown}
                townSummaries={townSummaries}
              />
            </div>
          ) : (
            <div className="relative w-full h-[380px] my-auto">
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

                        {/* Town Name Label */}
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
                      PIN
                    </text>
                  </g>
                )}
              </svg>
            </div>
          )}

          {/* Map Footer Bar with Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 gap-2 z-10 mt-2">
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
                    <span>Affordable</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span>
                    <span>Tight</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-400"></span>
                    <span>Exceeds</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span>Basemap: {basemapStyle.toUpperCase()}</span>
              <span>·</span>
              <button
                onClick={() => setIsTokenModalOpen(true)}
                className="underline hover:text-white"
              >
                OneMap SLA Auth
              </button>
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
                SLA SVY21 Geodetic Projection:
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

      {/* OneMap Token Minting & Authentication Modal */}
      <OneMapTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        tokenState={tokenState}
        onTokenUpdated={setTokenState}
      />
    </div>
  );
};
