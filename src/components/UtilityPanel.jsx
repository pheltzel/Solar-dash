import { DollarSign, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Zap, Sun, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Legend, ComposedChart } from 'recharts';
import { utilityData } from '../data/mockData';

export default function UtilityPanel() {
  const { billing, rate, provider, rateType } = utilityData;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Utility & Costs</h2>
        <p className="text-slate-400 text-sm mt-1">{provider} — billing and self-consumption analysis</p>
      </div>

      {/* Rate Info */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-solar-yellow/15 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-solar-yellow" />
            </div>
            <div>
              <p className="text-sm text-slate-400">{provider} — {rateType}</p>
              <p className="text-2xl font-bold text-white">${rate.toFixed(2)}<span className="text-sm text-slate-400 font-normal">/kWh</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">All-in with taxes & fees</p>
            <p className="text-sm text-slate-300">Every kWh from solar saves <span className="text-battery-green font-semibold">${rate.toFixed(2)}</span></p>
          </div>
        </div>
      </div>

      {/* Self-consumption metric */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 text-center">
          <Sun className="w-8 h-8 text-solar-yellow mx-auto mb-2" />
          <p className="text-3xl font-bold text-solar-yellow">{billing.currentMonth.selfConsumptionRate}%</p>
          <p className="text-sm text-slate-400 mt-1">Self-Consumption Rate</p>
          <p className="text-xs text-slate-500">Solar used directly vs exported</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 text-center">
          <Zap className="w-8 h-8 text-hvac-blue mx-auto mb-2" />
          <p className="text-3xl font-bold text-hvac-blue">{billing.currentMonth.solarProduction}</p>
          <p className="text-sm text-slate-400 mt-1">kWh Solar This Month</p>
          <p className="text-xs text-slate-500">{billing.currentMonth.selfConsumption} kWh consumed directly</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 text-center">
          <BarChart3 className="w-8 h-8 text-battery-green mx-auto mb-2" />
          <p className="text-3xl font-bold text-battery-green">
            ${(billing.currentMonth.solarProduction * rate).toFixed(0)}
          </p>
          <p className="text-sm text-slate-400 mt-1">Solar Value This Month</p>
          <p className="text-xs text-slate-500">At ${rate}/kWh grid avoidance</p>
        </div>
      </div>

      {/* This Month vs Previous */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BillingCard
          title="This Month"
          data={billing.currentMonth}
          rate={rate}
          highlight
        />
        <BillingCard
          title="Previous Month"
          data={billing.previousMonth}
          rate={rate}
          comparison={billing.currentMonth}
        />
      </div>

      {/* Monthly History Chart */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Cost & Self-Consumption</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={billing.monthlyHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="energy" stroke="#64748b" tick={{ fontSize: 11 }} orientation="left" unit=" kWh" />
            <YAxis yAxisId="pct" stroke="#64748b" tick={{ fontSize: 11 }} orientation="right" unit="%" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar yAxisId="energy" dataKey="solar" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Solar (kWh)" />
            <Bar yAxisId="energy" dataKey="grid" fill="#ef4444" radius={[2, 2, 0, 0]} name="Grid Import (kWh)" />
            <Bar yAxisId="energy" dataKey="exported" fill="#22c55e" radius={[2, 2, 0, 0]} name="Exported (kWh)" />
            <Line yAxisId="pct" type="monotone" dataKey="selfConsumption" stroke="#3b82f6" strokeWidth={2} name="Self-Consumption %" dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BillingCard({ title, data, rate, highlight, comparison }) {
  const isCredit = data.netCost < 0;
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-4">
        <Row icon={ArrowDownToLine} iconColor="text-grid-red" label="Grid Import"
          value={`${data.gridImport} kWh`} extra={`$${data.cost.toFixed(2)}`} />
        <Row icon={ArrowUpFromLine} iconColor="text-battery-green" label="Grid Export"
          value={`${data.gridExport} kWh`} extra={`-$${data.credit.toFixed(2)}`} extraColor="text-battery-green" />
        <Row icon={Zap} iconColor="text-solar-yellow" label="Net Metering"
          value={`${data.netMetering} kWh`}
          valueColor={data.netMetering < 0 ? 'text-battery-green' : 'text-grid-red'} />

        <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
          <div className="flex items-center gap-2">
            <DollarSign className={`w-4 h-4 ${highlight ? 'text-solar-yellow' : 'text-slate-400'}`} />
            <span className="text-base font-semibold text-white">{isCredit ? 'Net Credit' : 'Net Cost'}</span>
          </div>
          <span className={`text-xl font-bold ${isCredit ? 'text-battery-green' : 'text-solar-yellow'}`}>
            {isCredit ? '-' : ''}${Math.abs(data.netCost).toFixed(2)}
          </span>
        </div>
      </div>

      {comparison && (
        <div className="mt-4 pt-3 border-t border-slate-700/30">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-battery-green" />
            <span className="text-sm text-battery-green font-medium">
              ${(data.netCost - comparison.netCost).toFixed(2)} {data.netCost > comparison.netCost ? 'more' : 'less'} this month
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, iconColor, label, value, extra, extraColor, valueColor }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <div className="text-right">
        <span className={`text-sm font-semibold ${valueColor || 'text-white'}`}>{value}</span>
        {extra && <span className={`text-xs ml-2 ${extraColor || 'text-slate-500'}`}>{extra}</span>}
      </div>
    </div>
  );
}
