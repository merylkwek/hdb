import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  Building, 
  Clock, 
  Layers, 
  ArrowRight,
  Maximize2,
  DollarSign,
  ChevronRight,
  X,
  Compass
} from 'lucide-react';
import { FlatTransaction, FlatType, SingaporeRegion } from '../types/housing';
import { SINGAPORE_TOWNS } from '../data/singaporeHousingData';

interface FlatsMapTabProps {
  dataset: FlatTransaction[];
  onSelectFlat: (flat: FlatTransaction) => void;
  initialTown?: string;
}

export const FlatsMapTab: React.FC<FlatsMapTabProps> = ({
  dataset,
  onSelectFlat,
  initialTown,
}) => {
  // Map DOM reference & Leaflet instance
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters State
  const [selectedTown, setSelectedTown] = useState<string>(initialTown || 'ALL');
  const [selectedFlatTypes, setSelectedFlatTypes] = useState<FlatType[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(1200000);
  const [minLeaseYears, setMinLeaseYears] = useState<number>(50);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Available unique towns
  const availableTowns = useMemo(() => {
    return Object.keys(SINGAPORE_TOWNS).sort();
  }, []);

  // Filtered dataset
  const filteredFlats = useMemo(() => {
    return dataset.filter((flat) => {
      // Town filter
      if (selectedTown !== 'ALL' && flat.town !== selectedTown) {
        return false;
      }

      // Flat type filter
      if (selectedFlatTypes.length > 0 && !selectedFlatTypes.includes(flat.flat_type)) {
        return false;
      }

      // Max price filter
      if (flat.resale_price > maxPrice) {
        return false;
      }

      // Remaining lease filter
      if (flat.remaining_lease_years < minLeaseYears) {
        return false;
      }

      // Search query (street, block, model)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const address = `${flat.block} ${flat.street_name}`.toLowerCase();
        const town = flat.town.toLowerCase();
        const model = flat.flat_model.toLowerCase();
        if (!address.includes(query) && !town.includes(query) && !model.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [dataset, selectedTown, selectedFlatTypes, maxPrice, minLeaseYears, searchQuery]);

  // Selected flat object
  const activeFlat = useMemo(() => {
    return dataset.find((f) => f.id === selectedFlatId) || null;
  }, [dataset, selectedFlatId]);

  // Format currency
  const formatPrice = (val: number) => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(2)}M`;
    }
    return `$${Math.round(val / 1000)}k`;
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default Singapore coordinates
    const sgCenter: L.LatLngExpression = [1.3521, 103.8198];
    const map = L.map(mapContainerRef.current, {
      center: sgCenter,
      zoom: 12,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false,
    });

    // Add crisp voyager map tiles (fast, beautiful, clear street labels)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Create marker layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Markers on Filtered Flats Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Map bounds to auto-fit
    const bounds = L.latLngBounds([]);

    filteredFlats.forEach((flat) => {
      if (!flat.lat || !flat.lng) return;

      const isSelected = flat.id === selectedFlatId;
      const formattedPrice = formatPrice(flat.resale_price);

      // Color scheme based on flat type
      let badgeBg = 'bg-slate-900 text-white';
      if (flat.flat_type === '4 ROOM') badgeBg = 'bg-emerald-700 text-white';
      else if (flat.flat_type === '5 ROOM') badgeBg = 'bg-indigo-700 text-white';
      else if (flat.flat_type === 'EXECUTIVE') badgeBg = 'bg-amber-700 text-white';
      else if (flat.flat_type === '3 ROOM') badgeBg = 'bg-sky-700 text-white';

      const customIcon = L.divIcon({
        className: 'custom-hdb-price-pin',
        html: `
          <div class="cursor-pointer transition-transform duration-150 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
            <div class="${badgeBg} font-mono font-bold text-[11px] px-2 py-0.5 rounded shadow-md border ${isSelected ? 'border-white ring-2 ring-slate-900' : 'border-slate-800/20'} whitespace-nowrap flex items-center gap-1">
              <span>${formattedPrice}</span>
            </div>
            <div class="w-1.5 h-1.5 ${isSelected ? 'bg-slate-900' : 'bg-slate-700'} mx-auto rotate-45 -mt-0.5"></div>
          </div>
        `,
        iconSize: [48, 22],
        iconAnchor: [24, 22],
        popupAnchor: [0, -22],
      });

      const marker = L.marker([flat.lat, flat.lng], { icon: customIcon });

      // Custom rich popup
      const popupHtml = `
        <div style="font-family: inherit; min-width: 220px; padding: 2px;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
            ${flat.town} · ${flat.flat_type}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
            Blk ${flat.block} ${flat.street_name}
          </div>
          <div style="font-size: 16px; font-weight: 800; color: #0f172a; font-family: monospace; margin: 4px 0;">
            $${flat.resale_price.toLocaleString()}
          </div>
          <div style="font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px;">
            <span>$${flat.price_per_sqm.toLocaleString()}/sqm · ${flat.floor_area_sqm} sqm (${Math.round(flat.floor_area_sqm * 10.764)} sqft)</span>
            <span>Storey ${flat.storey_range} · Remaining ${flat.remaining_lease_years} yrs ${flat.remaining_lease_months} mos</span>
          </div>
          <button id="view-flat-${flat.id}" style="width: 100%; background: #0f172a; color: #fff; font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 4px; border: none; cursor: pointer; text-align: center;">
            Inspect Full Flat Details &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedFlatId(flat.id);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-flat-${flat.id}`);
        if (btn) {
          btn.onclick = () => onSelectFlat(flat);
        }
      });

      markersLayer.addLayer(marker);
      bounds.extend([flat.lat, flat.lng]);
    });

    // Auto fit bounds if filtered list has items and town specifically selected
    if (selectedTown !== 'ALL' && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filteredFlats, selectedFlatId, selectedTown, onSelectFlat]);

  // Focus map on flat selection from list
  const handleSelectFromList = (flat: FlatTransaction) => {
    setSelectedFlatId(flat.id);
    const map = mapInstanceRef.current;
    if (map && flat.lat && flat.lng) {
      map.flyTo([flat.lat, flat.lng], 16, { duration: 0.8 });
    }
  };

  // Reset to full Singapore view
  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([1.3521, 103.8198], 12);
    }
    setSelectedTown('ALL');
    setSelectedFlatTypes([]);
    setSearchQuery('');
    setMaxPrice(1200000);
    setMinLeaseYears(50);
    setSelectedFlatId(null);
  };

  // Toggle flat type filter
  const toggleFlatType = (type: FlatType) => {
    setSelectedFlatTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* 1. Top Filter & Search Controls Bar */}
      <div className="p-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Left: Search & Town Selection */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search block, street, or town..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Town Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Town:</span>
            <select
              value={selectedTown}
              onChange={(e) => {
                setSelectedTown(e.target.value);
                const townCoord = SINGAPORE_TOWNS[e.target.value];
                if (townCoord && mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([townCoord.lat, townCoord.lng], 14);
                }
              }}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">All Singapore ({availableTowns.length} Towns)</option>
              {availableTowns.map((town) => (
                <option key={town} value={town}>
                  {town}
                </option>
              ))}
            </select>
          </div>

          {/* Flat Type Filter Pills */}
          <div className="hidden lg:flex items-center gap-1">
            {(['2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE'] as FlatType[]).map((type) => {
              const active = selectedFlatTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleFlatType(type)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type.replace(' ROOM', 'R')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Price slider, reset & toggle list */}
        <div className="flex items-center gap-3">
          {/* Max Price quick slider */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Max Price:</span>
            <input
              type="range"
              min="300000"
              max="1400000"
              step="25000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-24 accent-slate-900 cursor-pointer"
            />
            <span className="font-mono font-bold text-slate-800 min-w-[50px]">
              {formatPrice(maxPrice)}
            </span>
          </div>

          {/* Reset Filters */}
          <button
            onClick={handleResetView}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            title="Reset Filters and Center Map"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isSidebarOpen 
                ? 'bg-slate-100 text-slate-800 border-slate-300' 
                : 'bg-slate-900 text-white border-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isSidebarOpen ? 'Hide List' : `Show Flats (${filteredFlats.length})`}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Map Workspace & Interactive List */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="flex-1 h-full w-full z-10" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2.5 shadow-md text-[11px] hidden sm:block">
          <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span>Flat Types on Map</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-700"></span>
              <span className="text-slate-600">3 Room</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
              <span className="text-slate-600">4 Room</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-700"></span>
              <span className="text-slate-600">5 Room</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-700"></span>
              <span className="text-slate-600">Executive</span>
            </div>
          </div>
        </div>

        {/* Counter floating chip */}
        <div className="absolute top-4 left-4 z-20 bg-slate-900/90 text-white backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-medium shadow-md flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>{filteredFlats.length} flats on map</span>
        </div>

        {/* Interactive Flats Side Panel */}
        {isSidebarOpen && (
          <aside className="w-80 sm:w-96 border-l border-slate-200 bg-white flex flex-col z-20 shadow-lg shrink-0">
            {/* Sidebar Header */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-900">
                  {selectedTown === 'ALL' ? 'Singapore Resale Flats' : `${selectedTown} Flats`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Click a card to focus &amp; fly to marker
                </p>
              </div>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {filteredFlats.length} units
              </span>
            </div>

            {/* Flat Cards List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
              {filteredFlats.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No flats found</p>
                  <p className="text-slate-400 mt-1">Try widening your price range or town selection.</p>
                  <button
                    onClick={handleResetView}
                    className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredFlats.map((flat) => {
                  const isSelected = flat.id === selectedFlatId;
                  return (
                    <div
                      key={flat.id}
                      onClick={() => handleSelectFromList(flat)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer text-xs ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50/80 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            {flat.town} · {flat.flat_type}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                            Blk {flat.block} {flat.street_name}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                            ${flat.resale_price.toLocaleString()}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ${flat.price_per_sqm.toLocaleString()}/sqm
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
                        <span>{flat.floor_area_sqm} sqm · Storey {flat.storey_range}</span>
                        <span>{flat.remaining_lease_years} yrs left</span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Sold {flat.month}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFlat(flat);
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Full Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
