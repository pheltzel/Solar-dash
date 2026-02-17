import { Zap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { vueData as mockVue } from '../data/mockData';
import { useEmporiaData } from '../hooks/useApi';

// Default circuit colors when live data doesn't include them
const CIRCUIT_COLORS = [
  '#3b82f6', '#ef4444', '#8b5cf6', '#22c55e', '#f59e0b',
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#64748b',
];

export default function EnergyMonitor() {
  const { data: liveData } = useEmporiaData();

  // Merge live circuits with mock fallback
  const circuits = liveData?.circuits
    ? liveData.circuits.map((c, i) => ({
        ...c,
        color: c.color || CIRCUIT_COLORS[i % CIRCUIT_COLORS.length],
        daily: c.daily || 0,
      }))
    : mockVue.circuits;

  const totalUsage = liveData?.totalPower ?? mockVue.totalUsage;
  const hourlyBreakdown = mockVue.hourlyBreakdown; // Live hourly needs separate call

  const vueData = { circuits, totalUsage, hourlyBreakdown };

  const pieData = vueData.circuits
    .filter(c => c.power > 0)
    .sort((a, b) => b.power - a.power);

  const dailyData = [...vueData.circuits]
    .sort((a, b) => b.daily - a.daily)
    .map(c => ({ name: c.name, daily: c.daily, color: c.color }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Energy Monitor</h2>
        <p className="text-slate-400 text-sm mt-1">Emporia Vue circuit-level monitoring</p>
      </div>

      {/* Total Usage */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-hvac-blue/15 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-hvac-blue" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Current Total Draw</p>
            <p className="text-3xl font-bold text-white">{vueData.totalUsage} <span className="text-lg text-slate-400">kW</span></p>
          </div>
        </div>
      </div>

      {/* Circuit Breakdown - Live */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Live Power by Circuit</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                dataKey="power"
                nameKey="name"
                label={({ name, power }) => `${name}: ${power}kW`}
                labelLine={{ stroke: '#64748b' }}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Circuit List */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">All Circuits</h3>
          <div className="space-y-2">
            {vueData.circuits.map(circuit => (
              <div key={circuit.name} className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: circuit.color }} />
                  <span className="text-sm text-slate-300">{circuit.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-semibold ${circuit.power > 0 ? 'text-white' : 'text-slate-600'}`}>
                    {circuit.power > 0 ? `${circuit.power} kW` : 'Off'}
                  </span>
                  <span className="text-xs text-slate-500 w-20 text-right">{circuit.daily} kWh/day</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Consumption by Circuit */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Daily Consumption by Circuit</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} unit=" kWh" />
            <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(val) => [`${val} kWh`, 'Daily Usage']}
            />
            <Bar dataKey="daily" radius={[0, 4, 4, 0]}>
              {dailyData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Stacked Area */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">24-Hour Usage by Circuit</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={vueData.hourlyBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" kW" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Area type="monotone" dataKey="HVAC" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
            <Area type="monotone" dataKey="Water Heater" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
            <Area type="monotone" dataKey="EV Charger" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
            <Area type="monotone" dataKey="Kitchen" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
            <Area type="monotone" dataKey="Pool Pump" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
            <Area type="monotone" dataKey="Other" stackId="1" stroke="#64748b" fill="#64748b" fillOpacity={0.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
