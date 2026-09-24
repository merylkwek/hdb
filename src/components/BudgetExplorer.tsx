import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Home, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Calculator, 
  ArrowRight, 
  Layers, 
  Clock, 
  Maximize2 
} from 'lucide-react';
import { FlatTransaction, FlatType, SingaporeRegion, BudgetInputs } from '../types/housing';
import { evaluateAffordability, calculateDepreciatedLeaseValue } from '../utils/financialCalculators';
import { SINGAPORE_TOWNS } from '../data/singaporeHousingData';

interface BudgetExplorerProps {
  dataset: FlatTransaction[];
  onSelectTown: (town: string) => void;
  onSelectFlat: (flat: FlatTransaction) => void;
  onNavigateToDirectory?: () => void;
  onNavigateToMap?: () => void;
}

export const BudgetExplorer: React.FC<BudgetExplorerProps> = ({
  dataset,
  onSelectTown,
  onSelectFlat,
  onNavigateToDirectory,
  onNavigateToMap,
}) => {
  // Budget State
  const [budgetInputs, setBudgetInputs] = useState<BudgetInputs>({
    mode: 'monthly_income',
    monthlyIncome: 8500,
    cashDownpayment: 50000,
    cpfOaBalance: 70000,
    interestRate: 2.6, // Standard HDB Concessionary Loan rate
    loanTenureYears: 25,
    targetFlatTypes: ['3 ROOM', '4 ROOM', '5 ROOM'],
    preferredRegions: [],
    minRemainingLease: 60,
    minFloorAreaSqm: 65,
    customMaxBudget: 650000,
  });

  const [selectedTownFilter, setSelectedTownFilter] = useState<string>('ALL');

  // Affordability Evaluation
  const affordability = useMemo(() => {
    return evaluateAffordability(budgetInputs, dataset);
  }, [budgetInputs, dataset]);

  // Filtered & Ranked Flat Matches
  const matchedFlats = useMemo(() => {
    return dataset
      .filter((flat) => {
        if (flat.resale_price > affordability.totalMaxBudget) return false;
        if (budgetInputs.targetFlatTypes.length > 0 && !budgetInputs.targetFlatTypes.includes(flat.flat_type)) return false;
        if (flat.remaining_lease_years < budgetInputs.minRemainingLease) return false;
        if (flat.floor_area_sqm < budgetInputs.minFloorAreaSqm) return false;
        if (selectedTownFilter !== 'ALL' && flat.town !== selectedTownFilter) return false;
        return true;
      })
      .sort((a, b) => {
        // Value ranking: lower price per sqm first
        return a.price_per_sqm - b.price_per_sqm;
      });
  }, [dataset, affordability.totalMaxBudget, budgetInputs, selectedTownFilter]);

  // Town Affordability Matrix Data
  const townAffordabilityMatrix = useMemo(() => {
    const towns = Object.keys(SINGAPORE_TOWNS);
    const flatTypes: FlatType[] = ['2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE'];

    return towns.map((town) => {
      const region = SINGAPORE_TOWNS[town].region;
      const townTxs = dataset.filter((t) => t.town === town);

      const typeStatus: Record<FlatType, { 
        available: boolean; 
        medianPrice: number; 
        psm: number;
        status: 'comfortable' | 'stretched' | 'out_of_reach' | 'none';
      }> = {
        '2 ROOM': { available: false, medianPrice: 0, psm: 0, status: 'none' },
        '3 ROOM': { available: false, medianPrice: 0, psm: 0, status: 'none' },
        '4 ROOM': { available: false, medianPrice: 0, psm: 0, status: 'none' },
        '5 ROOM': { available: false, medianPrice: 0, psm: 0, status: 'none' },
        'EXECUTIVE': { available: false, medianPrice: 0, psm: 0, status: 'none' },
      };

      flatTypes.forEach((ft) => {
        const matching = townTxs.filter((t) => t.flat_type === ft);
        if (matching.length > 0) {
          const sorted = [...matching.map((m) => m.resale_price)].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          const avgPsm = Math.round(matching.reduce((acc, m) => acc + m.price_per_sqm, 0) / matching.length);
          
          let status: 'comfortable' | 'stretched' | 'out_of_reach' = 'out_of_reach';
          if (median <= affordability.totalMaxBudget * 0.90) {
            status = 'comfortable';
          } else if (median <= affordability.totalMaxBudget) {
            status = 'stretched';
          }

          typeStatus[ft] = {
            available: true,
            medianPrice: median,
            psm: avgPsm,
            status,
          };
        }
      });

      return {
        town,
        region,
        typeStatus,
      };
    });
  }, [dataset, affordability.totalMaxBudget]);

  // Preset Handlers
  const applyPreset = (preset: 'starter' | 'family' | 'upgrader' | 'investor') => {
    if (preset === 'starter') {
      setBudgetInputs({
        ...budgetInputs,
        mode: 'monthly_income',
        monthlyIncome: 6500,
        cashDownpayment: 40000,
        cpfOaBalance: 60000,
        interestRate: 2.6,
        targetFlatTypes: ['3 ROOM', '4 ROOM'],
        minRemainingLease: 65,
        minFloorAreaSqm: 65,
      });
    } else if (preset === 'family') {
      setBudgetInputs({
        ...budgetInputs,
        mode: 'monthly_income',
        monthlyIncome: 10500,
        cashDownpayment: 80000,
        cpfOaBalance: 120000,
        interestRate: 2.6,
        targetFlatTypes: ['4 ROOM', '5 ROOM'],
        minRemainingLease: 70,
        minFloorAreaSqm: 90,
      });
    } else if (preset === 'upgrader') {
      setBudgetInputs({
        ...budgetInputs,
        mode: 'monthly_income',
        monthlyIncome: 15000,
        cashDownpayment: 150000,
        cpfOaBalance: 180000,
        interestRate: 3.2,
        targetFlatTypes: ['5 ROOM', 'EXECUTIVE'],
        minRemainingLease: 75,
        minFloorAreaSqm: 110,
      });
    } else if (preset === 'investor') {
      setBudgetInputs({
        ...budgetInputs,
        mode: 'total_budget',
        customMaxBudget: 750000,
        cashDownpayment: 100000,
        cpfOaBalance: 150000,
        interestRate: 3.0,
        targetFlatTypes: ['3 ROOM', '4 ROOM', '5 ROOM'],
        minRemainingLease: 60,
        minFloorAreaSqm: 70,
      });
    }
  };

  const toggleFlatType = (type: FlatType) => {
    setBudgetInputs((prev) => {
      const exists = prev.targetFlatTypes.includes(type);
      return {
        ...prev,
        targetFlatTypes: exists
          ? prev.targetFlatTypes.filter((t) => t !== type)
          : [...prev.targetFlatTypes, type],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Persona Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              What Does My Budget Buy?
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Simulate borrowing power under Singapore MAS 30% MSR and explore matching towns by floor area & remaining lease.
            </p>
          </div>
          
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 font-medium mr-1">Quick Presets:</span>
            <button
              onClick={() => applyPreset('starter')}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
            >
              First-Timer ($6.5k/mo)
            </button>
            <button
              onClick={() => applyPreset('family')}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
            >
              Growing Family ($10.5k/mo)
            </button>
            <button
              onClick={() => applyPreset('upgrader')}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
            >
              Upgrader ($15k/mo)
            </button>
            <button
              onClick={() => applyPreset('investor')}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
            >
              Fixed $750k Cap
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Financial Configuration Panel & Affordability KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Financial Parameter Controls (4 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Affordability Parameters</h2>
            </div>
            
            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-0.5 rounded">
              <button
                onClick={() => setBudgetInputs({ ...budgetInputs, mode: 'monthly_income' })}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  budgetInputs.mode === 'monthly_income'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Income
              </button>
              <button
                onClick={() => setBudgetInputs({ ...budgetInputs, mode: 'total_budget' })}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  budgetInputs.mode === 'total_budget'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fixed Budget
              </button>
            </div>
          </div>

          {budgetInputs.mode === 'monthly_income' ? (
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Gross Household Monthly Income</span>
                <span className="font-mono text-slate-900 font-semibold tabular-nums">
                  ${budgetInputs.monthlyIncome.toLocaleString()} / mo
                </span>
              </div>
              <input
                type="range"
                min="3000"
                max="25000"
                step="500"
                value={budgetInputs.monthlyIncome}
                onChange={(e) =>
                  setBudgetInputs({ ...budgetInputs, monthlyIncome: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                <span>$3,000</span>
                <span>$12,000</span>
                <span>$25,000</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Target Flat Budget Cap</span>
                <span className="font-mono text-slate-900 font-semibold tabular-nums">
                  ${(budgetInputs.customMaxBudget || 650000).toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="300000"
                max="1400000"
                step="25000"
                value={budgetInputs.customMaxBudget || 650000}
                onChange={(e) =>
                  setBudgetInputs({ ...budgetInputs, customMaxBudget: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                <span>$300,000</span>
                <span>$850,000</span>
                <span>$1,400,000</span>
              </div>
            </div>
          )}

          {/* Capital Deposits: Cash + CPF OA */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cash Downpayment
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs text-slate-400">$</span>
                <input
                  type="number"
                  step="5000"
                  value={budgetInputs.cashDownpayment}
                  onChange={(e) =>
                    setBudgetInputs({
                      ...budgetInputs,
                      cashDownpayment: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-full pl-6 pr-2 py-1.5 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                CPF OA Balance
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs text-slate-400">$</span>
                <input
                  type="number"
                  step="5000"
                  value={budgetInputs.cpfOaBalance}
                  onChange={(e) =>
                    setBudgetInputs({
                      ...budgetInputs,
                      cpfOaBalance: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-full pl-6 pr-2 py-1.5 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Loan Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Interest Rate (% p.a.)
              </label>
              <select
                value={budgetInputs.interestRate}
                onChange={(e) =>
                  setBudgetInputs({ ...budgetInputs, interestRate: Number(e.target.value) })
                }
                className="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value={2.6}>2.60% (HDB Concessionary)</option>
                <option value={3.0}>3.00% (Bank Fixed 2Y)</option>
                <option value={3.25}>3.25% (Bank Floating)</option>
                <option value={3.75}>3.75% (Stress Test Rate)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Loan Tenure
              </label>
              <select
                value={budgetInputs.loanTenureYears}
                onChange={(e) =>
                  setBudgetInputs({ ...budgetInputs, loanTenureYears: Number(e.target.value) })
                }
                className="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value={25}>25 Years (HDB Standard)</option>
                <option value={20}>20 Years</option>
                <option value={15}>15 Years</option>
                <option value={30}>30 Years (Bank Max)</option>
              </select>
            </div>
          </div>

          {/* Flat Type Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Eligible Flat Types
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE'] as FlatType[]).map((type) => {
                const isSelected = budgetInputs.targetFlatTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleFlatType(type)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Joined Floor Area & Lease Remaining Sliders */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div>
              <div className="flex justify-between text-xs text-slate-700 mb-1">
                <span>Minimum Remaining Lease</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {budgetInputs.minRemainingLease} Years+
                </span>
              </div>
              <input
                type="range"
                min="45"
                max="90"
                step="5"
                value={budgetInputs.minRemainingLease}
                onChange={(e) =>
                  setBudgetInputs({ ...budgetInputs, minRemainingLease: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Note: Buyers need ≥20 years remaining lease to tap CPF housing funds.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-700 mb-1">
                <span>Minimum Floor Area</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {budgetInputs.minFloorAreaSqm} sqm ({Math.round(budgetInputs.minFloorAreaSqm * 10.764)} sqft)
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="140"
                step="5"
                value={budgetInputs.minFloorAreaSqm}
                onChange={(e) =>
                  setBudgetInputs({ ...budgetInputs, minFloorAreaSqm: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Right Column: WallStreetZen-Style Affordability KPIs & Purchasing Power Matrix (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Executive Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-xs text-slate-500 font-medium">Max Total Budget</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                ${Math.round(affordability.totalMaxBudget / 1000)}k
              </p>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Loan + Initial CPF/Cash</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-xs text-slate-500 font-medium">Max Borrowing Cap</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                ${Math.round(affordability.maxEligibleLoan / 1000)}k
              </p>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>30% MSR Cap Compliant</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-xs text-slate-500 font-medium">Monthly Installment</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                ${affordability.estimatedMonthlyRepayment.toLocaleString()}
              </p>
              <div className="text-[11px] text-slate-500 mt-1">
                <span>{affordability.msrUtilized}% of monthly income</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-xs text-slate-500 font-medium">Market Reach</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {affordability.matchingTownsCount} <span className="text-xs font-normal text-slate-500">towns</span>
              </p>
              <div className="text-[11px] text-slate-500 mt-1">
                <span className="font-mono tabular-nums">{affordability.matchingFlatsCount}</span> matching units
              </div>
            </div>
          </div>

          {/* Purchasing Power Matrix */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Town Purchasing Power Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Real median resale benchmark for each flat type compared against your ${Math.round(affordability.totalMaxBudget / 1000)}k budget.
                </p>
              </div>

              {/* Legend */}
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
                  <span className="text-slate-600">Well Within Budget</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                  <span className="text-slate-600">Tight Match (&lt;100%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-300"></span>
                  <span className="text-slate-400">Exceeds Budget</span>
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 rounded max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 text-slate-700 font-semibold border-b border-slate-200 z-10">
                  <tr>
                    <th className="py-2 px-3">Town / Region</th>
                    <th className="py-2 px-2 text-right">2-Room</th>
                    <th className="py-2 px-2 text-right">3-Room</th>
                    <th className="py-2 px-2 text-right">4-Room</th>
                    <th className="py-2 px-2 text-right">5-Room</th>
                    <th className="py-2 px-2 text-right">Executive</th>
                    <th className="py-2 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {townAffordabilityMatrix.map((item) => (
                    <tr key={item.town} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.town}</span>
                          <span className="text-[10px] text-slate-400">· {item.region}</span>
                        </div>
                      </td>

                      {(['2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE'] as FlatType[]).map((ft) => {
                        const status = item.typeStatus[ft];
                        if (!status.available) {
                          return (
                            <td key={ft} className="py-2 px-2 text-right text-slate-300 font-mono">
                              —
                            </td>
                          );
                        }

                        let bgClass = 'text-slate-400';
                        if (status.status === 'comfortable') {
                          bgClass = 'text-emerald-700 font-semibold bg-emerald-50/60 rounded px-1.5 py-0.5';
                        } else if (status.status === 'stretched') {
                          bgClass = 'text-amber-800 font-semibold bg-amber-50/70 rounded px-1.5 py-0.5';
                        }

                        return (
                          <td key={ft} className="py-2 px-2 text-right font-mono tabular-nums">
                            <span className={bgClass}>
                              ${Math.round(status.medianPrice / 1000)}k
                            </span>
                          </td>
                        );
                      })}

                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedTownFilter(item.town);
                            onSelectTown(item.town);
                          }}
                          className="text-[11px] text-slate-700 hover:text-slate-950 font-medium hover:underline"
                        >
                          Filter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mt-2.5 gap-2">
              <span>Displaying 23 Singapore HDB towns sorted by geographic region</span>
              <div className="flex items-center gap-3">
                {onNavigateToMap && (
                  <button
                    onClick={onNavigateToMap}
                    className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View on Flats Map</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                )}
                {onNavigateToDirectory && (
                  <button
                    onClick={onNavigateToDirectory}
                    className="text-slate-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Browse Directory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Flat Listings Matching Budget */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span>Matching Flats Within Budget</span>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-normal tabular-nums">
                {matchedFlats.length} flats available
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by $/sqm value efficiency. Floor area & remaining lease joined on every unit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter Town:</span>
            <select
              value={selectedTownFilter}
              onChange={(e) => setSelectedTownFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Towns ({matchedFlats.length})</option>
              {Object.keys(SINGAPORE_TOWNS).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {matchedFlats.length === 0 ? (
          <div className="py-12 text-center">
            <Home className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No flats found within current criteria</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your monthly income, increasing downpayment, or lowering minimum remaining lease.
            </p>
            <button
              onClick={() => applyPreset('starter')}
              className="mt-3 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800"
            >
              Reset to Recommended Starter Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {matchedFlats.slice(0, 6).map((flat) => {
              const leaseAnalysis = calculateDepreciatedLeaseValue(flat.resale_price, flat.remaining_lease_years);
              const budgetPercentage = Math.round((flat.resale_price / affordability.totalMaxBudget) * 100);

              return (
                <div
                  key={flat.id}
                  onClick={() => onSelectFlat(flat)}
                  className="border border-slate-200 hover:border-slate-400 rounded-lg p-4 hover:shadow-xs transition-all cursor-pointer bg-white flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 text-sm">{flat.town}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-xs font-medium text-slate-600">{flat.flat_type}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Blk {flat.block} {flat.street_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                          ${flat.resale_price.toLocaleString()}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          ${flat.price_per_sqm.toLocaleString()}/sqm
                        </div>
                      </div>
                    </div>

                    {/* Joined Floor Area and Lease Remaining Block */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded">
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Maximize2 className="w-3 h-3" />
                          <span>Floor Area</span>
                        </div>
                        <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                          {flat.floor_area_sqm} sqm
                          <span className="text-[10px] text-slate-500 font-normal ml-1">
                            ({Math.round(flat.floor_area_sqm * 10.764)} sqft)
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2 rounded">
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>Remaining Lease</span>
                        </div>
                        <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                          {flat.remaining_lease_years} yrs {flat.remaining_lease_months} mos
                        </div>
                      </div>
                    </div>

                    {/* Unboxed Metadata (Design Constitution: No Pill Enclosures) */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <span>Storey {flat.storey_range}</span>
                      <span aria-hidden="true">·</span>
                      <span>Model: {flat.flat_model}</span>
                      <span aria-hidden="true">·</span>
                      <span>Commenced {flat.lease_commence_date}</span>
                    </div>

                    {/* Product Annotation / Tag */}
                    {flat.annotation && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50/80 p-2 rounded italic">
                        "{flat.annotation}"
                      </p>
                    )}
                  </div>

                  {/* Budget Fit Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Utilizes <strong className="text-slate-900 font-mono">{budgetPercentage}%</strong> of budget
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTown(flat.town);
                      }}
                      className="text-slate-800 hover:text-slate-950 font-semibold flex items-center gap-1"
                    >
                      <span>Explore Town</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
