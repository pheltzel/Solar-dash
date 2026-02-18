import { Router } from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = Router();

// EG4 uses the SolarMan / SOLARMAN Smart platform behind the scenes
// monitor.eg4electronics.com is a rebranded SolarMan portal
const BASE_URL = 'https://monitor.eg4electronics.com';
const API_BASE = `${BASE_URL}/api`;

// Alternative: SolarMan OpenAPI (if EG4 portal uses it)
const SOLARMAN_API = 'https://globalapi.solarmanpv.com';

let sessionToken = null;
let tokenExpiry = 0;

// ── Daily max PV tracking ─────────────────────────────────────────────────────
// Resets automatically each calendar day (server-local time).
let _dailyMaxPV = 0;
let _dailyMaxPVTimestamp = null;
let _dailyMaxDate = null; // 'YYYY-MM-DD'

function updateDailyMax(combinedSolarWatts) {
  const today = new Date().toISOString().split('T')[0];
  if (_dailyMaxDate !== today) {
    _dailyMaxPV = 0;
    _dailyMaxPVTimestamp = null;
    _dailyMaxDate = today;
  }
  if (combinedSolarWatts > _dailyMaxPV) {
    _dailyMaxPV = combinedSolarWatts;
    _dailyMaxPVTimestamp = new Date().toISOString();
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function authenticate() {
  // Accept either EG4_USERNAME (plain username) or EG4_EMAIL (email address)
  const username = process.env.EG4_USERNAME || process.env.EG4_EMAIL;
  const password = process.env.EG4_PASSWORD;

  if (!username || !password) {
    throw new Error('EG4 credentials not configured. Set EG4_USERNAME (or EG4_EMAIL) and EG4_PASSWORD in .env');
  }

  // SolarMan Open API authentication
  // Requires: SHA256-hashed password, appSecret in body, appId in query params
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  try {
    const { data } = await axios.post(`${SOLARMAN_API}/account/v1.0/token`, {
      appSecret: 'apitest',
      username,   // SolarMan accepts username or email in this field
      password: hashedPassword,
    }, {
      params: { appId: '202009101423', language: 'en' },
    });

    if (data.success && data.access_token) {
      sessionToken = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in || 7200) * 1000 - 60_000;
      console.log('[EG4] Authenticated via SolarMan API');
      return sessionToken;
    }
    console.error('[EG4] SolarMan auth response (no token):', JSON.stringify(data).slice(0, 300));
  } catch (err) {
    console.error('[EG4] SolarMan auth failed:', err.response?.status, JSON.stringify(err.response?.data || err.message).slice(0, 300));
  }

  // Fallback: Try the direct EG4 portal login
  try {
    const { data, headers } = await axios.post(`${BASE_URL}/api/v1/login`, {
      username,   // try username field
      email: username,   // some portals expect email field
      password,
      isRemember: true,
    }, {
      headers: { 'Content-Type': 'application/json' },
      maxRedirects: 0,
      validateStatus: s => s < 400,
    });

    // Token might be in response body or set-cookie
    const token = data?.data?.token || data?.token || data?.access_token;
    if (token) {
      sessionToken = token;
      tokenExpiry = Date.now() + 7200_000;
      console.log('[EG4] Authenticated via portal login');
      return sessionToken;
    }

    // Check cookies
    const cookies = headers['set-cookie'];
    if (cookies) {
      const sessionCookie = cookies.find(c => c.includes('token=') || c.includes('session'));
      if (sessionCookie) {
        sessionToken = sessionCookie;
        tokenExpiry = Date.now() + 7200_000;
        console.log('[EG4] Authenticated via portal cookie');
        return sessionToken;
      }
    }

    console.log('[EG4] Login response:', JSON.stringify(data).slice(0, 500));
    throw new Error('Could not extract token from EG4 login response');
  } catch (err) {
    if (err.response) {
      console.error('[EG4] Login failed:', err.response.status, JSON.stringify(err.response.data).slice(0, 500));
    }
    throw new Error(`EG4 authentication failed: ${err.message}`);
  }
}

async function getToken() {
  if (sessionToken && Date.now() < tokenExpiry) return sessionToken;
  return authenticate();
}

// ── SolarMan API helpers ──────────────────────────────────────────────────────

async function solarmanGet(path, params = {}) {
  const token = await getToken();
  const { data } = await axios.get(`${SOLARMAN_API}${path}`, {
    params: { ...params, language: 'en' },
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

async function solarmanPost(path, body = {}) {
  const token = await getToken();
  const { data } = await axios.post(`${SOLARMAN_API}${path}`, body, {
    params: { language: 'en' },
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return data;
}

// ── Data endpoints ────────────────────────────────────────────────────────────

// Get plant/station list
router.get('/plants', async (_req, res) => {
  try {
    const data = await solarmanPost('/station/v1.0/list', { page: 1, size: 20 });
    res.json(data);
  } catch (err) {
    console.error('[EG4] plants error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get device list for a plant
router.get('/devices', async (req, res) => {
  try {
    const { stationId } = req.query;
    if (!stationId) {
      // First get the plant list to find stationId
      const plants = await solarmanPost('/station/v1.0/list', { page: 1, size: 20 });
      const firstStation = plants?.stationList?.[0];
      if (!firstStation) {
        return res.status(404).json({ error: 'No plants/stations found' });
      }
      req.query.stationId = firstStation.id;
    }

    const data = await solarmanPost('/station/v1.0/device', {
      stationId: Number(req.query.stationId),
      page: 1,
      size: 20,
    });
    res.json(data);
  } catch (err) {
    console.error('[EG4] devices error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get real-time data for a specific inverter
router.get('/inverter/:deviceSn', async (req, res) => {
  try {
    const { deviceSn } = req.params;

    const data = await solarmanPost('/device/v1.0/currentData', {
      deviceSn,
    });

    // Transform to our dashboard format
    const dataList = data?.dataList || [];
    const getValue = (key) => {
      const item = dataList.find(d => d.key === key);
      return item ? Number(item.value) : null;
    };

    const transformed = {
      deviceSn,
      solarPower: getValue('DPi_t1') || getValue('Ppv') || 0,
      batteryPower: getValue('Pb_t1') || getValue('Pbat') || 0,
      gridPower: getValue('Pg_t1') || getValue('Pgrid') || 0,
      loadPower: getValue('Pl_t1') || getValue('Pload') || 0,
      batterySoc: getValue('SOC_t1') || getValue('SOC') || 0,
      batteryVoltage: getValue('Vb_t1') || getValue('Vbat') || 0,
      dailyProduction: getValue('Etdy_ge1') || getValue('E_today') || 0,
      totalProduction: getValue('Et_ge0') || getValue('E_total') || 0,
      _raw: data,
    };

    res.json(transformed);
  } catch (err) {
    console.error('[EG4] inverter error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get historical data for charts
router.get('/history/:deviceSn', async (req, res) => {
  try {
    const { deviceSn } = req.params;
    const { startTime, endTime, timeType = '1' } = req.query; // timeType 1=day, 2=month, 3=year

    const now = new Date();
    const data = await solarmanPost('/device/v1.0/historical', {
      deviceSn,
      startTime: startTime || new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endTime: endTime || now.toISOString().split('T')[0],
      timeType: Number(timeType),
    });

    res.json(data);
  } catch (err) {
    console.error('[EG4] history error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get battery data
router.get('/batteries/:deviceSn', async (req, res) => {
  try {
    const { deviceSn } = req.params;

    const data = await solarmanPost('/device/v1.0/currentData', {
      deviceSn,
    });

    const dataList = data?.dataList || [];
    const batteries = [];

    // EG4 12000XP supports multiple battery banks
    // Try to extract individual battery data from the data list
    for (let i = 1; i <= 8; i++) {
      const soc = dataList.find(d => d.key === `B${i}_SOC` || d.key === `bat${i}_soc`);
      const voltage = dataList.find(d => d.key === `B${i}_V` || d.key === `bat${i}_voltage`);
      const current = dataList.find(d => d.key === `B${i}_I` || d.key === `bat${i}_current`);
      const temp = dataList.find(d => d.key === `B${i}_T` || d.key === `bat${i}_temp`);

      if (soc || voltage) {
        batteries.push({
          bank: i,
          soc: soc ? Number(soc.value) : null,
          voltage: voltage ? Number(voltage.value) : null,
          current: current ? Number(current.value) : null,
          temp: temp ? Number(temp.value) : null,
        });
      }
    }

    // If no individual battery data, try aggregate
    if (batteries.length === 0) {
      const aggSoc = dataList.find(d => d.key?.includes('SOC'));
      const aggV = dataList.find(d => d.key?.includes('Vbat') || d.key?.includes('Vb'));
      if (aggSoc) {
        batteries.push({
          bank: 1,
          soc: Number(aggSoc.value),
          voltage: aggV ? Number(aggV.value) : null,
          current: null,
          temp: null,
        });
      }
    }

    res.json({ batteries, _raw: data });
  } catch (err) {
    console.error('[EG4] batteries error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Helper: extract a numeric value from a SolarMan dataList by trying multiple key names
function extractValue(dataList, ...keys) {
  if (!dataList) return 0;
  for (const key of keys) {
    const exact = dataList.find(d => d.key === key);
    if (exact) return Number(exact.value) || 0;
  }
  for (const key of keys) {
    const partial = dataList.find(d => d.key?.includes(key));
    if (partial) return Number(partial.value) || 0;
  }
  return 0;
}

// Pre-parse a dataList into a dashboard-friendly inverter object
function parseInverterData(deviceSn, deviceName, connectStatus, dataList) {
  return {
    deviceSn,
    deviceName,
    connectStatus,
    solarPower: extractValue(dataList, 'DPi_t1', 'Ppv_t1', 'APo_t1'),
    batteryPower: extractValue(dataList, 'Pb_t1', 'Pbat'),
    gridPower: extractValue(dataList, 'Pg_t1', 'Pgrid', 'PG_Pt1'),
    loadPower: extractValue(dataList, 'Pl_t1', 'Pload', 'CT_Pt1'),
    batterySOC: extractValue(dataList, 'SOC_t1', 'SOC', 'B_SOC1'),
    batteryVoltage: extractValue(dataList, 'Vb_t1', 'Vbat', 'B_V1'),
    pvVoltage: extractValue(dataList, 'Vpv1', 'PV1_V1', 'Upv1'),
    pvCurrent: extractValue(dataList, 'Ipv1', 'PV1_I1'),
    mppt1Power: extractValue(dataList, 'Ppv1', 'PV1_P1'),
    mppt2Power: extractValue(dataList, 'Ppv2', 'PV2_P1'),
    dailyProduction: extractValue(dataList, 'Etdy_ge1', 'Eday_ge1', 'E_today'),
    totalProduction: extractValue(dataList, 'Et_ge0', 'Et_ge1', 'E_total'),
    batteryTemp: extractValue(dataList, 'Tb_t1', 'T_BMS1', 'bat_temp'),
    dataList,
  };
}

// Full system overview — combines plants + devices + real-time data
router.get('/system', async (_req, res) => {
  try {
    // Get plants
    const plantData = await solarmanPost('/station/v1.0/list', { page: 1, size: 20 });
    const stations = plantData?.stationList || [];

    if (stations.length === 0) {
      return res.status(404).json({ error: 'No stations found in EG4 account' });
    }

    // Get devices for first station
    const deviceData = await solarmanPost('/station/v1.0/device', {
      stationId: stations[0].id,
      page: 1,
      size: 20,
    });
    const devices = deviceData?.deviceListItems || [];

    // Accept any device with a serial number that isn't purely a data logger
    const inverterDevices = devices.filter(d =>
      d.deviceSn && d.deviceType !== 'COLLECTOR' && d.deviceType !== 2
    );

    console.log(`[EG4] Found ${inverterDevices.length} inverter device(s):`,
      inverterDevices.map(d => `${d.deviceSn} (type=${d.deviceType})`).join(', '));

    const inverters = await Promise.all(
      inverterDevices.map(async (device) => {
        try {
          const rtData = await solarmanPost('/device/v1.0/currentData', {
            deviceSn: device.deviceSn,
          });

          const name = device.customName || device.deviceName || device.deviceSn;
          console.log(`[EG4] ${device.deviceSn} (${name}): ${(rtData?.dataList || []).length} data points`);

          return parseInverterData(
            device.deviceSn,
            name,
            device.connectStatus,
            rtData?.dataList || [],
          );
        } catch (err) {
          console.error(`[EG4] Failed to get data for ${device.deviceSn}:`, err.message);
          return {
            deviceSn: device.deviceSn,
            deviceName: device.customName || device.deviceName || device.deviceSn,
            connectStatus: device.connectStatus,
            error: err.message,
          };
        }
      })
    );

    res.json({
      station: stations[0],
      devices,
      inverters,
    });
  } catch (err) {
    console.error('[EG4] system error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Combined real-time stats + daily max PV — the primary endpoint for the dashboard
router.get('/daily-stats', async (_req, res) => {
  try {
    const plantData = await solarmanPost('/station/v1.0/list', { page: 1, size: 20 });
    const stations = plantData?.stationList || [];

    if (stations.length === 0) {
      return res.status(503).json({ error: 'No stations found in EG4 account' });
    }

    const deviceData = await solarmanPost('/station/v1.0/device', {
      stationId: stations[0].id,
      page: 1,
      size: 20,
    });

    const inverterDevices = (deviceData?.deviceListItems || []).filter(
      d => d.deviceSn && d.deviceType !== 'COLLECTOR' && d.deviceType !== 2,
    );

    const inverters = await Promise.all(
      inverterDevices.map(async (device) => {
        try {
          const rtData = await solarmanPost('/device/v1.0/currentData', {
            deviceSn: device.deviceSn,
          });
          const name = device.customName || device.deviceName || device.deviceSn;
          return parseInverterData(device.deviceSn, name, device.connectStatus, rtData?.dataList || []);
        } catch (err) {
          console.error(`[EG4] daily-stats: failed for ${device.deviceSn}:`, err.message);
          return {
            deviceSn: device.deviceSn,
            deviceName: device.customName || device.deviceName || device.deviceSn,
            connectStatus: device.connectStatus,
            error: err.message,
          };
        }
      }),
    );

    const combined = {
      solarPower:      inverters.reduce((s, i) => s + (i.solarPower      || 0), 0),
      loadPower:       inverters.reduce((s, i) => s + (i.loadPower       || 0), 0),
      batteryPower:    inverters.reduce((s, i) => s + (i.batteryPower    || 0), 0),
      gridPower:       inverters.reduce((s, i) => s + (i.gridPower       || 0), 0),
      dailyProduction: inverters.reduce((s, i) => s + (i.dailyProduction || 0), 0),
    };

    updateDailyMax(combined.solarPower);

    res.json({
      station: stations[0],
      inverters,
      combined,
      dailyMaxPV:          _dailyMaxPV,
      dailyMaxPVTimestamp: _dailyMaxPVTimestamp,
      lastUpdated:         new Date().toISOString(),
    });
  } catch (err) {
    console.error('[EG4] daily-stats error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Diagnostic test endpoint ─────────────────────────────────────────────────
// Open http://localhost:3001/api/eg4/test in a browser to see what works/fails
router.get('/test', async (_req, res) => {
  const results = {
    step1_auth: null,
    step2_stations: null,
    step3_devices: null,
    step4_inverterData: null,
  };

  // Step 1: Auth
  try {
    sessionToken = null; // Force re-auth
    tokenExpiry = 0;
    const token = await getToken();
    results.step1_auth = { success: true, tokenPreview: token.slice(0, 20) + '...' };
  } catch (err) {
    results.step1_auth = { success: false, error: err.message };
    return res.json(results);
  }

  // Step 2: List stations
  try {
    const data = await solarmanPost('/station/v1.0/list', { page: 1, size: 20 });
    const stations = data?.stationList || [];
    results.step2_stations = {
      success: true,
      count: stations.length,
      stations: stations.map(s => ({ id: s.id, name: s.name })),
    };
    if (stations.length === 0) return res.json(results);
  } catch (err) {
    results.step2_stations = { success: false, error: err.response?.data || err.message };
    return res.json(results);
  }

  // Step 3: List devices for first station
  try {
    const stationId = results.step2_stations.stations[0].id;
    const data = await solarmanPost('/station/v1.0/device', {
      stationId: Number(stationId),
      page: 1,
      size: 20,
    });
    const devices = data?.deviceListItems || [];
    results.step3_devices = {
      success: true,
      count: devices.length,
      devices: devices.map(d => ({
        sn: d.deviceSn,
        name: d.customName || d.deviceName || d.deviceSn,
        type: d.deviceType,
        status: d.connectStatus,
      })),
    };
    if (devices.length === 0) return res.json(results);
  } catch (err) {
    results.step3_devices = { success: false, error: err.response?.data || err.message };
    return res.json(results);
  }

  // Step 4: Get currentData for first device
  try {
    const firstDevice = results.step3_devices.devices[0];
    const data = await solarmanPost('/device/v1.0/currentData', {
      deviceSn: firstDevice.sn,
    });
    const dataList = data?.dataList || [];
    results.step4_inverterData = {
      success: true,
      deviceSn: firstDevice.sn,
      dataPointCount: dataList.length,
      // Show first 10 data points so we can see actual key names
      sampleData: dataList.slice(0, 10).map(d => ({
        key: d.key,
        value: d.value,
        unit: d.unit,
        name: d.name,
      })),
      // Show all key names so we can match them
      allKeys: dataList.map(d => d.key),
    };
  } catch (err) {
    results.step4_inverterData = { success: false, error: err.response?.data || err.message };
  }

  res.json(results);
});

export { router as eg4Router };
