import { Sun, Zap, Battery, TrendingUp, AlertTriangle, RefreshCw, WifiOff, ArrowDownToLine, ArrowUpFromLine, Minus } from 'lucide-react';
import { useEg4DailyStats } from '../hooks/useApi';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPower(watts) {
  if (watts === null || watts === undefined) return '--';
  const abs = Math.abs(watts);
  if (abs >= 1000) return `${(abs / 1000).toFixed(2)} kW`;
  return `${Math.round(abs)} W`;
}

function fmtTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ErrorState({ error }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 max-w-md w-full">
        <WifiOff className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-red-300 mb-2">Cannot reach EG4</h2>
        <p className="text-slate-400 text-sm mb-4">
          No live data is available. The dashboard will not show placeholder values.
        </p>
        <div className="bg-slate-900 rounded-lg p-3 text-left mb-4">
          <p className="text-xs font-mono text-red-400 break-all">{error}</p>
        </div>
        <p className="text-slate-500 text-xs">
          Confirm <code className="text-slate-400">EG4_USERNAME</code> and{' '}
          <code className="text-slate-400">EG4_PASSWORD</code> are set in your{' '}
          <code className="text-slate-400">.env</code> file and the server is running on port 3001.
        </p>
      </div>
    </div>
  );
}

function StaleWarning({ error }) {
  return (
    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5 text-sm text-amber-300">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>Live update failed — showing last known data. ({error})</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <RefreshCw className="w-7 h-7 text-solar-yellow animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Connecting to EG4&hellip;</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, icon: Icon, colorClass = 'text-solar-yellow', subtext }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-3xl font-bold tabular-nums ${colorClass}`}>{value}</span>
        <span className="text-slate-400 text-sm">{unit}</span>
      </div>
      {subtext && <p className="text-xs text-slate-500 mt-1.5">{subtext}</p>}
    </div>
  );
}

function BatteryBar({ soc }) {
  const color =
    soc > 60 ? 'bg-battery-green' :
    soc > 25 ? 'bg-amber-400' :
    'bg-red-400';
  return (
    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-3">
      <div
        className={`h-full ${color} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(100, Math.max(0, soc))}%` }}
      />
    </div>
  );
}

function GridFlowIcon({ watts }) {
  if (watts > 50) return <ArrowDownToLine className="w-4 h-4 text-red-400" />;
  if (watts < -50) return <ArrowUpFromLine className="w-4 h-4 text-battery-green" />;
  return <Minus className="w-4 h-4 text-slate-500" />;
}

function InverterCard({ inverter }) {
  const online = inverter.connectStatus === 1;
  const solarW  = inverter.solarPower  || 0;
  const loadW   = inverter.loadPower   || 0;
  const batSOC  = inverter.batterySOC  || 0;
  const batW    = inverter.batteryPower || 0;
  const gridW   = inverter.gridPower   || 0;
  const dailyKWh = inverter.dailyProduction || 0;

  const batLabel =
    batW > 50  ? `${fmtPower(batW)} discharging` :
    batW < -50 ? `${fmtPower(batW)} charging` :
    'Idle';
  const batColor =
    batW > 50  ? 'text-red-400' :
    batW < -50 ? 'text-battery-green' :
    'text-slate-500';

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm">{inverter.deviceName}</h3>
        <div className="flex items-center gap-2">
          {inverter.error && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" title={inverter.error} />
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            online
              ? 'bg-green-500/15 text-green-400'
              : 'bg-slate-700 text-slate-500'
          }`}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Solar Output</p>
          <p className="font-semibold text-solar-yellow tabular-nums">{fmtPower(solarW)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Load Draw</p>
          <p className="font-semibold text-blue-400 tabular-nums">{fmtPower(loadW)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Battery SOC</p>
          <p className="font-semibold text-battery-green tabular-nums">{Math.round(batSOC)}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Battery</p>
          <p className={`font-semibold tabular-nums ${batColor}`}>{batLabel}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Grid</p>
          <div className="flex items-center gap-1">
            <GridFlowIcon watts={gridW} />
            <p className={`font-semibold tabular-nums text-sm ${
              gridW > 50 ? 'text-red-400' : gridW < -50 ? 'text-battery-green' : 'text-slate-500'
            }`}>{fmtPower(gridW)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Daily Yield</p>
          <p className="font-semibold text-slate-300 tabular-nums">
            {dailyKWh ? `${dailyKWh.toFixed(2)} kWh` : '--'}
          </p>
        </div>
      </div>

      <BatteryBar soc={batSOC} />
    </div>
  );
}

function PlannedCard({ title, description }) {
  return (
    <div className="bg-slate-900/30 border border-slate-700/25 border-dashed rounded-xl p-5 opacity-40 select-none">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <span className="ml-auto text-xs text-slate-600 bg-slate-800/60 px-2 py-0.5 rounded-full">
          Planned
        </span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EG4Dashboard() {
  const { data, loading, error, refetch } = useEg4DailyStats();

  // First load with no data yet
  if (loading && !data) return <LoadingState />;

  // Hard failure on first fetch (no stale data to show)
  if (error && !data) return <ErrorState error={error} />;

  const {
    inverters      = [],
    combined       = {},
    dailyMaxPV,
    dailyMaxPVTimestamp,
    station,
    lastUpdated,
  } = data;

  const currentPV   = combined.solarPower  || 0;
  const currentLoad = combined.loadPower   || 0;
  const currentGrid = combined.gridPower   || 0;
  const dailyKWh    = combined.dailyProduction || 0;

  // Average battery SOC across all inverters that reported it
  const socInverters = inverters.filter(i => i.batterySOC > 0);
  const avgSOC = socInverters.length > 0
    ? Math.round(socInverters.reduce((s, i) => s + i.batterySOC, 0) / socInverters.length)
    : null;

  const maxPVTime = fmtTime(dailyMaxPVTimestamp);
  const updatedTime = fmtTime(lastUpdated);

  const gridSubtext =
    currentGrid > 50  ? 'Importing from grid' :
    currentGrid < -50 ? 'Exporting to grid'   :
    'Grid idle / balanced';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">EG4 Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {station?.name || 'Solar System'}
            {inverters.length > 0 && ` · ${inverters.length} inverter${inverters.length !== 1 ? 's' : ''}`}
            {updatedTime && (
              <span className="text-slate-600"> · updated {updatedTime}</span>
            )}
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Stale data warning (subsequent poll failed but we have old data) */}
      {error && data && <StaleWarning error={error} />}

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Solar Output"
          value={currentPV >= 1000 ? (currentPV / 1000).toFixed(2) : Math.round(currentPV)}
          unit={currentPV >= 1000 ? 'kW' : 'W'}
          icon={Sun}
          colorClass="text-solar-yellow"
          subtext="Combined — all inverters"
        />
        <StatCard
          label="Max PV Today"
          value={dailyMaxPV ? (dailyMaxPV >= 1000 ? (dailyMaxPV / 1000).toFixed(2) : Math.round(dailyMaxPV)) : '--'}
          unit={dailyMaxPV >= 1000 ? 'kW' : 'W'}
          icon={TrendingUp}
          colorClass="text-solar-orange"
          subtext={maxPVTime ? `Peak at ${maxPVTime}` : 'Not yet recorded'}
        />
        <StatCard
          label="Current Load Draw"
          value={currentLoad >= 1000 ? (currentLoad / 1000).toFixed(2) : Math.round(currentLoad)}
          unit={currentLoad >= 1000 ? 'kW' : 'W'}
          icon={Zap}
          colorClass="text-blue-400"
          subtext="Combined — all inverters"
        />
        <StatCard
          label="Battery SOC"
          value={avgSOC !== null ? avgSOC : '--'}
          unit="%"
          icon={Battery}
          colorClass={avgSOC > 60 ? 'text-battery-green' : avgSOC > 25 ? 'text-amber-400' : 'text-red-400'}
          subtext={inverters.length > 1 ? `Avg of ${inverters.length} inverters` : 'System battery'}
        />
      </div>

      {/* Secondary row: daily yield + grid flow */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Daily Yield</p>
          <p className="text-2xl font-bold text-solar-yellow tabular-nums">
            {dailyKWh ? dailyKWh.toFixed(2) : '--'}
            <span className="text-sm font-normal text-slate-400 ml-1.5">kWh</span>
          </p>
          <p className="text-xs text-slate-500 mt-1.5">Total energy generated today</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Grid Flow</p>
          <div className="flex items-baseline gap-2">
            <GridFlowIcon watts={currentGrid} />
            <p className={`text-2xl font-bold tabular-nums ${
              currentGrid > 50 ? 'text-red-400' : currentGrid < -50 ? 'text-battery-green' : 'text-slate-400'
            }`}>
              {fmtPower(currentGrid)}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">{gridSubtext}</p>
        </div>
      </div>

      {/* Per-inverter detail cards */}
      {inverters.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Inverters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inverters.map(inv => (
              <InverterCard key={inv.deviceSn} inverter={inv} />
            ))}
          </div>
        </section>
      )}

      {/* Planned integrations */}
      <section>
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Planned Integrations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlannedCard
            title="Emporia Vue"
            description="Circuit-level power monitoring — see exactly where every watt is going in real time."
          />
          <PlannedCard
            title="Ecobee"
            description="HVAC runtime, room temperatures, and smart scheduling data alongside solar production."
          />
          <PlannedCard
            title="NNK Co-op"
            description="Utility rate data and net metering info from your cooperative to optimize export timing."
          />
        </div>
      </section>
    </div>
  );
}
