import React, { useState } from 'react';
import { Header, AppTab } from './components/Header';
import { BudgetExplorer } from './components/BudgetExplorer';
import { MarketTrends } from './components/MarketTrends';
import { FlatListingsTable } from './components/FlatListingsTable';
import { FlatsMapTab } from './components/FlatsMapTab';
import { HOUSING_DATASET } from './data/singaporeHousingData';
import { FlatTransaction } from './types/housing';
import { getBalasTableFactor } from './utils/financialCalculators';
import { X, Building2, MapPin, Maximize2, Clock, Calculator, ShieldCheck } from 'lucide-react';

export default function App() {
  const [dataset, setDataset] = useState<FlatTransaction[]>(HOUSING_DATASET);
  const [activeTab, setActiveTab] = useState<AppTab>('budget');
  const [selectedTown, setSelectedTown] = useState<string>('TAMPINES');
  const [inspectedFlat, setInspectedFlat] = useState<FlatTransaction | null>(null);

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
      {/* Top Bar for End Users */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        transactionCount={dataset.length}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'budget' && (
          <BudgetExplorer
            dataset={dataset}
            onSelectTown={(town) => {
              setSelectedTown(town);
              setActiveTab('directory');
            }}
            onSelectFlat={setInspectedFlat}
            onNavigateToDirectory={() => setActiveTab('directory')}
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
          <FlatsMapTab
            dataset={dataset}
            onSelectFlat={setInspectedFlat}
            initialTown={selectedTown !== 'ALL' ? selectedTown : undefined}
          />
        )}

        {activeTab === 'directory' && (
          <FlatListingsTable
            dataset={dataset}
            selectedTown={selectedTown}
            onSelectTown={setSelectedTown}
            onSelectFlat={setInspectedFlat}
            onAnnotateFlat={handleAnnotateFlat}
            onNavigateToMap={() => setActiveTab('map')}
          />
        )}
      </main>

      {/* Clean End-User Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Houselytics</span>
            <span aria-hidden="true">·</span>
            <span>Singapore HDB Resale Market Intelligence</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>MAS 30% Mortgage Servicing Ratio (MSR) Framework</span>
            <span aria-hidden="true">·</span>
            <span>HDB Concessionary &amp; Commercial Amortization</span>
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Resale Price</span>
                <p className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                  ${inspectedFlat.resale_price.toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Unit Rate</span>
                <p className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                  ${inspectedFlat.price_per_sqm.toLocaleString()}/sqm
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Floor Area</span>
                <p className="text-sm font-semibold font-mono text-slate-800">
                  {inspectedFlat.floor_area_sqm} sqm ({Math.round(inspectedFlat.floor_area_sqm * 10.764)} sqft)
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Remaining Lease</span>
                <p className="text-sm font-semibold font-mono text-slate-800">
                  {inspectedFlat.remaining_lease_years} yrs {inspectedFlat.remaining_lease_months} mos
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Storey &amp; Period</span>
                <p className="text-sm font-semibold text-slate-800">
                  Storey {inspectedFlat.storey_range}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Sold {inspectedFlat.month}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500">Lease Commencement</span>
                <p className="text-sm font-semibold font-mono text-slate-800">
                  {inspectedFlat.lease_commence_date}
                </p>
              </div>
            </div>

            {/* SLA Bala's Leasehold Value Calculation */}
            <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">SLA Bala's Table Leasehold Factor:</span>
                <span className="font-mono font-bold text-slate-900">
                  {(getBalasTableFactor(inspectedFlat.remaining_lease_years) * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Percentage of equivalent 99-year freehold baseline value retained based on Singapore Land Authority actuarial curves.
              </p>
            </div>

            {inspectedFlat.annotation && (
              <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded text-xs">
                <span className="font-semibold text-amber-900">Saved Note:</span>
                <p className="text-amber-800">"{inspectedFlat.annotation}"</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedTown(inspectedFlat.town);
                  setActiveTab('directory');
                  setInspectedFlat(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors cursor-pointer"
              >
                Browse All Flats in {inspectedFlat.town}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
