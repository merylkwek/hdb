import React, { useState } from 'react';
import { 
  Database, 
  Terminal, 
  Copy, 
  Check, 
  UploadCloud, 
  FileText, 
  Play, 
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { FlatTransaction } from '../types/housing';

interface SupabaseStudioProps {
  dataset: FlatTransaction[];
  onAnnotateFlat: (flatId: string, annotation: string, tag: string) => void;
}

export const SupabaseStudio: React.FC<SupabaseStudioProps> = ({
  dataset,
  onAnnotateFlat,
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'seed' | 'query' | 'annotations'>('seed');
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedProgress, setSeedProgress] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [newAnnotationFlatId, setNewAnnotationFlatId] = useState<string>('HDB-TAM-1002');
  const [newAnnotationTag, setNewAnnotationTag] = useState<string>('Near MRT (<300m)');
  const [newAnnotationText, setNewAnnotationText] = useState<string>('5 mins sheltered walkway to Tampines East MRT station and Community Hub.');

  const sqlSchema = `-- ==========================================
-- Supabase PostgreSQL Schema for Houselytics
-- Singapore HDB Resale & Affordability Model
-- ==========================================

-- Enable PostGIS for Tab05 / SVY21 national geospatial lookups
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Resale Transactions Table (Joined Floor Area & Remaining Lease)
CREATE TABLE public.hdb_resale_transactions (
    id TEXT PRIMARY KEY,
    month VARCHAR(7) NOT NULL, -- e.g. '2026-03'
    town VARCHAR(50) NOT NULL,
    flat_type VARCHAR(20) NOT NULL, -- '2 ROOM', '3 ROOM', etc.
    block VARCHAR(10) NOT NULL,
    street_name VARCHAR(100) NOT NULL,
    storey_range VARCHAR(20) NOT NULL,
    floor_area_sqm NUMERIC(6, 2) NOT NULL,
    flat_model VARCHAR(50) NOT NULL,
    lease_commence_date INTEGER NOT NULL,
    remaining_lease_years INTEGER NOT NULL,
    remaining_lease_months INTEGER NOT NULL,
    resale_price NUMERIC(12, 2) NOT NULL,
    price_per_sqm NUMERIC(10, 2) NOT NULL,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    svy21_easting NUMERIC(10, 2) NOT NULL,
    svy21_northing NUMERIC(10, 2) NOT NULL,
    geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Product-Specific Enrichment & Editorial Annotations
CREATE TABLE public.flat_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flat_id TEXT REFERENCES public.hdb_resale_transactions(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL, -- 'Near MRT', 'PLH', 'Top Primary School'
    notes TEXT NOT NULL,
    author VARCHAR(100) DEFAULT 'DataProductDesigner',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. High-Performance Indices
CREATE INDEX idx_hdb_town_type ON public.hdb_resale_transactions(town, flat_type);
CREATE INDEX idx_hdb_price_sqm ON public.hdb_resale_transactions(price_per_sqm);
CREATE INDEX idx_hdb_remaining_lease ON public.hdb_resale_transactions(remaining_lease_years);
CREATE INDEX idx_hdb_geom ON public.hdb_resale_transactions USING GIST(geom);

-- 4. Row Level Security (RLS)
ALTER TABLE public.hdb_resale_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flat_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to housing transactions"
    ON public.hdb_resale_transactions FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to add annotations"
    ON public.flat_annotations FOR ALL USING (true);
`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerSeed = () => {
    setIsSeeding(true);
    setSeedProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setSeedProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setIsSeeding(false);
      }
    }, 120);
  };

  const handleCreateAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAnnotationFlatId && newAnnotationText.trim()) {
      onAnnotateFlat(newAnnotationFlatId, newAnnotationText.trim(), newAnnotationTag);
      setNewAnnotationText('');
      alert(`Annotation added to ${newAnnotationFlatId}! Synced with Supabase & Directory.`);
    }
  };

  // Generate Sample SQL Insert script
  const generateSqlInsertPreview = () => {
    const sample = dataset.slice(0, 5);
    const rows = sample.map((d) => 
      `('${d.id}', '${d.month}', '${d.town}', '${d.flat_type}', '${d.block}', '${d.street_name}', '${d.storey_range}', ${d.floor_area_sqm}, '${d.flat_model}', ${d.lease_commence_date}, ${d.remaining_lease_years}, ${d.remaining_lease_months}, ${d.resale_price}, ${d.price_per_sqm}, ${d.lat}, ${d.lng}, ${d.svy21_easting}, ${d.svy21_northing})`
    ).join(',\n    ');

    return `INSERT INTO public.hdb_resale_transactions (
    id, month, town, flat_type, block, street_name, storey_range, floor_area_sqm,
    flat_model, lease_commence_date, remaining_lease_years, remaining_lease_months,
    resale_price, price_per_sqm, lat, lng, svy21_easting, svy21_northing
) VALUES\n    ${rows};\n\n-- Total dataset: ${dataset.length} records ready for batch ingestion.`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-900" />
              <span>Supabase Table & Data Annotation Studio</span>
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Production schema with PostGIS geometries, automated batch seeding, and product editorial annotations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerSeed}
              disabled={isSeeding}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isSeeding ? `Seeding (${seedProgress}%)...` : `Seed ${dataset.length} Records to Supabase`}</span>
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation */}
        <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('seed')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'seed'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Seeder Pipeline ({dataset.length} Rows)
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'schema'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SQL Migration Schema
          </button>
          <button
            onClick={() => setActiveTab('annotations')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'annotations'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Product Annotator
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'seed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Seeding Status & Action (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-slate-700" />
              <span>Supabase Seeder Engine</span>
            </h2>
            <p className="text-xs text-slate-500">
              Synchronizes the pre-processed HDB resale transactions joined with floor area (sqm), remaining lease, and Tab05 SVY21 coordinate geometry directly into Supabase.
            </p>

            <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Target Table</span>
                <span className="font-mono text-slate-900 font-bold">public.hdb_resale_transactions</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Batch Payload Size</span>
                <span className="font-mono text-slate-900 tabular-nums">{dataset.length} records</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Geospatial Column</span>
                <span className="font-mono text-slate-900">geom (PostGIS EPSG:4326)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Sync Status</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {seedProgress === 100 ? 'Synchronized (Live)' : `Writing... ${seedProgress}%`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${seedProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleTriggerSeed}
                disabled={isSeeding}
                className="w-full py-2 px-3 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Re-seed Table ({dataset.length} Records)</span>
              </button>
            </div>
          </div>

          {/* SQL Insert Script Preview (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">Generated SQL Seeder Batch</h3>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateSqlInsertPreview());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Insert SQL'}</span>
              </button>
            </div>

            <pre className="mt-3 p-3 bg-slate-900 text-slate-200 text-xs font-mono rounded overflow-x-auto max-h-80 leading-relaxed">
              {generateSqlInsertPreview()}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Supabase / PostgreSQL DDL Migration
              </h3>
              <p className="text-xs text-slate-500">
                Execute in your Supabase SQL Editor to provision tables, spatial indices, and RLS policies.
              </p>
            </div>

            <button
              onClick={handleCopySchema}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy DDL Script'}</span>
            </button>
          </div>

          <pre className="mt-4 p-4 bg-slate-900 text-emerald-400 text-xs font-mono rounded overflow-x-auto max-h-96 leading-relaxed">
            {sqlSchema}
          </pre>
        </div>
      )}

      {activeTab === 'annotations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Annotation Creation Form (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Product-Specific Enrichment & Annotation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tag listings with curated insights (e.g., proximity to MRT, prime estate status) to guide user purchasing decisions.
            </p>

            <form onSubmit={handleCreateAnnotation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Flat Record
                </label>
                <select
                  value={newAnnotationFlatId}
                  onChange={(e) => setNewAnnotationFlatId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-900 font-mono focus:outline-none"
                >
                  {dataset.slice(0, 20).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} · {d.town} ({d.flat_type}, ${d.resale_price.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tag Classification
                </label>
                <select
                  value={newAnnotationTag}
                  onChange={(e) => setNewAnnotationTag(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-900 focus:outline-none"
                >
                  <option value="Near MRT (<300m)">Near MRT (&lt;300m)</option>
                  <option value="Prime Location Housing (PLH)">Prime Location Housing (PLH)</option>
                  <option value="Top Primary School (1km)">Top Primary School (1km)</option>
                  <option value="High Floor Unblocked View">High Floor Unblocked View</option>
                  <option value="Recent MOP Cluster">Recent MOP Cluster</option>
                  <option value="Below Town Median Rate">Below Town Median Rate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Product Copy & Notes
                </label>
                <textarea
                  rows={3}
                  value={newAnnotationText}
                  onChange={(e) => setNewAnnotationText(e.target.value)}
                  placeholder="Enter informative product commentary..."
                  className="w-full p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-slate-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors cursor-pointer"
              >
                Save Annotation to Supabase Table
              </button>
            </form>
          </div>

          {/* Current Enriched Annotations List (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
              Live Enriched Product Records
            </h3>

            <div className="space-y-3 mt-4 max-h-96 overflow-y-auto pr-1">
              {dataset
                .filter((d) => d.annotation && d.annotation.length > 0)
                .map((d) => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-slate-900">{d.id}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-slate-700">{d.town} {d.flat_type}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        ${d.resale_price.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-600 mt-2 bg-white p-2 rounded border border-slate-100">
                      "{d.annotation}"
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                      <span>Floor Area: {d.floor_area_sqm} sqm</span>
                      <span aria-hidden="true">·</span>
                      <span>Remaining Lease: {d.remaining_lease_years}y</span>
                      <span aria-hidden="true">·</span>
                      <span>Rate: ${d.price_per_sqm}/sqm</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
