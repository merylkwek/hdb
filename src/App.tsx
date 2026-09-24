import React, { useState } from 'react';
import { Header } from './components/Header';
import { BudgetExplorer } from './components/BudgetExplorer';
import { MarketTrends } from './components/MarketTrends';
import { GeocoderMap } from './components/GeocoderMap';
import { FlatListingsTable } from './components/FlatListingsTable';
import { SupabaseStudio } from './components/SupabaseStudio';
import { PrototypePlanModal } from './components/PrototypePlanModal';
import { ApiHealthModal } from './components/ApiHealthModal';
import { HOUSING_DATASET } from './data/singaporeHousingData';
import { FlatTransaction } from './types/housing';
import { getBalasTableFactor } from './utils/financialCalculators';
import { X, MapPin, Maximize2, Clock, Calculator, ShieldCheck, Tag, Activity } from 'lucide-react';

export default function App() {
  const [dataset, setDataset] = useState<FlatTransaction[]>(HOUSING_DATASET);
  const [activeTab, setActiveTab] = useState<'budget' | 'trends' | 'map' | 'directory' | 'supabase'>('budget');
  const [selectedTown, setSelectedTown] = useState<string>('TAMPINES');
  const [inspectedFlat, setInspectedFlat] = useState<FlatTransaction | null>(null);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState<boolean>(false);
  const [isApiHealthOpen, setIsApiHealthOpen] = useState<boolean>(false);

  // Update annotation on a flat record
  const handleAnnotateFlat = (flatId: string, annotationText: string, tag: string) => {
    setDataset((prev) =>
      prev.map((flat) => {
        if (flat.id === flatId) {
          const currentTags = flat.tags || [];
          const updatedTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag];
          return {
            ...flat,
            annotation: annotationText,
            tags: updatedTags,
          };
        }
        return flat;
      })
    );

    if (inspectedFlat && inspectedFlat.id === flatId) {
      setInspectedFlat((prev) =>
        prev
          ? {
              ...prev,
              annotation: annotationText,
              tags: prev.tags?.includes(tag) ? prev.tags : [...(prev.tags || []), tag],
            }
          : null
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar (Follows Design Constitution 3-Zone Contract) */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenBlueprint={() => setIsBlueprintOpen(true)}
        onOpenApiHealth={() => setIsApiHealthOpen(true)}
        transactionCount={dataset.length}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'budget' && (
          <BudgetExplorer
            dataset={dataset}
            onSelectTown={(town) => {
              setSelectedTown(town);
              setActiveTab('map');
            }}
            onSelectFlat={setInspectedFlat}
            onNavigateToMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'trends' && (
          <MarketTrends
            dataset={dataset}
            selectedTown={selectedTown}
            onSelectTown={setSelectedTown}
          />
        )}

        {activeTab === 'map' && (
          <GeocoderMap
            dataset={dataset}
            selectedTown={selectedTown}
            onSelectTown={setSelectedTown}
            onSelectFlat={setInspectedFlat}
          />
        )}

        {activeTab === 'directory' && (
          <FlatListingsTable
            dataset={dataset}
            selectedTown={selectedTown}
            onSelectTown={setSelectedTown}
            onSelectFlat={setInspectedFlat}
            onAnnotateFlat={handleAnnotateFlat}
          />
        )}

        {activeTab === 'supabase' && (
          <SupabaseStudio
            dataset={dataset}
            onAnnotateFlat={handleAnnotateFlat}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Houselytics Data Product</span>
            <span aria-hidden="true">·</span>
            <span>Singapore HDB Resale Market Explorer</span>
            <span aria-hidden="true">·</span>
            <span>Tab05 Geodetic Grid (EPSG:3414)</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsApiHealthOpen(true)}
              className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>API Health Status</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsBlueprintOpen(true)}
              className="text-slate-700 hover:text-slate-900 font-medium underline cursor-pointer"
            >
              Architecture Plan
            </button>
            <span aria-hidden="true">·</span>
            <span>MAS 30% MSR Engine</span>
          </div>
        </div>
      </footer>

      {/* Flat Inspection Modal */}
      {inspectedFlat && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono text-slate-400">Transaction ID: {inspectedFlat.id}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Blk {inspectedFlat.block} {inspectedFlat.street_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectedFlat.town} · {inspectedFlat.flat_type} ({inspectedFlat.flat_model})
                </p>
              </div>

              <button
                onClick={() => setInspectedFlat(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial & Joined Specs */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Resale Price</span>
                <p className="text-base font-bold font-mono text-slate-900 tabular-nums">
                  ${inspectedFlat.resale_price.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  ${inspectedFlat.price_per_sqm.toLocaleString()} / sqm
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Floor Area (Joined)</span>
                <p className="text-base font-bold font-mono text-slate-900 tabular-nums">
                  {inspectedFlat.floor_area_sqm} sqm
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  {Math.round(inspectedFlat.floor_area_sqm * 10.764)} sqft
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Remaining Lease (Joined)</span>
                <p className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                  {inspectedFlat.remaining_lease_years}y {inspectedFlat.remaining_lease_months}m
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Bala's Factor: {getBalasTableFactor(inspectedFlat.remaining_lease_years)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Storey & Period</span>
                <p className="text-sm font-semibold text-slate-800">
                  Storey {inspectedFlat.storey_range}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Sold {inspectedFlat.month}
                </span>
              </div>
            </div>

            {/* Tab05 Geocoded Coordinates */}
            <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100 text-xs font-mono space-y-1">
              <div className="text-slate-600 font-semibold font-sans text-[11px]">
                Tab05 Geocoded Parameters:
              </div>
              <div className="flex justify-between text-slate-700">
                <span>SVY21 Coordinates:</span>
                <span>E:{inspectedFlat.svy21_easting} / N:{inspectedFlat.svy21_northing}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>WGS84 Coordinates:</span>
                <span>{inspectedFlat.lat}, {inspectedFlat.lng}</span>
              </div>
            </div>

            {/* Product Annotation */}
            {inspectedFlat.annotation && (
              <div className="mt-4 p-3 bg-amber-50/60 border border-amber-200/60 rounded text-xs">
                <span className="font-semibold text-amber-900 block mb-1">Product Annotation</span>
                <p className="text-amber-800">"{inspectedFlat.annotation}"</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedTown(inspectedFlat.town);
                  setActiveTab('map');
                  setInspectedFlat(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
              >
                Inspect Town in Geocoder Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Architecture & Prototype Plan Modal */}
      <PrototypePlanModal
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
      />

      {/* API Health Status Monitor Modal */}
      <ApiHealthModal
        isOpen={isApiHealthOpen}
        onClose={() => setIsApiHealthOpen(false)}
      />
    </div>
  );
}
