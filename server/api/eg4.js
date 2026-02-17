import { Router } from 'express';
import axios from 'axios';

const router = Router();

// EG4 uses the SolarMan / SOLARMAN Smart platform behind the scenes
// monitor.eg4electronics.com is a rebranded SolarMan portal
const BASE_URL = 'https://monitor.eg4electronics.com';
const API_BASE = `${BASE_URL}/api`;

// Alternative: SolarMan OpenAPI (if EG4 portal uses it)
const SOLARMAN_API = 'https://globalapi.solarmanpv.com';

let sessionToken = null;
let tokenExpiry = 0;

// ── Auth ──────────────────────────────────────────────────────────────────────

async function authenticate() {
  const email = process.env.EG4_EMAIL;
  const password = process.env.EG4_PASSWORD;

  if (!email || !password) {
    throw new Error('EG4 credentials not configured. Set EG4_EMAIL and EG4_PASSWORD in .env');
  }

  // Try the SolarMan-style auth endpoint
  try {
    const { data } = await axios.post(`${SOLARMAN_API}/account/v1.0/token`, {
      appId: '202009101423',
      email,
      password,
      orgId: null,
    }, {
      params: { language: 'en' },
    });

    if (data.success && data.access_token) {
      sessionToken = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in || 7200) * 1000 - 60_000;
      console.log('[EG4] Authenticated via SolarMan API');
      return sessionToken;
    }
  } catch (err) {
    console.log('[EG4] SolarMan global API failed, trying direct portal...');
  }

  // Fallback: Try the direct EG4 portal login
  try {
    const { data, headers } = await axios.post(`${BASE_URL}/api/v1/login`, {
      email,
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

export { router as eg4Router };
