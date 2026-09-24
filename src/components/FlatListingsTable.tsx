import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  Download, 
  Search, 
  Filter, 
  Tag, 
  Check, 
  Clock, 
  Maximize2,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { FlatTransaction, FlatType } from '../types/housing';
import { SINGAPORE_TOWNS } from '../data/singaporeHousingData';
import { getBalasTableFactor } from '../utils/financialCalculators';

interface FlatListingsTableProps {
  dataset: FlatTransaction[];
  selectedTown: string;
  onSelectTown: (town: string) => void;
  onSelectFlat: (flat: FlatTransaction) => void;
  onAnnotateFlat: (flatId: string, annotation: string, tag: string) => void;
  onNavigateToMap?: () => void;
}

export const FlatListingsTable: React.FC<FlatListingsTableProps> = ({
  dataset,
  selectedTown,
  onSelectTown,
  onSelectFlat,
  onAnnotateFlat,
  onNavigateToMap,
}) => {
  const [flatTypeFilter, setFlatTypeFilter] = useState<FlatType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minLeaseFilter, setMinLeaseFilter] = useState<number>(45);
  const [minSqmFilter, setMinSqmFilter] = useState<number>(35);
  const [sortField, setSortField] = useState<'resale_price' | 'price_per_sqm' | 'floor_area_sqm' | 'remaining_lease_years'>('price_per_sqm');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Inline Annotation Modal State
  const [editingFlatId, setEditingFlatId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('Near MRT');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Filtered & Sorted Transactions
  const filteredListings = useMemo(() => {
    return dataset
      .filter((item) => {
        if (selectedTown !== 'ALL' && item.town !== selectedTown) return false;
        if (flatTypeFilter !== 'ALL' && item.flat_type !== flatTypeFilter) return false;
        if (item.remaining_lease_years < minLeaseFilter) return false;
        if (item.floor_area_sqm < minSqmFilter) return false;

        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase();
          const matchStreet = item.street_name.toLowerCase().includes(q);
          const matchBlock = item.block.toLowerCase().includes(q);
          const matchTown = item.town.toLowerCase().includes(q);
          const matchModel = item.flat_model.toLowerCase().includes(q);
          const matchNote = item.annotation ? item.annotation.toLowerCase().includes(q) : false;
          if (!matchStreet && !matchBlock && !matchTown && !matchModel && !matchNote) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [dataset, selectedTown, flatTypeFilter, minLeaseFilter, minSqmFilter, searchQuery, sortField, sortDirection]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredListings.length / pageSize) || 1;
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredListings.slice(start, start + pageSize);
  }, [filteredListings, currentPage]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSaveAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFlatId && noteInput.trim()) {
      onAnnotateFlat(editingFlatId, noteInput.trim(), tagInput);
      setEditingFlatId(null);
      setNoteInput('');
    }
  };

  const exportCsv = () => {
    const headers = [
      'ID', 'Month', 'Town', 'Flat Type', 'Block', 'Street', 'Storey', 
      'Floor Area (sqm)', 'Floor Area (sqft)', 'Lease Commence', 
      'Remaining Lease (Years)', 'Resale Price', 'Price Per SQM', 'Annotation'
    ];

    const rows = filteredListings.map((f) => [
      f.id,
      f.month,
      f.town,
      f.flat_type,
      f.block,
      `"${f.street_name}"`,
      f.storey_range,
      f.floor_area_sqm,
      Math.round(f.floor_area_sqm * 10.764),
      f.lease_commence_date,
      f.remaining_lease_years,
      f.resale_price,
      f.price_per_sqm,
      `"${f.annotation || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `houselytics_flats_${selectedTown}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Singapore HDB Flats Directory
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Searchable resale transaction records with floor area (sqm), remaining lease, and Bala's Table leasehold valuation.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>View on Flats Map</span>
              </button>
            )}

            <button
              onClick={exportCsv}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV ({filteredListings.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          {/* Town Selector */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Town</label>
            <select
              value={selectedTown}
              onChange={(e) => {
                onSelectTown(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white font-medium text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Towns (23 Towns)</option>
              {Object.keys(SINGAPORE_TOWNS).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Flat Type Filter */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Flat Type</label>
            <select
              value={flatTypeFilter}
              onChange={(e) => {
                setFlatTypeFilter(e.target.value as FlatType | 'ALL');
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white font-medium text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Flat Types</option>
              <option value="2 ROOM">2 ROOM</option>
              <option value="3 ROOM">3 ROOM</option>
              <option value="4 ROOM">4 ROOM</option>
              <option value="5 ROOM">5 ROOM</option>
              <option value="EXECUTIVE">EXECUTIVE</option>
            </select>
          </div>

          {/* Min Lease Remaining */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Min Remaining Lease: <span className="font-mono font-bold">{minLeaseFilter}y</span>
            </label>
            <input
              type="range"
              min="45"
              max="90"
              step="5"
              value={minLeaseFilter}
              onChange={(e) => {
                setMinLeaseFilter(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-900 mt-2"
            />
          </div>

          {/* Min Floor Area (sqm) */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Min Floor Area: <span className="font-mono font-bold">{minSqmFilter} sqm</span>
            </label>
            <input
              type="range"
              min="35"
              max="135"
              step="5"
              value={minSqmFilter}
              onChange={(e) => {
                setMinSqmFilter(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-900 mt-2"
            />
          </div>

          {/* Text Search */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Search Street / Block</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search..."
                className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-slate-500 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Town & Address</th>
                <th className="py-2.5 px-3">Flat Type & Model</th>
                <th
                  onClick={() => handleSort('floor_area_sqm')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Floor Area (sqm)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('remaining_lease_years')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Remaining Lease</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('resale_price')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Resale Price</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price_per_sqm')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price / SQM</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Annotation / Notes</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedListings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No transaction records match the specified filters.
                  </td>
                </tr>
              ) : (
                paginatedListings.map((flat) => {
                  const balas = getBalasTableFactor(flat.remaining_lease_years);

                  return (
                    <tr
                      key={flat.id}
                      onClick={() => onSelectFlat(flat)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Town & Address */}
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        <div>
                          <span>Blk {flat.block} {flat.street_name}</span>
                          <div className="text-[11px] text-slate-500 font-normal">
                            {flat.town} · Storey {flat.storey_range}
                          </div>
                        </div>
                      </td>

                      {/* Flat Type */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{flat.flat_type}</div>
                        <div className="text-[11px] text-slate-500">{flat.flat_model}</div>
                      </td>

                      {/* Floor Area (Joined) */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span className="font-semibold text-slate-900">{flat.floor_area_sqm} sqm</span>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {Math.round(flat.floor_area_sqm * 10.764)} sqft
                        </div>
                      </td>

                      {/* Remaining Lease (Joined) */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span className="font-semibold text-slate-900">
                          {flat.remaining_lease_years}y {flat.remaining_lease_months}m
                        </span>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Bala's Factor: {balas}
                        </div>
                      </td>

                      {/* Resale Price */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ${flat.resale_price.toLocaleString()}
                      </td>

                      {/* Price Per SQM */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        ${flat.price_per_sqm.toLocaleString()}/sqm
                      </td>

                      {/* Annotation / Product Notes */}
                      <td className="py-2.5 px-3 max-w-[200px]">
                        {flat.annotation ? (
                          <div className="truncate text-slate-600 text-[11px]">
                            {flat.annotation}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingFlatId(flat.id);
                            setNoteInput(flat.annotation || '');
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-colors"
                          title="Add product annotation / tag"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          <div>
            Showing <span className="font-mono font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-mono font-semibold">
              {Math.min(currentPage * pageSize, filteredListings.length)}
            </span>{' '}
            of <span className="font-mono font-semibold">{filteredListings.length}</span> flats
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-white transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inline Product Annotation Modal */}
      {editingFlatId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-5 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-800" />
              <span>Enrich Flat with Product Annotation</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add contextual product copy (e.g. proximity to MRT, prime location status) to sync with Supabase and the budget explorer.
            </p>

            <form onSubmit={handleSaveAnnotation} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tag Classification
                </label>
                <select
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-800 focus:outline-none"
                >
                  <option value="Near MRT (&lt;300m)">Near MRT (&lt;300m)</option>
                  <option value="Prime Location Housing (PLH)">Prime Location Housing (PLH)</option>
                  <option value="Top Primary School (1km)">Top Primary School (1km)</option>
                  <option value="Unblocked High Floor View">Unblocked High Floor View</option>
                  <option value="MOP Reached 2025/2026">MOP Reached 2025/2026</option>
                  <option value="Value Buy Under Town Median">Value Buy Under Town Median</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Annotation & Editorial Note
                </label>
                <textarea
                  rows={3}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="e.g. Rare high floor corner unit, 4 mins sheltered walk to Tampines East MRT and 24h supermarket."
                  className="w-full p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-slate-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFlatId(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                >
                  Save & Enrich
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
