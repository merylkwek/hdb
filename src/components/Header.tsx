import React from 'react';
import { Building2, SlidersHorizontal, TrendingUp, Building, MapPin } from 'lucide-react';

export type AppTab = 'budget' | 'trends' | 'map' | 'directory';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  transactionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
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
            className="text-lg font-bold tracking-tight text-slate-900 text-left hover:text-slate-700 transition-colors cursor-pointer"
          >
            Houselytics
          </button>
        </div>

        {/* Zone 2: Navigation Links for End Users */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onTabChange('budget')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
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
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
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
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'map'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Flats Map</span>
          </button>

          <button
            onClick={() => onTabChange('directory')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Flats Directory</span>
            <span className="font-mono text-xs text-slate-400 tabular-nums">({transactionCount})</span>
          </button>
        </nav>

        {/* Zone 3: Market Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 hidden sm:inline-block">
            Singapore HDB Resale Intelligence
          </span>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center overflow-x-auto border-t border-slate-100 px-3 py-2 gap-1 scrollbar-none">
        <button
          onClick={() => onTabChange('budget')}
          className={`px-3 py-1.5 text-xs whitespace-nowrap rounded cursor-pointer ${activeTab === 'budget' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
        >
          Budget Buy
        </button>
        <button
          onClick={() => onTabChange('trends')}
          className={`px-3 py-1.5 text-xs whitespace-nowrap rounded cursor-pointer ${activeTab === 'trends' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
        >
          Price Trends
        </button>
        <button
          onClick={() => onTabChange('map')}
          className={`px-3 py-1.5 text-xs whitespace-nowrap rounded cursor-pointer ${activeTab === 'map' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
        >
          Flats Map
        </button>
        <button
          onClick={() => onTabChange('directory')}
          className={`px-3 py-1.5 text-xs whitespace-nowrap rounded cursor-pointer ${activeTab === 'directory' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
        >
          Directory ({transactionCount})
        </button>
      </div>
    </header>
  );
};

