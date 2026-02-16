// Mock data modeled after real EG4, Emporia Vue, Ecobee, and utility data

export function generateTimeSeriesData(hours = 24) {
  const now = new Date();
  const data = [];
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now - i * 60 * 60 * 1000);
    const hour = time.getHours();
    // Solar follows a bell curve peaking at noon
    const solarBase = Math.max(0, Math.sin((hour - 6) * Math.PI / 12));
    const solar = hour >= 6 && hour <= 19
      ? +(solarBase * 8.2 + (Math.random() - 0.5) * 1.2).toFixed(2)
      : 0;
    // Consumption has morning and evening peaks
    const consumptionBase = 1.2
      + (hour >= 7 && hour <= 9 ? 2.5 : 0)
      + (hour >= 17 && hour <= 21 ? 3.8 : 0)
      + (hour >= 12 && hour <= 14 ? 1.5 : 0);
    const consumption = +(consumptionBase + (Math.random() - 0.5) * 0.8).toFixed(2);
    // Battery charges when solar > consumption, discharges at night
    const netSolar = solar - consumption;
    const battery = Math.min(100, Math.max(10, 50 + netSolar * 8));
    // Grid import when solar + battery insufficient
    const gridImport = Math.max(0, +(consumption - solar - (battery > 20 ? 0 : 0)).toFixed(2));
    const gridExport = Math.max(0, +(solar - consumption).toFixed(2));

    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      hour,
      solar,
      consumption,
      battery: +battery.toFixed(0),
      gridImport,
      gridExport,
    });
  }
  return data;
}

export const eg4Data = {
  inverters: [
    {
      id: 'EG4-01',
      name: 'Inverter 1 (Garage)',
      status: 'online',
      firmware: 'v3.2.1',
      solarPower: 4.12,
      batteryPower: 0.85,
      gridPower: -0.32,
      loadPower: 3.45,
      batterySOC: 78,
      batteryVoltage: 52.4,
      batteryTemp: 28,
      pvVoltage: 385.2,
      pvCurrent: 10.7,
      dailyProduction: 28.4,
      totalProduction: 12480,
      mode: 'Self-Use',
    },
    {
      id: 'EG4-02',
      name: 'Inverter 2 (Shed)',
      status: 'online',
      firmware: 'v3.2.1',
      solarPower: 3.95,
      batteryPower: 1.20,
      gridPower: 0.00,
      loadPower: 2.75,
      batterySOC: 82,
      batteryVoltage: 53.1,
      batteryTemp: 26,
      pvVoltage: 378.8,
      pvCurrent: 10.4,
      dailyProduction: 26.8,
      totalProduction: 11920,
      mode: 'Self-Use',
    },
  ],
  batteries: [
    { id: 'BAT-01', soc: 78, voltage: 52.4, current: 16.2, temp: 28, cycles: 342, health: 97 },
    { id: 'BAT-02', soc: 82, voltage: 53.1, current: 22.6, temp: 26, cycles: 338, health: 98 },
    { id: 'BAT-03', soc: 75, voltage: 51.8, current: 14.8, temp: 29, cycles: 351, health: 96 },
    { id: 'BAT-04', soc: 80, voltage: 52.8, current: 18.4, temp: 27, cycles: 340, health: 97 },
  ],
};

export const vueData = {
  totalUsage: 4.82,
  circuits: [
    { name: 'HVAC', power: 1.85, daily: 12.4, color: '#3b82f6' },
    { name: 'Water Heater', power: 0.00, daily: 4.8, color: '#ef4444' },
    { name: 'Dryer', power: 0.00, daily: 2.1, color: '#f59e0b' },
    { name: 'Kitchen', power: 0.42, daily: 3.2, color: '#22c55e' },
    { name: 'EV Charger', power: 0.00, daily: 8.6, color: '#8b5cf6' },
    { name: 'Pool Pump', power: 0.75, daily: 6.4, color: '#06b6d4' },
    { name: 'Garage', power: 0.18, daily: 1.1, color: '#ec4899' },
    { name: 'Lighting', power: 0.32, daily: 2.8, color: '#f97316' },
    { name: 'Office', power: 0.28, daily: 2.4, color: '#14b8a6' },
    { name: 'Master Bedroom', power: 0.12, daily: 0.9, color: '#a855f7' },
    { name: 'Other', power: 0.90, daily: 5.2, color: '#64748b' },
  ],
  hourlyBreakdown: generateCircuitHourly(),
};

function generateCircuitHourly() {
  const data = [];
  for (let h = 0; h < 24; h++) {
    data.push({
      hour: `${h.toString().padStart(2, '0')}:00`,
      HVAC: +(1.2 + (h >= 12 && h <= 16 ? 2.5 : 0) + Math.random() * 0.5).toFixed(2),
      'Water Heater': +(h >= 6 && h <= 8 ? 3.5 + Math.random() : 0).toFixed(2),
      Kitchen: +(h >= 7 && h <= 9 || h >= 17 && h <= 20 ? 0.8 + Math.random() * 0.5 : 0.1).toFixed(2),
      'EV Charger': +(h >= 0 && h <= 5 ? 6.6 : 0).toFixed(2),
      'Pool Pump': +(h >= 10 && h <= 16 ? 0.75 : 0).toFixed(2),
      Other: +(0.5 + Math.random() * 0.4).toFixed(2),
    });
  }
  return data;
}

