import React from 'react';
import { Activity, Building2, Compass, Database, FileCode2, SlidersHorizontal, TrendingUp } from 'lucide-react';

interface HeaderProps {
  activeTab: 'budget' | 'trends' | 'map' | 'directory' | 'supabase';
  onTabChange: (tab: 'budget' | 'trends' | 'map' | 'directory' | 'supabase') => void;
  onOpenBlueprint: () => void;
  onOpenApiHealth: () => void;
  transactionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenBlueprint,
  onOpenApiHealth,
  transactionCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white">
            <Building2 className="w-4 h-4" />
          </div>
          <button
            onClick={() => onTabChange('budget')}
            className="text-lg font-bold tracking-tight text-slate-900 text-left hover:text-slate-700 transition-colors"
          >
            Houselytics
          </button>
        </div>

        {/* Zone 2: Single-line Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onTabChange('budget')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'budget'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>What Does My Budget Buy</span>
          </button>

          <button
            onClick={() => onTabChange('trends')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'trends'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Price Trends</span>
          </button>

          <button
            onClick={() => onTabChange('map')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Tab05 Geocoder Map</span>
          </button>

          <button
            onClick={() => onTabChange('directory')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'directory'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>Flats Directory</span>
            <span className="font-mono text-xs text-slate-400 tabular-nums">({transactionCount})</span>
          </button>

          <button
            onClick={() => onTabChange('supabase')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Studio</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Health Monitor */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenApiHealth}
            className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Inspect API Health Status & Endpoints"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>API Health</span>
          </button>

          <button
            onClick={onOpenBlueprint}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Architecture Blueprint</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center overflow-x-auto border-t border-slate-100 px-3 py-2 gap-1 scrollbar-none">
        <button
          onClick={() => onTabChange('budget')}
          className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${activeTab === 'budget' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
        >
          Budget Buy
        </button>
        <button
          onClick={() => onTabChange('trends')}
          className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${activeTab === 'trends' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
        >
          Trends
        </button>
        <button
          onClick={() => onTabChange('map')}
          className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${activeTab === 'map' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
        >
          Tab05 Map
        </button>
        <button
          onClick={() => onTabChange('directory')}
          className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${activeTab === 'directory' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
        >
          Directory ({transactionCount})
        </button>
        <button
          onClick={() => onTabChange('supabase')}
          className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${activeTab === 'supabase' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
        >
          Supabase
        </button>
      </div>
    </header>
  );
};
