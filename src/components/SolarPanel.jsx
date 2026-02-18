import { Sun, Battery, Gauge, Thermometer, Activity, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateTimeSeriesData } from '../data/mockData';
import { useMemo } from 'react';
import { useEg4System } from '../hooks/useApi';

export default function SolarPanel() {
  const { data: eg4Live, loading } = useEg4System();
  const timeSeriesData = useMemo(() => generateTimeSeriesData(24), []);

  const hasLive = eg4Live?.inverters?.length > 0;
  const eg4Data = hasLive ? transformEg4Live(eg4Live) : null;

  const totalSolar = eg4Data ? eg4Data.inverters.reduce((s, i) => s + i.solarPower, 0) : null;
  const totalDailyProd = eg4Data ? eg4Data.inverters.reduce((s, i) => s + i.dailyProduction, 0) : null;

  const batteryColors = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#a7f3d0', '#6ee7b7'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Solar & Battery</h2>
        <p className="text-slate-400 text-sm mt-1">
          {eg4Data ? eg4Data.inverters.map(i => i.name).join(' + ') : (loading ? 'Connecting to EG4...' : 'EG4 not connected')}
        </p>
      </div>

      {/* No data state */}
      {!eg4Data && (
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700/50 text-center">
          <Sun className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-lg text-slate-400">{loading ? 'Connecting to EG4...' : 'No live EG4 data'}</p>
          <p className="text-sm text-slate-500 mt-2">
            Test the connection at <span className="text-hvac-blue font-mono">localhost:3001/api/eg4/test</span>
          </p>
        </div>
      )}

      {/* Inverter Cards — only shown with live data */}
      {eg4Data && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {eg4Data.inverters.map(inv => (
              <div key={inv.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-solar-yellow/15 rounded-lg flex items-center justify-center">
                      <Sun className="w-5 h-5 text-solar-yellow" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{inv.name}</h3>
                      <p className="text-xs text-slate-400">{inv.id}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    inv.status === 'Online'
                      ? 'bg-battery-green/15 text-battery-green'
                      : 'bg-grid-red/15 text-grid-red'
                  }`}>
                    {inv.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Solar Power" value={`${inv.solarPower} kW`} color="text-solar-yellow" />
                  <Stat label="Load Power" value={`${inv.loadPower} kW`} color="text-hvac-blue" />
                  <Stat label="Battery" value={`${inv.batterySOC}%`} color="text-battery-green" />
                  <Stat label="Grid" value={`${inv.gridPower >= 0 ? '+' : ''}${inv.gridPower} kW`}
                    color={inv.gridPower > 0 ? 'text-grid-red' : 'text-battery-green'} />
                  <Stat label="PV Voltage" value={`${inv.pvVoltage} V`} color="text-slate-300" />
                  <Stat label="PV Current" value={`${inv.pvCurrent} A`} color="text-slate-300" />
                  <Stat label="MPPT 1" value={`${inv.mppt1Power} kW`} color="text-solar-yellow" />
                  <Stat label="MPPT 2" value={`${inv.mppt2Power} kW`} color="text-solar-yellow" />
                  <Stat label="Daily Yield" value={`${inv.dailyProduction} kWh`} color="text-solar-yellow" />
                  <Stat label="Mode" value={inv.workingMode} color="text-slate-300" />
                </div>
              </div>
            ))}
          </div>

          {/* Combined stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 text-center">
              <Sun className="w-8 h-8 text-solar-yellow mx-auto mb-2" />
              <p className="text-3xl font-bold text-solar-yellow">{totalSolar.toFixed(1)} kW</p>
              <p className="text-sm text-slate-400 mt-1">Total Solar Now</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 text-center">
              <Activity className="w-8 h-8 text-battery-green mx-auto mb-2" />
              <p className="text-3xl font-bold text-battery-green">{totalDailyProd.toFixed(1)} kWh</p>
              <p className="text-sm text-slate-400 mt-1">Total Today</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 text-center">
              <Gauge className="w-8 h-8 text-hvac-blue mx-auto mb-2" />
              <p className="text-3xl font-bold text-hvac-blue">
                {(eg4Data.inverters.reduce((s, i) => s + i.totalProduction, 0) / 1000).toFixed(1)} MWh
              </p>
              <p className="text-sm text-slate-400 mt-1">Lifetime Production</p>
            </div>
          </div>

          {/* Battery Banks */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Battery className="w-5 h-5 text-battery-green" />
              <h3 className="text-lg font-semibold text-white">Battery Banks</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eg4Data.batteries.map((bat, i) => (
                <div key={bat.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">{bat.id}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 mb-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{ width: `${bat.soc}%`, backgroundColor: batteryColors[i % batteryColors.length] }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">SOC</span>
                      <p className="text-white font-semibold">{bat.soc}%</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Voltage</span>
                      <p className="text-white font-semibold">{bat.voltage || '--'}V</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Temp</span>
                      <p className="text-white font-semibold">{bat.temp || '--'}°C</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Production Chart */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Solar Production vs Battery SOC</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} interval={2} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="solar" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Solar (kW)" />
            <Bar dataKey="battery" fill="#22c55e" radius={[2, 2, 0, 0]} name="Battery (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}

// Transform live EG4/SolarMan API data into the shape our components expect.
// The server now pre-parses SolarMan values, so we just reshape into component format.
function transformEg4Live(live) {
  const inverters = (live.inverters || []).map((inv, i) => ({
    id: inv.deviceSn || `EG4-${String(i + 1).padStart(2, '0')}`,
    name: inv.deviceName || `Inverter ${i + 1}`,
    status: inv.connectStatus === 1 ? 'Online' : 'Offline',
    firmware: '',
    // Use pre-parsed values from server (falls back to 0 if missing)
    solarPower: inv.solarPower || 0,
    batteryPower: inv.batteryPower || 0,
    gridPower: inv.gridPower || 0,
    loadPower: inv.loadPower || 0,
    batterySOC: inv.batterySOC || 0,
    batteryVoltage: inv.batteryVoltage || 0,
    batteryTemp: inv.batteryTemp || 0,
    pvVoltage: inv.pvVoltage || 0,
    pvCurrent: inv.pvCurrent || 0,
    mppt1Power: inv.mppt1Power || 0,
    mppt2Power: inv.mppt2Power || 0,
    dailyProduction: inv.dailyProduction || 0,
    totalProduction: inv.totalProduction || 0,
    workingMode: 'Self-Consumption',
  }));

  // Battery data — try to extract individual banks from raw dataList
  const batteries = [];
  const getValue = (dataList, ...keys) => {
    if (!dataList) return 0;
    for (const key of keys) {
      const item = dataList.find(d => d.key === key);
      if (item) return Number(item.value) || 0;
    }
    return 0;
  };

  for (const inv of (live.inverters || [])) {
    for (let b = 1; b <= 6; b++) {
      const soc = getValue(inv.dataList, `B${b}_SOC`, `bat${b}_soc`);
      if (soc > 0) {
        batteries.push({
          id: `Bank-${batteries.length + 1}`,
          soc,
          voltage: getValue(inv.dataList, `B${b}_V`, `bat${b}_voltage`),
          current: getValue(inv.dataList, `B${b}_I`, `bat${b}_current`),
          temp: getValue(inv.dataList, `B${b}_T`, `bat${b}_temp`),
          health: 100,
          cycles: 0,
          capacity: 5.12,
        });
      }
    }
  }

  // If no individual battery data, create entries from aggregate SOC per inverter
  if (batteries.length === 0 && inverters.length > 0) {
    for (const inv of inverters) {
      if (inv.batterySOC > 0) {
        batteries.push({
          id: inv.name,
          soc: Math.round(inv.batterySOC),
          voltage: inv.batteryVoltage,
          current: 0,
          temp: inv.batteryTemp,
          health: 100,
          cycles: 0,
          capacity: 0,
        });
      }
    }
  }

  return { inverters, batteries };
}
