import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import EG4Dashboard from './components/EG4Dashboard';

// Only EG4 panels are active now.
// Vue, Ecobee, and NNK Co-op panels will be added here as each integration matures.
const panels = {
  dashboard: EG4Dashboard,
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const ActivePanel = panels[activeTab] || EG4Dashboard;

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
