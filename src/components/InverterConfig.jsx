import { Settings, Zap, Battery, Sun, Clock, ToggleLeft, ToggleRight, ArrowRight, Shield } from 'lucide-react';
import { eg4Data, eg4WorkingModes, eg4ConfigParams } from '../data/mockData';
import { useState } from 'react';

export default function InverterConfig() {
  const [selectedInverter, setSelectedInverter] = useState(0);
  const inv = eg4Data.inverters[selectedInverter];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{inv.name} Configuration</h2>
        <p className="text-slate-400 text-sm mt-1">Working modes, battery settings, and time programs</p>
      </div>

      {/* Inverter selector */}
      <div className="flex gap-2">
        {eg4Data.inverters.map((inv, i) => (
          <button
            key={inv.id}
            onClick={() => setSelectedInverter(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              selectedInverter === i
                ? 'bg-solar-yellow/15 text-solar-yellow border border-solar-yellow/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700/50 hover:text-white'
            }`}
          >
            {inv.name}
          </button>
        ))}
      </div>

      {/* Model Info */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-solar-yellow/15 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-solar-yellow" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{inv.name}</h3>
            <p className="text-xs text-slate-400">{inv.id} • Firmware {inv.firmware}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Max AC Output</p>
            <p className="text-sm font-semibold text-white">{inv.model === '6000XP' ? 6 : 12} kW</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Max PV Input</p>
            <p className="text-sm font-semibold text-white">{inv.model === '6000XP' ? 13 : 24} kW</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-500">MPPTs</p>
            <p className="text-sm font-semibold text-white">2x {inv.model === '6000XP' ? 18 : 35}A</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Max Charge Current</p>
            <p className="text-sm font-semibold text-white">{inv.settings.batteryChargeCurrentLimit} Adc</p>
          </div>
        </div>
      </div>

      {/* Working Modes */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-solar-yellow" />
          <h3 className="text-lg font-semibold text-white">Working Modes</h3>
        </div>
        <div className="space-y-3">
          {eg4WorkingModes.map(mode => {
            const isActive = inv.settings.workingMode === mode.name;
            return (
              <div
                key={mode.id}
                className={`rounded-lg p-4 border transition-all ${
                  isActive
                    ? 'bg-solar-yellow/10 border-solar-yellow/30'
                    : 'bg-slate-900/50 border-slate-700/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{mode.name}</h4>
                      {isActive && (
                        <span className="bg-solar-yellow/20 text-solar-yellow text-xs px-2 py-0.5 rounded-full">active</span>
                      )}
                      {mode.recommended && (
                        <span className="bg-battery-green/20 text-battery-green text-xs px-2 py-0.5 rounded-full">recommended</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{mode.description}</p>
                    {mode.loadPriority && (
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-slate-500">Load: <span className="text-slate-300">{mode.loadPriority}</span></span>
                        <span className="text-xs text-slate-500">Solar: <span className="text-slate-300">{mode.solarPriority}</span></span>
                      </div>
                    )}
                    {mode.timeConfigurable && (
                      <p className="text-xs text-hvac-blue mt-1">Up to {mode.maxTimeSlots} time slots available</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Programs */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-hvac-blue" />
          <h3 className="text-lg font-semibold text-white">Time Programs</h3>
          <span className="text-xs text-slate-400">Schedule mode changes throughout the day</span>
        </div>
        <div className="space-y-3">
          {inv.settings.timePrograms.map(prog => (
            <div key={prog.id} className={`flex items-center justify-between p-4 rounded-lg border ${
              prog.enabled
                ? 'bg-battery-green/10 border-battery-green/30'
                : 'bg-slate-900/50 border-slate-700/30'
            }`}>
              <div className="flex items-center gap-4">
                {prog.enabled ? (
                  <ToggleRight className="w-6 h-6 text-battery-green" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{prog.mode}</p>
                  <p className="text-xs text-slate-400">Slot {prog.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-700 text-slate-300 text-sm px-3 py-1 rounded font-mono">{prog.start}</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <span className="bg-slate-700 text-slate-300 text-sm px-3 py-1 rounded font-mono">{prog.stop}</span>
              </div>
              <span className={`text-xs font-medium ${prog.enabled ? 'text-battery-green' : 'text-slate-600'}`}>
                {prog.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Battery & Discharge Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(groupBySection(eg4ConfigParams)).map(([section, params]) => (
          <div key={section} className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-base font-semibold text-white mb-4">{section}</h3>
            <div className="space-y-3">
              {params.map(param => (
                <div key={param.name} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-sm text-slate-300">{param.name}</span>
                  <div className="flex items-center gap-2">
                    {param.options ? (
                      <span className="bg-hvac-blue/15 text-hvac-blue text-sm px-3 py-1 rounded-lg font-medium">
                        {param.value}
                      </span>
                    ) : param.type === 'boolean' ? (
                      param.value ? (
                        <span className="bg-battery-green/15 text-battery-green text-sm px-3 py-1 rounded-lg font-medium">On</span>
                      ) : (
                        <span className="bg-slate-700 text-slate-400 text-sm px-3 py-1 rounded-lg font-medium">Off</span>
                      )
                    ) : (
                      <span className="text-sm font-semibold text-white">
                        {param.value}{param.unit ? ` ${param.unit}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Battery Bank Overview */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-battery-green" />
            <h3 className="text-lg font-semibold text-white">Battery Bank</h3>
          </div>
          <span className="text-sm text-slate-400">
            {eg4Data.batteries.length} banks &bull; {eg4Data.totalCapacityKwh || 30} kWh total
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {eg4Data.batteries.map(bat => {
            const socColor = bat.soc > 60 ? 'bg-battery-green' : bat.soc > 30 ? 'bg-solar-yellow' : 'bg-grid-red';
            return (
              <div key={bat.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30 text-center">
                <p className="text-xs text-slate-400 mb-2">{bat.id}</p>
                <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2">
                  <div className={`h-2.5 rounded-full ${socColor}`} style={{ width: `${bat.soc}%` }} />
                </div>
                <p className="text-lg font-bold text-white">{bat.soc}%</p>
                <p className="text-xs text-slate-500">{bat.voltage}V &bull; {bat.temp}°C</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-700/30 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Available energy: <span className="text-white font-semibold">
              {(eg4Data.batteries.reduce((s, b) => s + (b.soc / 100) * (b.capacityKwh || 5.0), 0)).toFixed(1)} kWh
            </span> of {eg4Data.totalCapacityKwh || 30} kWh
          </span>
          <span className="text-sm text-slate-400">
            Avg SOC: <span className="text-battery-green font-semibold">
              {Math.round(eg4Data.batteries.reduce((s, b) => s + b.soc, 0) / eg4Data.batteries.length)}%
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function groupBySection(params) {
  return params.reduce((acc, p) => {
    (acc[p.section] = acc[p.section] || []).push(p);
    return acc;
  }, {});
}