export const ecobeeData = {
  thermostats: [
    {
      id: 'ecobee-main',
      name: 'Main Floor',
      currentTemp: 72.4,
      setTemp: 72,
      humidity: 45,
      mode: 'cool',
      hvacStatus: 'running',
      schedule: 'Home',
      sensors: [
        { name: 'Living Room', temp: 73.1, occupancy: true },
        { name: 'Kitchen', temp: 72.8, occupancy: false },
        { name: 'Master Bedroom', temp: 71.2, occupancy: false },
        { name: 'Office', temp: 74.5, occupancy: true },
      ],
    },
    {
      id: 'ecobee-upstairs',
      name: 'Upstairs',
      currentTemp: 74.1,
      setTemp: 73,
      humidity: 42,
      mode: 'cool',
      hvacStatus: 'idle',
      schedule: 'Home',
      sensors: [
        { name: 'Hallway', temp: 73.8, occupancy: false },
        { name: 'Kids Room 1', temp: 74.2, occupancy: false },
        { name: 'Kids Room 2', temp: 74.6, occupancy: false },
        { name: 'Guest Room', temp: 73.5, occupancy: false },
      ],
    },
  ],
  runtimeHours: { today: 4.2, week: 28.6, month: 118.4 },
  outdoorTemp: 94,
  outdoorHumidity: 58,
};

export const utilityData = {
  currentRate: 0.128,
  peakRate: 0.198,
  offPeakRate: 0.078,
  demandCharge: 12.50,
  peakHours: { start: 14, end: 19 },
  billing: {
    currentMonth: {
      gridImport: 245.6,
      gridExport: 312.8,
      netMetering: -67.2,
      cost: 31.44,
      credit: 8.60,
      netCost: 22.84,
    },
    previousMonth: {
      gridImport: 298.4,
      gridExport: 288.1,
      netMetering: 10.3,
      cost: 38.19,
      credit: 7.96,
      netCost: 30.23,
    },
    monthlyHistory: [
      { month: 'Sep', cost: 42.10, solar: 680, grid: 320 },
      { month: 'Oct', cost: 35.80, solar: 620, grid: 280 },
      { month: 'Nov', cost: 28.40, solar: 480, grid: 240 },
      { month: 'Dec', cost: 38.90, solar: 380, grid: 310 },
      { month: 'Jan', cost: 45.20, solar: 340, grid: 380 },
      { month: 'Feb', cost: 22.84, solar: 520, grid: 246 },
    ],
  },
};

export const optimizationAlerts = [
  {
    id: 1,
    severity: 'high',
    title: 'Grid draw during peak solar',
    description: 'Inverter 1 pulled 1.02 kW from grid between 11:00-13:00 while solar was producing 7.8 kW. Battery was at 78% SOC — should have been absorbing load.',
    recommendation: 'Check EG4 charge priority settings. Set battery charge current limit higher during peak solar hours.',
    savings: '$4.20/month',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    severity: 'medium',
    title: 'EV charging during peak rate hours',
    description: 'EV charger ran from 15:00-17:30 yesterday during peak TOU rate ($0.198/kWh). Total cost: $2.18 vs $0.86 if shifted to off-peak.',
    recommendation: 'Schedule EV charging between 00:00-05:00 to use off-peak rates and excess solar stored in batteries.',
    savings: '$15.60/month',
    timestamp: '1 day ago',
  },
  {
    id: 3,
    severity: 'medium',
    title: 'HVAC pre-cooling opportunity',
    description: 'HVAC runs 3.2 hours during peak (2-7 PM). Pre-cooling to 70°F by 1:30 PM using solar could reduce peak HVAC runtime by 60%.',
    recommendation: 'Set Ecobee schedule to cool to 70°F at 1:00 PM, then allow drift to 75°F during peak hours.',
    savings: '$18.40/month',
    timestamp: '3 days ago',
  },
  {
    id: 4,
    severity: 'low',
    title: 'Pool pump schedule optimization',
    description: 'Pool pump runs 10 AM - 4 PM (6 hrs). Shifting to 9 AM - 3 PM maximizes solar self-consumption.',
    recommendation: 'Adjust pool pump timer to start 1 hour earlier.',
    savings: '$3.20/month',
  },
  {
    id: 5,
    severity: 'high',
    title: 'Battery not discharging at peak',
    description: 'Batteries held at 80% SOC during peak rate hours (2-7 PM) while grid was imported at $0.198/kWh.',
    recommendation: 'Change EG4 discharge settings to allow battery discharge during TOU peak hours. Set minimum SOC to 20% during peak.',
    savings: '$22.50/month',
    timestamp: '1 day ago',
  },
];
