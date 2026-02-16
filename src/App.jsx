import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SolarPanel from './components/SolarPanel';
import EnergyMonitor from './components/EnergyMonitor';
import ThermostatPanel from './components/ThermostatPanel';
import UtilityPanel from './components/UtilityPanel';
import OptimizationPanel from './components/OptimizationPanel';
import InverterConfig from './components/InverterConfig';

const panels = {
  dashboard: Dashboard,
  solar: SolarPanel,
  config: InverterConfig,
  energy: EnergyMonitor,
  hvac: ThermostatPanel,
  utility: UtilityPanel,
  optimize: OptimizationPanel,
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const ActivePanel = panels[activeTab];

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-6 overflow-y-auto max-h-screen">
        <ActivePanel />
      </main>
    </div>
  );
}

export default App;
