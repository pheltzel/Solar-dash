export default function StatusCard({ title, value, unit, subtitle, icon: Icon, color = 'text-white', bgColor = 'bg-slate-800' }) {
  return (
    <div className={`${bgColor} rounded-xl p-5 border border-slate-700/50`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg bg-slate-700/50`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        )}
      </div>
    </div>
  );
}
