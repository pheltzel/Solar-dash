import { Sun, Zap, Thermometer, DollarSign, Lightbulb, LayoutDashboard } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'solar', label: 'Solar & Battery', icon: Sun },
  { id: 'energy', label: 'Energy Monitor', icon: Zap },
  { id: 'hvac', label: 'HVAC / Ecobee', icon: Thermometer },
  { id: 'utility', label: 'Utility & Costs', icon: DollarSign },
  { id: 'optimize', label: 'Optimize', icon: Lightbulb },
];

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700/50 flex flex-col min-h-screen">
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-solar-yellow to-solar-orange rounded-lg flex items-center justify-center">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Solar Dash</h1>
            <p className="text-xs text-slate-400">Optimization Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-solar-yellow/15 text-solar-yellow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-battery-green animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">System Online</span>
          </div>
          <p className="text-xs text-slate-500">2 inverters connected</p>
          <p className="text-xs text-slate-500">4 batteries healthy</p>
        </div>
      </div>
    </aside>
  );
}
