import { Lightbulb, AlertTriangle, TrendingUp, DollarSign, Wrench, ChevronRight } from 'lucide-react';
import { optimizationAlerts } from '../data/mockData';

const severityConfig = {
  high: { bg: 'bg-grid-red/10', border: 'border-grid-red/30', badge: 'bg-grid-red/20 text-grid-red', icon: 'text-grid-red' },
  medium: { bg: 'bg-solar-yellow/10', border: 'border-solar-yellow/30', badge: 'bg-solar-yellow/20 text-solar-yellow', icon: 'text-solar-yellow' },
  low: { bg: 'bg-hvac-blue/10', border: 'border-hvac-blue/30', badge: 'bg-hvac-blue/20 text-hvac-blue', icon: 'text-hvac-blue' },
};

export default function OptimizationPanel() {
  const totalSavings = optimizationAlerts.reduce((sum, a) => {
    const match = a.savings.match(/\$([\d.]+)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  const byPriority = {
    high: optimizationAlerts.filter(a => a.severity === 'high'),
    medium: optimizationAlerts.filter(a => a.severity === 'medium'),
    low: optimizationAlerts.filter(a => a.severity === 'low'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Optimization Engine</h2>
        <p className="text-slate-400 text-sm mt-1">Actionable recommendations to reduce waste and save money</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 text-center">
          <Lightbulb className="w-8 h-8 text-solar-yellow mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{optimizationAlerts.length}</p>
          <p className="text-sm text-slate-400">Active Recommendations</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 text-center">
          <DollarSign className="w-8 h-8 text-battery-green mx-auto mb-2" />
          <p className="text-3xl font-bold text-battery-green">${totalSavings.toFixed(2)}</p>
          <p className="text-sm text-slate-400">Potential Monthly Savings</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 text-center">
          <AlertTriangle className="w-8 h-8 text-grid-red mx-auto mb-2" />
          <p className="text-3xl font-bold text-grid-red">{byPriority.high.length}</p>
          <p className="text-sm text-slate-400">High Priority</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 text-center">
          <TrendingUp className="w-8 h-8 text-hvac-blue mx-auto mb-2" />
          <p className="text-3xl font-bold text-hvac-blue">${(totalSavings * 12).toFixed(0)}</p>
          <p className="text-sm text-slate-400">Annual Savings Potential</p>
        </div>
      </div>

      {/* Alert List by Priority */}
      {['high', 'medium', 'low'].map(severity => {
        const items = byPriority[severity];
        if (items.length === 0) return null;
        const config = severityConfig[severity];

        return (
          <div key={severity}>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {severity} priority ({items.length})
            </h3>
            <div className="space-y-3">
              {items.map(alert => (
                <div key={alert.id} className={`${config.bg} rounded-xl p-5 border ${config.border}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <AlertTriangle className={`w-5 h-5 ${config.icon}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-white">{alert.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
                          {severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{alert.description}</p>

                      {/* Recommendation */}
                      <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <Wrench className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-slate-300">{alert.recommendation}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-battery-green font-semibold">
                          Potential savings: {alert.savings}
                        </span>
                        {alert.timestamp && (
                          <span className="text-xs text-slate-500">{alert.timestamp}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
