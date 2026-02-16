import { Sun, Zap, Battery, ArrowDownToLine, ArrowUpFromLine, Thermometer, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatusCard from './StatusCard';
import { eg4Data, ecobeeData, vueData, optimizationAlerts, generateTimeSeriesData } from '../data/mockData';
import { useMemo } from 'react';

export default function Dashboard() {
  const timeSeriesData = useMemo(() => generateTimeSeriesData(24), []);
  const totalSolar = eg4Data.inverters.reduce((s, i) => s + i.solarPower, 0);
  const totalLoad = eg4Data.inverters.reduce((s, i) => s + i.loadPower, 0);
  const avgBattery = Math.round(eg4Data.batteries.reduce((s, b) => s + b.soc, 0) / eg4Data.batteries.length);
  const gridNet = eg4Data.inverters.reduce((s, i) => s + i.gridPower, 0);
  const highAlerts = optimizationAlerts.filter(a => a.severity === 'high');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">System Overview</h2>
          <p className="text-slate-400 text-sm mt-1">Real-time energy flow across all systems</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-battery-green animate-pulse" />
          <span className="text-slate-300">Live</span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatusCard
          title="Solar Production"
          value={totalSolar.toFixed(1)}
          unit="kW"
          subtitle="Peak today: 8.2 kW"
          icon={Sun}
          color="text-solar-yellow"
        />
        <StatusCard
          title="Home Consumption"
          value={totalLoad.toFixed(1)}
          unit="kW"
          subtitle={`HVAC: ${vueData.circuits[0].power} kW`}
          icon={Zap}
          color="text-hvac-blue"
        />
        <StatusCard
          title="Battery"
          value={avgBattery}
          unit="%"
          subtitle="6 banks &bull; 30 kWh total"
          icon={Battery}
          color="text-battery-green"
        />
        <StatusCard
          title={gridNet <= 0 ? 'Grid Export' : 'Grid Import'}
          value={Math.abs(gridNet).toFixed(2)}
          unit="kW"
          subtitle={gridNet <= 0 ? 'Selling to grid' : 'Buying from grid'}
          icon={gridNet <= 0 ? ArrowUpFromLine : ArrowDownToLine}
          color={gridNet <= 0 ? 'text-battery-green' : 'text-grid-red'}
        />
        <StatusCard
          title="Indoor Temp"
          value={ecobeeData.thermostats[0].currentTemp}
          unit="°F"
          subtitle={`Set: ${ecobeeData.thermostats[0].setTemp}°F • ${ecobeeData.thermostats[0].hvacStatus}`}
          icon={Thermometer}
          color="text-hvac-blue"
        />
      </div>

      {/* Energy Flow Chart */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">24-Hour Energy Flow</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={timeSeriesData}>
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="consumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} interval={2} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" kW" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Area type="monotone" dataKey="solar" stroke="#f59e0b" fill="url(#solarGrad)" strokeWidth={2} name="Solar" />
            <Area type="monotone" dataKey="consumption" stroke="#3b82f6" fill="url(#consumeGrad)" strokeWidth={2} name="Consumption" />
            <Area type="monotone" dataKey="gridImport" stroke="#ef4444" fill="url(#gridGrad)" strokeWidth={2} name="Grid Import" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Active Alerts */}
      {highAlerts.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-grid-red/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-grid-red" />
            <h3 className="text-lg font-semibold text-white">Priority Optimizations</h3>
            <span className="bg-grid-red/20 text-grid-red text-xs px-2 py-0.5 rounded-full font-medium">
              {highAlerts.length} action{highAlerts.length > 1 ? 's' : ''} needed
            </span>
          </div>
          <div className="space-y-3">
            {highAlerts.map(alert => (
              <div key={alert.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{alert.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{alert.description}</p>
                    <p className="text-xs text-battery-green mt-2 font-medium">
                      Potential savings: {alert.savings}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
