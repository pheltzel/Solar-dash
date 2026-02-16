import { DollarSign, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Clock, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { utilityData } from '../data/mockData';

export default function UtilityPanel() {
  const { billing, currentRate, peakRate, offPeakRate, peakHours } = utilityData;
  const now = new Date();
  const isPeak = now.getHours() >= peakHours.start && now.getHours() < peakHours.end;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Utility & Costs</h2>
        <p className="text-slate-400 text-sm mt-1">Rate analysis and billing breakdown</p>
      </div>

      {/* Current Rate Status */}
      <div className={`rounded-xl p-5 border ${isPeak ? 'bg-grid-red/10 border-grid-red/30' : 'bg-battery-green/10 border-battery-green/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPeak ? 'bg-grid-red/20' : 'bg-battery-green/20'}`}>
              <Clock className={`w-5 h-5 ${isPeak ? 'text-grid-red' : 'text-battery-green'}`} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Current Rate Period</p>
              <p className={`text-xl font-bold ${isPeak ? 'text-grid-red' : 'text-battery-green'}`}>
                {isPeak ? 'PEAK' : 'OFF-PEAK'} — ${isPeak ? peakRate : offPeakRate}/kWh
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Peak hours</p>
            <p className="text-sm text-white font-medium">{peakHours.start}:00 – {peakHours.end}:00</p>
          </div>
        </div>
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <p className="text-sm text-slate-400">Standard Rate</p>
          <p className="text-2xl font-bold text-white">${currentRate}</p>
          <p className="text-xs text-slate-500">per kWh</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <p className="text-sm text-slate-400">Peak Rate</p>
          <p className="text-2xl font-bold text-grid-red">${peakRate}</p>
          <p className="text-xs text-slate-500">per kWh (2–7 PM)</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <p className="text-sm text-slate-400">Off-Peak Rate</p>
          <p className="text-2xl font-bold text-battery-green">${offPeakRate}</p>
          <p className="text-xs text-slate-500">per kWh</p>
        </div>
      </div>

      {/* This Month Billing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">This Month</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-grid-red" />
                <span className="text-sm text-slate-300">Grid Import</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-white">{billing.currentMonth.gridImport} kWh</span>
                <span className="text-xs text-slate-500 ml-2">${billing.currentMonth.cost.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-battery-green" />
                <span className="text-sm text-slate-300">Grid Export</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-white">{billing.currentMonth.gridExport} kWh</span>
                <span className="text-xs text-battery-green ml-2">-${billing.currentMonth.credit.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-solar-yellow" />
                <span className="text-sm text-slate-300">Net Metering</span>
              </div>
              <span className={`text-sm font-semibold ${billing.currentMonth.netMetering < 0 ? 'text-battery-green' : 'text-grid-red'}`}>
                {billing.currentMonth.netMetering} kWh
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-solar-yellow" />
                <span className="text-base font-semibold text-white">Net Cost</span>
              </div>
              <span className="text-xl font-bold text-solar-yellow">${billing.currentMonth.netCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Previous Month</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-grid-red" />
                <span className="text-sm text-slate-300">Grid Import</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-white">{billing.previousMonth.gridImport} kWh</span>
                <span className="text-xs text-slate-500 ml-2">${billing.previousMonth.cost.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-battery-green" />
                <span className="text-sm text-slate-300">Grid Export</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-white">{billing.previousMonth.gridExport} kWh</span>
                <span className="text-xs text-battery-green ml-2">-${billing.previousMonth.credit.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-solar-yellow" />
                <span className="text-sm text-slate-300">Net Metering</span>
              </div>
              <span className={`text-sm font-semibold ${billing.previousMonth.netMetering < 0 ? 'text-battery-green' : 'text-grid-red'}`}>
                {billing.previousMonth.netMetering} kWh
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="text-base font-semibold text-white">Net Cost</span>
              </div>
              <span className="text-xl font-bold text-white">${billing.previousMonth.netCost.toFixed(2)}</span>
            </div>
          </div>
          {/* Savings comparison */}
          <div className="mt-4 pt-3 border-t border-slate-700/30">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-battery-green" />
              <span className="text-sm text-battery-green font-medium">
                ${(billing.previousMonth.netCost - billing.currentMonth.netCost).toFixed(2)} less this month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly History Chart */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Cost & Production History</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={billing.monthlyHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="cost" stroke="#64748b" tick={{ fontSize: 11 }} orientation="left" unit="$" />
            <YAxis yAxisId="energy" stroke="#64748b" tick={{ fontSize: 11 }} orientation="right" unit=" kWh" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar yAxisId="energy" dataKey="solar" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Solar (kWh)" />
            <Bar yAxisId="energy" dataKey="grid" fill="#ef4444" radius={[2, 2, 0, 0]} name="Grid (kWh)" />
            <Line yAxisId="cost" type="monotone" dataKey="cost" stroke="#22c55e" strokeWidth={2} name="Cost ($)" dot={{ r: 4 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
