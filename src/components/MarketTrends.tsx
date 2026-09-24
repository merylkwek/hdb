import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart3, Filter, ArrowUpRight, ArrowDownRight, Layers, HelpCircle } from 'lucide-react';
import { FlatTransaction, FlatType } from '../types/housing';
import { SINGAPORE_TOWNS } from '../data/singaporeHousingData';
import { getBalasTableFactor } from '../utils/financialCalculators';

interface MarketTrendsProps {
  dataset: FlatTransaction[];
  selectedTown: string;
  onSelectTown: (town: string) => void;
}

export const MarketTrends: React.FC<MarketTrendsProps> = ({
  dataset,
  selectedTown,
  onSelectTown,
}) => {
  const [targetFlatType, setTargetFlatType] = useState<FlatType | 'ALL'>('4 ROOM');
  const [metric, setMetric] = useState<'median_price' | 'psm' | 'volume'>('median_price');
  const [comparisonTown, setComparisonTown] = useState<string>('PUNGGOL');

  // Filter dataset by chosen flat type
  const activeTown = selectedTown === 'ALL' ? 'TAMPINES' : selectedTown;

  // Months available
  const months = useMemo(() => {
    const list = Array.from(new Set(dataset.map((d) => d.month))).sort();
    return list;
  }, [dataset]);

  // Aggregate monthly series for active town
  const activeTownSeries = useMemo(() => {
    return months.map((m) => {
      const records = dataset.filter((d) => {
        if (d.month !== m) return false;
        if (d.town !== activeTown) return false;
        if (targetFlatType !== 'ALL' && d.flat_type !== targetFlatType) return false;
        return true;
      });

      if (records.length === 0) {
        return { month: m, count: 0, medianPrice: 0, psm: 0 };
      }

      const sorted = [...records.map((r) => r.resale_price)].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const avgPsm = Math.round(records.reduce((acc, r) => acc + r.price_per_sqm, 0) / records.length);

      return {
        month: m,
        count: records.length,
        medianPrice: median,
        psm: avgPsm,
      };
    });
  }, [dataset, months, activeTown, targetFlatType]);

  // Aggregate monthly series for comparison town
  const compTownSeries = useMemo(() => {
    return months.map((m) => {
      const records = dataset.filter((d) => {
        if (d.month !== m) return false;
        if (d.town !== comparisonTown) return false;
        if (targetFlatType !== 'ALL' && d.flat_type !== targetFlatType) return false;
        return true;
      });

      if (records.length === 0) {
        return { month: m, count: 0, medianPrice: 0, psm: 0 };
      }

      const sorted = [...records.map((r) => r.resale_price)].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const avgPsm = Math.round(records.reduce((acc, r) => acc + r.price_per_sqm, 0) / records.length);

      return {
        month: m,
        count: records.length,
        medianPrice: median,
        psm: avgPsm,
      };
    });
  }, [dataset, months, comparisonTown, targetFlatType]);

  // Chart Min/Max scaling
  const chartBounds = useMemo(() => {
    let vals1: number[] = [];
    let vals2: number[] = [];

    if (metric === 'median_price') {
      vals1 = activeTownSeries.map((s) => s.medianPrice).filter((v) => v > 0);
      vals2 = compTownSeries.map((s) => s.medianPrice).filter((v) => v > 0);
    } else if (metric === 'psm') {
      vals1 = activeTownSeries.map((s) => s.psm).filter((v) => v > 0);
      vals2 = compTownSeries.map((s) => s.psm).filter((v) => v > 0);
    } else {
      vals1 = activeTownSeries.map((s) => s.count);
      vals2 = compTownSeries.map((s) => s.count);
    }

    const combined = [...vals1, ...vals2];
    if (combined.length === 0) return { min: 0, max: 100 };
    const minVal = Math.min(...combined);
    const maxVal = Math.max(...combined);

    const pad = (maxVal - minVal) * 0.15 || 50;
    return {
      min: Math.max(0, Math.floor(minVal - pad)),
      max: Math.ceil(maxVal + pad),
    };
  }, [activeTownSeries, compTownSeries, metric]);

  // SVG Chart Polyline Points
  const getYCoordinate = (val: number, height = 240) => {
    if (val <= 0) return height;
    const range = chartBounds.max - chartBounds.min;
    if (range === 0) return height / 2;
    const pct = (val - chartBounds.min) / range;
    return Math.round(height - pct * (height - 30) - 15);
  };

  const polyline1 = useMemo(() => {
    const totalPoints = activeTownSeries.length;
    return activeTownSeries
      .map((pt, idx) => {
        const x = (idx / (totalPoints - 1)) * 600 + 40;
        const val = metric === 'median_price' ? pt.medianPrice : (metric === 'psm' ? pt.psm : pt.count);
        const y = getYCoordinate(val);
        return `${x},${y}`;
      })
      .join(' ');
  }, [activeTownSeries, metric, chartBounds]);

  const polyline2 = useMemo(() => {
    const totalPoints = compTownSeries.length;
    return compTownSeries
      .map((pt, idx) => {
        const x = (idx / (totalPoints - 1)) * 600 + 40;
        const val = metric === 'median_price' ? pt.medianPrice : (metric === 'psm' ? pt.psm : pt.count);
        const y = getYCoordinate(val);
        return `${x},${y}`;
      })
      .join(' ');
  }, [compTownSeries, metric, chartBounds]);

  // Overall 12-Month Momentum Calculation
  const firstVal = metric === 'median_price' ? activeTownSeries[0]?.medianPrice : activeTownSeries[0]?.psm;
  const lastVal = metric === 'median_price' ? activeTownSeries[activeTownSeries.length - 1]?.medianPrice : activeTownSeries[activeTownSeries.length - 1]?.psm;
  const pctChange = firstVal && lastVal ? +(((lastVal - firstVal) / firstVal) * 100).toFixed(1) : 0;

  // Floor Area (sqm) & Lease Remaining Distribution
  const townFlats = useMemo(() => {
    return dataset.filter((d) => d.town === activeTown);
  }, [dataset, activeTown]);

  return (
    <div className="space-y-6">
      {/* Header & Control Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Monthly Resale Price Trends
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Historical & current monthly transaction benchmarks from Jan 2025 to Mar 2026.
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md self-start md:self-auto">
            <button
              onClick={() => setMetric('median_price')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                metric === 'median_price'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Median Price ($)
            </button>
            <button
              onClick={() => setMetric('psm')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                metric === 'psm'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Price / SQM ($/sqm)
            </button>
            <button
              onClick={() => setMetric('volume')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                metric === 'volume'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Volume (Transactions)
            </button>
          </div>
        </div>

        {/* Filter Bar: Primary Town, Flat Type, Comparison Town */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Primary Focus Town
            </label>
            <select
              value={activeTown}
              onChange={(e) => onSelectTown(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded font-semibold text-slate-900 bg-white focus:outline-none"
            >
              {Object.keys(SINGAPORE_TOWNS).map((t) => (
                <option key={t} value={t}>
                  {t} ({SINGAPORE_TOWNS[t].region})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Flat Type Filter
            </label>
            <select
              value={targetFlatType}
              onChange={(e) => setTargetFlatType(e.target.value as FlatType | 'ALL')}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded font-semibold text-slate-900 bg-white focus:outline-none"
            >
              <option value="ALL">All Flat Types</option>
              <option value="2 ROOM">2-Room</option>
              <option value="3 ROOM">3-Room</option>
              <option value="4 ROOM">4-Room</option>
              <option value="5 ROOM">5-Room</option>
              <option value="EXECUTIVE">Executive / Maisonette</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Comparison Town (Benchmark)
            </label>
            <select
              value={comparisonTown}
              onChange={(e) => setComparisonTown(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded text-slate-700 bg-white focus:outline-none"
            >
              {Object.keys(SINGAPORE_TOWNS)
                .filter((t) => t !== activeTown)
                .map((t) => (
                  <option key={t} value={t}>
                    {t} ({SINGAPORE_TOWNS[t].region})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary Trend Chart Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-900"></span>
                <span className="text-sm font-bold text-slate-900">{activeTown}</span>
                <span className="text-xs text-slate-500">· {targetFlatType}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                Latest: {metric === 'median_price' ? `$${lastVal?.toLocaleString()}` : (metric === 'psm' ? `$${lastVal}/sqm` : `${lastVal} txs`)}
              </p>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span className="text-sm font-semibold text-slate-600">{comparisonTown}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Benchmark overlay</p>
            </div>
          </div>

          {metric !== 'volume' && (
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="text-slate-500">14-Mo Change:</span>
              <span className={`flex items-center font-mono font-semibold tabular-nums ${pctChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {pctChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`}
              </span>
            </div>
          )}
        </div>

        {/* SVG Time-Series Chart */}
        <div className="relative mt-4">
          <svg viewBox="0 0 680 260" className="w-full h-64 overflow-visible">
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const val = Math.round(chartBounds.min + ratio * (chartBounds.max - chartBounds.min));
              const y = getYCoordinate(val);
              return (
                <g key={ratio}>
                  <line
                    x1="40"
                    y1={y}
                    x2="640"
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x="35"
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {metric === 'median_price'
                      ? `$${Math.round(val / 1000)}k`
                      : metric === 'psm'
                      ? `$${val}`
                      : val}
                  </text>
                </g>
              );
            })}

            {/* Comparison Town Polyline (Dashed Muted Slate) */}
            <polyline
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4 4"
              points={polyline2}
            />

            {/* Active Town Polyline (Solid Slate 900) */}
            <polyline
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polyline1}
            />

            {/* Data Points */}
            {activeTownSeries.map((pt, idx) => {
              const x = (idx / (activeTownSeries.length - 1)) * 600 + 40;
              const val = metric === 'median_price' ? pt.medianPrice : (metric === 'psm' ? pt.psm : pt.count);
              const y = getYCoordinate(val);

              return (
                <g key={pt.month} className="group cursor-pointer">
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="group-hover:r-6 transition-all"
                  />
                  {/* Tooltip on hover */}
                  <title>{`${pt.month} (${activeTown}): ${metric === 'median_price' ? '$' + pt.medianPrice.toLocaleString() : (metric === 'psm' ? '$' + pt.psm + '/sqm' : pt.count + ' sales')}`}</title>
                  
                  {/* Month Label below */}
                  {idx % 2 === 0 && (
                    <text
                      x={x}
                      y="255"
                      textAnchor="middle"
                      className="text-[10px] fill-slate-500 font-mono"
                    >
                      {pt.month.slice(2)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-900 inline-block"></span>
              <span>{activeTown}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-400 stroke-dasharray inline-block"></span>
              <span>{comparisonTown}</span>
            </div>
          </div>
          <span>Updated as of March 2026 Resale Dataset</span>
        </div>
      </div>

      {/* Deep Dive: Floor Area (sqm) vs Lease Remaining Joined Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Floor Area vs Price Efficiency */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Floor Area (sqm) vs Price Efficiency
              </h3>
              <p className="text-xs text-slate-500">
                Joined floor area distribution in {activeTown}.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">sqm analysis</span>
          </div>

          <div className="space-y-3 mt-4">
            {(['2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE'] as FlatType[]).map((ft) => {
              const subset = townFlats.filter((f) => f.flat_type === ft);
              if (subset.length === 0) return null;

              const avgSqm = Math.round(subset.reduce((acc, f) => acc + f.floor_area_sqm, 0) / subset.length);
              const avgPrice = Math.round(subset.reduce((acc, f) => acc + f.resale_price, 0) / subset.length);
              const avgPsm = Math.round(subset.reduce((acc, f) => acc + f.price_per_sqm, 0) / subset.length);

              return (
                <div key={ft} className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-900">{ft}</span>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      Avg {avgSqm} sqm ({Math.round(avgSqm * 10.764)} sqft)
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                      ${avgPrice.toLocaleString()}
                    </span>
                    <div className="text-[11px] text-slate-600 font-mono tabular-nums">
                      ${avgPsm.toLocaleString()} / sqm
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Bala's Curve Remaining Lease Valuation */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Remaining Lease & Bala's Table Valuation
              </h3>
              <p className="text-xs text-slate-500">
                Singapore SLA statutory leasehold discount curve applied to {activeTown}.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">SLA 99-Yr Lease</span>
          </div>

          <div className="space-y-3 mt-4">
            {[90, 75, 60, 50].map((leaseBucket) => {
              const factor = getBalasTableFactor(leaseBucket);
              const pct = Math.round(factor * 100);
              
              return (
                <div key={leaseBucket} className="p-2.5 bg-slate-50 rounded border border-slate-100">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-800">{leaseBucket} Years Remaining Lease</span>
                    <span className="font-mono text-slate-900 tabular-nums">{pct}% Residual Value</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>
                      {leaseBucket >= 80 ? 'Full CPF Housing Loan Eligibility' : (leaseBucket >= 60 ? 'CPF Usage with Proration' : 'Cash Heavy / Limited Loan')}
                    </span>
                    <span className="font-mono">Factor: {factor}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
