import { Sun, Wifi, WifiOff } from 'lucide-react';
import { useApiHealth } from '../hooks/useApi';

// Active navigation items (EG4 only for now)
const navItems = [
  { id: 'dashboard', label: 'EG4 Overview', icon: Sun },
];

// Future integrations — displayed as inactive placeholders
const plannedIntegrations = [
  { label: 'Emporia Vue',  sub: 'Circuit monitoring' },
  { label: 'Ecobee',       sub: 'HVAC & thermostat'  },
  { label: 'NNK Co-op',   sub: 'Utility & rates'    },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const { data: health } = useApiHealth();
  const eg4Ok = !!health?.services?.eg4;

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-700/50 flex flex-col min-h-screen">
      {/* Branding */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-solar-yellow to-solar-orange rounded-lg flex items-center justify-center flex-shrink-0">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Solar Dash</h1>
            <p className="text-xs text-slate-500">Energy Optimization</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-6">
        {/* EG4 section */}
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wider px-2 pb-1 font-semibold">
            EG4 Inverters
          </p>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-solar-yellow/15 text-solar-yellow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Planned integrations — greyed out, not clickable */}
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wider px-2 pb-1 font-semibold">
            Coming Soon
          </p>
          <div className="space-y-0.5">
            {plannedIntegrations.map(item => (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-35 cursor-default"
              >
                <div className="w-4 h-4 rounded border border-slate-600/60 border-dashed flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-500 leading-tight">{item.label}</p>
                  <p className="text-xs text-slate-600">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Connection status footer */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            {eg4Ok
              ? <Wifi className="w-3.5 h-3.5 text-battery-green flex-shrink-0" />
              : <WifiOff className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
            <span className={`text-xs font-medium ${eg4Ok ? 'text-slate-300' : 'text-slate-500'}`}>
              {eg4Ok ? 'EG4 Configured' : 'EG4 Not Configured'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {eg4Ok
              ? 'Live data · refreshes every 30 s'
              : 'Set EG4_EMAIL + EG4_PASSWORD in .env'}
          </p>
        </div>
      </div>
    </aside>
  );
}
