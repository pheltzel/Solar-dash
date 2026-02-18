import { Sun, Zap, Battery, ArrowDownToLine, ArrowUpFromLine, Thermometer, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatusCard from './StatusCard';
import { ecobeeData as mockEcobee, vueData as mockVue, optimizationAlerts, generateTimeSeriesData } from '../data/mockData';
import { useMemo } from 'react';
import { useEg4System, useEcobeeData, useEmporiaData } from '../hooks/useApi';

export default function Dashboard() {
  const { data: eg4Live } = useEg4System();
  const { data: ecobeeLive } = useEcobeeData();
  const { data: emporiaLive } = useEmporiaData();

  const timeSeriesData = useMemo(() => generateTimeSeriesData(24), []);

  // EG4: live data or null — no mock fallback
  const hasEg4 = eg4Live?.inverters?.length > 0;
  const eg4Inverters = hasEg4 ? eg4Live.inverters : [];

  const totalSolar = hasEg4 ? eg4Inverters.reduce((s, i) => s + (i.solarPower || 0), 0) : null;
  const totalLoad = hasEg4 ? eg4Inverters.reduce((s, i) => s + (i.loadPower || 0), 0) : null;
  const avgBattery = hasEg4
    ? Math.round(eg4Inverters.reduce((s, i) => s + (i.batterySOC || 0), 0) / eg4Inverters.length)
    : null;
  const gridNet = hasEg4 ? eg4Inverters.reduce((s, i) => s + (i.gridPower || 0), 0) : null;
  const dailyProd = hasEg4 ? eg4Inverters.reduce((s, i) => s + (i.dailyProduction || 0), 0) : null;

  // Ecobee / Emporia: still fall back to mock for now (we'll fix these next)
  const ecobee = ecobeeLive?.thermostats || mockEcobee.thermostats;
  const vueTotal = emporiaLive?.totalPower ?? mockVue.totalUsage;
  const hvacPower = emporiaLive?.circuits?.find(c => c.name.toLowerCase().includes('hvac'))?.power ?? mockVue.circuits[0].power;

  const indoorTemp = ecobee[0]?.currentTemp ?? mockEcobee.thermostats[0].currentTemp;
  const setTemp = ecobee[0]?.setTemp ?? ecobee[0]?.coolSetTemp ?? mockEcobee.thermostats[0].setTemp;
  const hvacStatus = ecobee[0]?.hvacStatus ?? mockEcobee.thermostats[0].hvacStatus;

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
          value={totalSolar != null ? totalSolar.toFixed(1) : '--'}
          unit="kW"
          subtitle={dailyProd != null ? `Today: ${dailyProd.toFixed(1)} kWh` : 'Connecting to EG4...'}
          icon={Sun}
          color="text-solar-yellow"
        />
        <StatusCard
          title="Home Consumption"
          value={totalLoad != null ? totalLoad.toFixed(1) : '--'}
          unit="kW"
          subtitle={`HVAC: ${hvacPower} kW`}
          icon={Zap}
          color="text-hvac-blue"
        />
        <StatusCard
          title="Battery"
          value={avgBattery != null ? avgBattery : '--'}
          unit="%"
          subtitle={hasEg4 ? `${eg4Inverters.length} inverter(s)` : 'Connecting to EG4...'}
          icon={Battery}
          color="text-battery-green"
        />
        <StatusCard
          title={gridNet != null && gridNet <= 0 ? 'Grid Export' : 'Grid Import'}
          value={gridNet != null ? Math.abs(gridNet).toFixed(2) : '--'}
          unit="kW"
          subtitle={gridNet != null ? (gridNet <= 0 ? 'Selling to grid' : 'Buying from grid') : 'Connecting to EG4...'}
          icon={gridNet != null && gridNet <= 0 ? ArrowUpFromLine : ArrowDownToLine}
          color={gridNet != null && gridNet <= 0 ? 'text-battery-green' : 'text-grid-red'}
        />
        <StatusCard
          title="Indoor Temp"
          value={indoorTemp}
          unit="°F"
          subtitle={`Set: ${setTemp}°F • ${hvacStatus}`}
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
