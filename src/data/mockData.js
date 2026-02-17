// Mock data modeled after real EG4 12000XP, Emporia Vue, Ecobee, and co-op utility data

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

// EG4 system — 1x 12000XP + 1x 6000XP, battery banks, 30 kWh total
export const eg4Data = {
  inverters: [
    {
      id: 'EG4-01',
      name: 'EG4 12000XP',
      model: '12000XP',
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
      mppt1Power: 2.18,
      mppt2Power: 1.94,
      dailyProduction: 28.4,
      totalProduction: 12480,
      workingMode: 'Self-Consumption',
      settings: {
        workingMode: 'Self-Consumption',
        acChargeEnabled: false,
        acChargePowerLimit: 6.0,
        acChargeStopSOC: 95,
        pvChargePriorityEnabled: false,
        pvChargePriorityStopSOC: 100,
        pvChargeMaxPower: 12,
        forceDischargeEnabled: false,
        forceDischargePower: 6.0,
        forceDischargeStopSOC: 20,
        dischargeControl: 'SOC',
        onGridCutoffSOC: 15,
        offGridCutoffSOC: 15,
        batteryChargeCurrentLimit: 250,
        smartLoadEnabled: true,
        smartLoadMinSOC: 60,
        smartLoadMinPV: 2.0,
        timePrograms: [
          { id: 1, mode: 'PV Charge Priority', start: '09:00', stop: '15:00', enabled: false },
          { id: 2, mode: 'Force Discharge', start: '17:00', stop: '21:00', enabled: false },
          { id: 3, mode: 'AC Charge', start: '02:00', stop: '06:00', enabled: false },
        ],
      },
    },
    {
      id: 'EG4-02',
      name: 'EG4 6000XP',
      model: '6000XP',
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
      mppt1Power: 2.05,
      mppt2Power: 1.90,
      dailyProduction: 26.8,
      totalProduction: 11920,
      workingMode: 'Self-Consumption',
      settings: {
        workingMode: 'Self-Consumption',
        acChargeEnabled: false,
        acChargePowerLimit: 3.0,
        acChargeStopSOC: 95,
        pvChargePriorityEnabled: false,
        pvChargePriorityStopSOC: 100,
        pvChargeMaxPower: 6.5,
        forceDischargeEnabled: false,
        forceDischargePower: 3.0,
        forceDischargeStopSOC: 20,
        dischargeControl: 'SOC',
        onGridCutoffSOC: 15,
        offGridCutoffSOC: 15,
        batteryChargeCurrentLimit: 120,
        smartLoadEnabled: true,
        smartLoadMinSOC: 60,
        smartLoadMinPV: 1.0,
        timePrograms: [
          { id: 1, mode: 'PV Charge Priority', start: '09:00', stop: '15:00', enabled: false },
          { id: 2, mode: 'Force Discharge', start: '17:00', stop: '21:00', enabled: false },
          { id: 3, mode: 'AC Charge', start: '02:00', stop: '06:00', enabled: false },
        ],
      },
    },
  ],
  // 6 batteries, ~5 kWh each = 30 kWh total
  batteries: [
    { id: 'BAT-01', soc: 78, voltage: 52.4, current: 16.2, temp: 28, cycles: 342, health: 97, capacityKwh: 5.0 },
    { id: 'BAT-02', soc: 82, voltage: 53.1, current: 22.6, temp: 26, cycles: 338, health: 98, capacityKwh: 5.0 },
    { id: 'BAT-03', soc: 75, voltage: 51.8, current: 14.8, temp: 29, cycles: 351, health: 96, capacityKwh: 5.0 },
    { id: 'BAT-04', soc: 80, voltage: 52.8, current: 18.4, temp: 27, cycles: 340, health: 97, capacityKwh: 5.0 },
    { id: 'BAT-05', soc: 77, voltage: 52.2, current: 15.6, temp: 28, cycles: 345, health: 97, capacityKwh: 5.0 },
    { id: 'BAT-06', soc: 81, voltage: 53.0, current: 20.1, temp: 27, cycles: 336, health: 98, capacityKwh: 5.0 },
  ],
  totalCapacityKwh: 30,
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

// Flat-rate co-op utility — no TOU/peak pricing
export const utilityData = {
  rate: 0.19, // $/kWh all-in with taxes and fees
  provider: 'Electric Co-op',
  rateType: 'Flat Rate',
  billing: {
    currentMonth: {
      gridImport: 245.6,
      gridExport: 312.8,
      netMetering: -67.2,
      cost: 46.66, // 245.6 * 0.19
      credit: 59.43, // 312.8 * 0.19
      netCost: -12.77, // negative = credit
      solarProduction: 820,
      selfConsumption: 507.2,
      selfConsumptionRate: 61.8, // %
    },
    previousMonth: {
      gridImport: 298.4,
      gridExport: 288.1,
      netMetering: 10.3,
      cost: 56.70,
      credit: 54.74,
      netCost: 1.96,
      solarProduction: 740,
      selfConsumption: 451.9,
      selfConsumptionRate: 61.1,
    },
    monthlyHistory: [
      { month: 'Sep', cost: 48.20, solar: 680, grid: 320, exported: 360, selfConsumption: 58 },
      { month: 'Oct', cost: 38.00, solar: 620, grid: 280, exported: 340, selfConsumption: 62 },
      { month: 'Nov', cost: 31.92, solar: 480, grid: 240, exported: 240, selfConsumption: 55 },
      { month: 'Dec', cost: 45.60, solar: 380, grid: 310, exported: 180, selfConsumption: 48 },
      { month: 'Jan', cost: 55.10, solar: 340, grid: 380, exported: 140, selfConsumption: 42 },
      { month: 'Feb', cost: -12.77, solar: 820, grid: 246, exported: 574, selfConsumption: 62 },
    ],
  },
  // What grid avoidance is worth at flat rate
  gridAvoidanceValue: 0.19, // every kWh you don't import saves $0.19
};

// Optimization alerts updated for flat-rate co-op and EG4 12000XP settings
export const optimizationAlerts = [
  {
    id: 1,
    severity: 'high',
    title: 'Grid draw during peak solar production',
    description: 'Inverter 1 pulled 1.02 kW from grid between 11:00-13:00 while solar was producing 7.8 kW and batteries were at 78% SOC. At $0.19/kWh this cost $0.39 when it should have been free.',
    recommendation: 'In the 12000XP Monitor Center, verify "Self-Consumption" working mode is active. Check that battery charge current limit (currently 250A) is not being throttled by BMS communication errors. Review closed-loop comms cable connection between inverter and battery banks.',
    savings: '$4.80/month',
    category: 'inverter-config',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    severity: 'high',
    title: 'Battery banks not discharging to cover evening load',
    description: 'Batteries held at 75-82% SOC from 6 PM to midnight while 3.8 kW was imported from grid. That\'s 22.8 kWh at $0.19/kWh = $4.33 wasted in one night. 30 kWh battery bank should cover this easily.',
    recommendation: 'On the 12000XP, check Discharge Control is set to "According to SOC" (not voltage). Verify On-Grid Cut-Off SOC is set to 15-20% (not higher). If batteries show full but won\'t discharge, check BMS communication — the inverter may be reading incorrect SOC over closed-loop and refusing to discharge.',
    savings: '$28.50/month',
    category: 'inverter-config',
    timestamp: '1 day ago',
  },
  {
    id: 3,
    severity: 'medium',
    title: 'EV charging from grid when batteries are full',
    description: 'EV charger drew 6.6 kW from grid overnight (12-5 AM) totaling 33 kWh ($6.27). Batteries were at 80%+ SOC and could have supplied ~18 kWh of this.',
    recommendation: 'Consider enabling a "Force Discharge" time program on the 12000XP from 00:00-05:00 to feed battery power to the EV charger. Set Force Discharge Power to 6 kW and Stop SOC to 20%. This uses stored solar instead of grid.',
    savings: '$18.20/month',
    category: 'scheduling',
    timestamp: '1 day ago',
  },
  {
    id: 4,
    severity: 'medium',
    title: 'HVAC cycling during solar — use Smart Load port',
    description: 'HVAC draws 1.8-3.5 kW and cycles on/off throughout the day. When it kicks on during low-solar periods, it pulls from grid. Pre-cooling during peak solar would use free energy.',
    recommendation: 'Use the 12000XP Smart Load output for HVAC sub-panel. Configure Smart Load Min SOC to 50% and Min PV to 2 kW. Also set Ecobee to pre-cool to 70°F between 11 AM-2 PM when solar peaks, then let it drift to 75°F in the evening.',
    savings: '$12.40/month',
    category: 'scheduling',
    timestamp: '3 days ago',
  },
  {
    id: 5,
    severity: 'medium',
    title: 'Enable PV Charge Priority during morning ramp-up',
    description: 'Between 9-11 AM, solar ramps up but batteries only charge at ~30% of available rate. Loads consume most PV directly, leaving batteries under-charged for evening use.',
    recommendation: 'Enable "PV Charge Priority" time program from 09:00-11:00 on the 12000XP. This changes priority to Battery > Load > Grid during those hours, ensuring batteries reach 100% before the afternoon. Set PV Charge Max Power to 12 kW and Stop SOC to 100%.',
    savings: '$8.60/month',
    category: 'inverter-config',
    timestamp: '5 days ago',
  },
  {
    id: 6,
    severity: 'low',
    title: 'Pool pump schedule overlap with cloud cover',
    description: 'Pool pump runs 10 AM-4 PM (6 hrs at 0.75 kW = 4.5 kWh). On partly cloudy days, this overlaps with solar dips causing grid import spikes.',
    recommendation: 'Shift pool pump to 9 AM-3 PM to catch peak solar window. Better yet, connect to the Smart Load port so it only runs when battery SOC > 60% and PV > 2 kW.',
    savings: '$2.80/month',
    category: 'scheduling',
  },
];

// EG4 12000XP available working modes for the config panel
export const eg4WorkingModes = [
  {
    id: 'self-consumption',
    name: 'Self-Consumption',
    description: 'Default mode. Priority: Solar > Battery > Grid for loads. Solar excess charges batteries, then exports to grid.',
    loadPriority: 'Solar → Battery → Grid',
    solarPriority: 'Load → Battery → Grid',
    recommended: true,
  },
  {
    id: 'pv-charge-priority',
    name: 'PV Charge Priority',
    description: 'Battery charging takes priority over powering loads. Loads run from grid during this period. Use during morning solar ramp-up to ensure batteries are full for evening.',
    loadPriority: 'Grid → Solar → Battery',
    solarPriority: 'Battery → Load → Grid',
    timeConfigurable: true,
    maxTimeSlots: 3,
  },
  {
    id: 'ac-charge',
    name: 'AC Charge (Grid Charge)',
    description: 'Charge batteries from grid power. Configurable power limit and stop SOC. Useful if co-op offers any overnight programs.',
    configurable: ['Max Power (kW)', 'Stop SOC (%)', 'Stop Voltage (V)'],
    timeConfigurable: true,
    maxTimeSlots: 3,
  },
  {
    id: 'force-discharge',
    name: 'Force Discharge',
    description: 'Forces battery discharge at a set power level until stop SOC is reached. Useful for feeding stored solar to overnight loads like EV charging.',
    configurable: ['Discharge Power (kW)', 'Stop SOC (%)'],
    timeConfigurable: true,
    maxTimeSlots: 3,
  },
];

export const eg4ConfigParams = [
  { section: 'Battery Discharge', name: 'Discharge Control', value: 'According to SOC', options: ['According to SOC', 'According to Voltage'] },
  { section: 'Battery Discharge', name: 'On-Grid Cut-Off SOC', value: 15, unit: '%', min: 5, max: 100 },
  { section: 'Battery Discharge', name: 'Off-Grid Cut-Off SOC', value: 15, unit: '%', min: 5, max: 100 },
  { section: 'Battery Charge', name: 'Charge Current Limit', value: 250, unit: 'Adc', min: 0, max: 250 },
  { section: 'Battery Charge', name: 'AC Charge Current', value: 30, unit: 'A', min: 0, max: 100 },
  { section: 'Smart Load', name: 'Smart Load Enabled', value: true, type: 'boolean' },
  { section: 'Smart Load', name: 'Min Battery SOC', value: 60, unit: '%', min: 0, max: 100 },
  { section: 'Smart Load', name: 'Min PV Power', value: 2.0, unit: 'kW', min: 0, max: 12 },
  { section: 'PV', name: 'MPPT 1 Max Current', value: 35, unit: 'A', min: 0, max: 35 },
  { section: 'PV', name: 'MPPT 2 Max Current', value: 35, unit: 'A', min: 0, max: 35 },
];
