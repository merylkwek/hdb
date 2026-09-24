import React, { useState } from 'react';
import { X, Copy, Check, FileText, CheckCircle2, ChevronRight, Layers } from 'lucide-react';

interface PrototypePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrototypePlanModal: React.FC<PrototypePlanModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const planMarkdown = `# Houselytics: Housing Affordability Explorer
## Structured Plan & Prototype Implementation Blueprint

### 1. Product Vision & User Problem
- **Target Persona**: First-time homebuyers, upgraders, and data-driven property seekers (aligned with financial dashboard clarity like WallStreetZen).
- **Core Dilemma**: Buyers know their maximum borrowing budget or household income, but struggle to comprehend what flat types and towns are within reach without overleveraging or compromising on remaining lease and floor area (sqm).
- **Key Proposition**: A transparent affordability engine that couples MAS/HDB 30% MSR borrowing caps with joined floor area and lease duration, visualized on an auto-drawing Tab05 geocoded map.

---

### 2. Core Functional Goals & Implementation Architecture

#### Goal 1: Filter Flats by Town and Flat Type
- **Implementation**: Client-side multi-dimensional index supporting 23 towns across 5 regions (Central, East, West, North, North-East) and 5 flat categories (2-Room, 3-Room, 4-Room, 5-Room, Executive).
- **Behavior**: Real-time cross-filtering updates the Budget Matrix, Price Trend charts, and Geocoder map simultaneously.

#### Goal 2: Chart Price Trends by Month
- **Time-Series Horizon**: Monthly resale transaction records spanning 2025-01 through 2026-03.
- **Metrics Tracked**:
  1. Median Resale Price ($)
  2. Average Price Per SQM ($/sqm)
  3. Transaction Volume
- **Visualization**: Dual-polyline comparative SVG chart with hover inspection, gridlines, and 14-month momentum percentages.

#### Goal 3: Join Floor Area (sqm) and Lease Remaining Data
- **Data Join Logic**:
  - \`floor_area_sqm\`: Real HDB architectural footprints (38 sqm to 155 sqm) + sqft conversion.
  - \`remaining_lease_years\` & \`remaining_lease_months\`: Derived from \`99 - (TransactionDate - LeaseCommenceDate)\`.
  - \`Bala's Table Discount Factor\`: Statutory SLA leasehold residual value calculation (\`0.15 + 0.85 * (Years / 99)^0.43\`).
  - \`price_per_sqm\`: Calculated as \`resale_price / floor_area_sqm\`.

#### Goal 4: 'What Does My Budget Buy' Explorer Interface
- **Financial Rule Engine**:
  - **Mortgage Servicing Ratio (MSR)**: Fixed at 30% of gross household monthly income for HDB flats.
  - **Loan Amortization**: \`P = PMT * [1 - (1 + r)^-n] / r\` (25-year tenure @ 2.6% HDB concessionary / 3.0%+ bank rate).
  - **Total Purchase Cap**: \`Max Loan + Cash Savings + CPF OA Balance\`.
- **Purchasing Power Matrix**: 23 Towns × 5 Flat Types classified as:
  - *Well Within Budget* (≤ 90% of cap)
  - *Tight Match* (90% - 100% of cap)
  - *Exceeds Budget* (> 100% of cap)

#### Goal 5: Integrate Tab05 Geocoder for Auto-Map Drawing
- **Tab05 Pipeline**:
  - Maps street addresses and postal blocks to national SVY21 Easting / Northing coordinates (EPSG:3414) and WGS84 Lat/Lng.
  - **Auto-Draw Mode**: Progressive SVG stream that draws island contours, regional boundaries, town centroids, and geocoded transaction nodes with real-time telemetry.
  - **Live Address Geocoding**: Interactive search box resolving queries with confidence scoring.

#### Goal 6: Seed Supabase Table for Annotation & Enrichment
- **PostgreSQL Schema**: Provisioned with PostGIS geospatial geometries (\`ST_SetSRID(ST_MakePoint(lng, lat), 4326)\`), index triggers, and RLS policies.
- **Product Annotations**: Editorial tagging model (\`flat_annotations\`) supporting tags like "Near MRT (<300m)", "Prime Location Housing (PLH)", and "Top Primary School".

---

### 3. Step-by-Step Prototype Construction Instructions

1. **Step 1: Data Model & Types Setup**
   - Create \`src/types/housing.ts\` defining \`FlatTransaction\`, \`TownSummary\`, \`BudgetInputs\`, and \`GeocoderResult\`.

2. **Step 2: Financial Calculator Engine**
   - Implement \`src/utils/financialCalculators.ts\` with MAS 30% MSR loan ceiling formulas, monthly repayment schedule, and SLA Bala's table curve.

3. **Step 3: Tab05 Geocoder & Vector Map Coordinates**
   - Implement \`src/utils/geocoder.ts\` with SVY21 national grid projection equations, town centroid mapping, and animated SVG path parameters.

4. **Step 4: Build 'What Does My Budget Buy' Interface**
   - Create \`src/components/BudgetExplorer.tsx\` featuring income sliders, loan tenure options, purchasing power matrix, and joined floor area/lease metrics.

5. **Step 5: Build Price Trends Visualizer**
   - Create \`src/components/MarketTrends.tsx\` charting monthly time-series benchmarks and town-to-town comparisons.

6. **Step 6: Build Tab05 Interactive Auto-Drawing Map**
   - Create \`src/components/GeocoderMap.tsx\` with interactive coordinate auto-draw sequence and address lookup sandbox.

7. **Step 7: Supabase Data Studio & Seeder**
   - Create \`src/components/SupabaseStudio.tsx\` containing DDL migrations, batch SQL insert script, and live editorial annotator.
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(planMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-bold text-slate-900">
              Structured Plan & Prototype Instructions
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown' : 'Copy Plan'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
          {/* Summary Box */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
              Data Product Blueprint
            </h3>
            <p className="text-xs text-slate-600">
              Engineered according to the WallStreetZen financial clarity model, avoiding AI slop, floating pills, or speculative data. Complete prototype instructions below:
            </p>
          </div>

          {/* Goals Breakdown */}
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>1. Filter flats by town and flat type</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Multi-faceted filtering across 23 Singapore HDB towns (Ang Mo Kio, Bedok, Bishan, Tampines, Punggol, Queenstown, etc.) and all 5 flat types (2-Room through Executive).
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>2. Chart price trends by month</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Interactive monthly time-series charts (Jan 2025 – Mar 2026) toggling between Median Resale Price, Price Per SQM, and Transaction Volume with comparative benchmark town overlay.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>3. Join floor area (sqm) and lease remaining fields</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Every transaction record joins exact architectural floor area (sqm + sqft), remaining lease in years and months, and Bala's Table leasehold depreciation multiplier.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>4. Build 'What Does My Budget Buy' interface</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Calculates maximum borrowing capacity based on the Singapore MAS 30% Mortgage Servicing Ratio (MSR) cap, cash downpayment, and CPF OA, providing an interactive purchasing power matrix across all towns.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>5. Integrate Tab05’s geocoder for auto-map drawing</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Ingests Tab05 national SVY21 Easting / Northing coordinates (EPSG:3414), with an animated vector auto-draw sequence that generates Singapore's coastline, regional subzones, and town centroids dynamically.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>6. Seed Supabase with dataset for annotation & product copy</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Provides full PostgreSQL PostGIS DDL migration scripts, live batch table seeding, and an interactive editorial annotation suite to enrich listings with product insights.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
          <span className="text-slate-500">Ready for full-stack engineering handoff</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded transition-colors"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
