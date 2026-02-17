import { Thermometer, Droplets, Wind, MapPin, Eye, Clock } from 'lucide-react';
import { ecobeeData as mockEcobee } from '../data/mockData';
import { useEcobeeData } from '../hooks/useApi';

export default function ThermostatPanel() {
  const { data: liveData, error } = useEcobeeData();

  // Merge live API data with mock fallback
  const ecobeeData = {
    thermostats: liveData?.thermostats || mockEcobee.thermostats,
    outdoorTemp: liveData?.outdoor?.temp ?? mockEcobee.outdoorTemp,
    outdoorHumidity: liveData?.outdoor?.humidity ?? mockEcobee.outdoorHumidity,
    runtimeHours: mockEcobee.runtimeHours, // Runtime needs separate API call
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">HVAC / Ecobee</h2>
        <p className="text-slate-400 text-sm mt-1">Thermostat control and sensor data</p>
      </div>

      {/* Outdoor Conditions */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Outdoor Conditions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500">Temperature</p>
            <p className="text-2xl font-bold text-solar-orange">{ecobeeData.outdoorTemp}°F</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Humidity</p>
            <p className="text-2xl font-bold text-hvac-blue">{ecobeeData.outdoorHumidity}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Runtime Today</p>
            <p className="text-2xl font-bold text-white">{ecobeeData.runtimeHours.today}h</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Runtime This Month</p>
            <p className="text-2xl font-bold text-white">{ecobeeData.runtimeHours.month}h</p>
          </div>
        </div>
      </div>

      {/* Thermostats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ecobeeData.thermostats.map(therm => (
          <div key={therm.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-hvac-blue/15 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-5 h-5 text-hvac-blue" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{therm.name}</h3>
                  <p className="text-xs text-slate-400">Schedule: {therm.schedule}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                therm.hvacStatus === 'running'
                  ? 'bg-hvac-blue/15 text-hvac-blue'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {therm.hvacStatus}
              </span>
            </div>

            {/* Temperature Display */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full border-4 border-hvac-blue/30 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{therm.currentTemp}</span>
                  <span className="text-xs text-slate-400">°F current</span>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-700 rounded-full px-3 py-1">
                  <span className="text-xs text-hvac-blue font-medium">Set: {therm.setTemp}°F</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <Droplets className="w-4 h-4 text-hvac-blue mx-auto mb-1" />
                <p className="text-sm font-semibold text-white">{therm.humidity}%</p>
                <p className="text-xs text-slate-500">Humidity</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <Wind className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-sm font-semibold text-white capitalize">{therm.mode}</p>
                <p className="text-xs text-slate-500">Mode</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-sm font-semibold text-white">{therm.schedule}</p>
                <p className="text-xs text-slate-500">Schedule</p>
              </div>
            </div>

            {/* Sensors */}
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-2">Room Sensors</h4>
              <div className="space-y-2">
                {therm.sensors.map(sensor => (
                  <div key={sensor.name} className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm text-slate-300">{sensor.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">{sensor.temp}°F</span>
                      {sensor.occupancy && (
                        <span className="flex items-center gap-1 text-xs text-battery-green">
                          <Eye className="w-3 h-3" /> occupied
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
