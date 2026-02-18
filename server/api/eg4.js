import { Router } from 'express';
import axios from 'axios';

const router = Router();
const BASE_URL = 'https://monitor.eg4electronics.com';

// ── Session state ─────────────────────────────────────────────────────────────
let _sessionCookie = null;
let _cookieExpiry  = 0;
let _inverters     = []; // [{ serialNum, name }]

// ── Daily max PV tracking ─────────────────────────────────────────────────────
let _dailyMaxPV          = 0;
let _dailyMaxPVTimestamp = null;
let _dailyMaxDate        = null;

function updateDailyMax(watts) {
  const today = new Date().toISOString().split('T')[0];
  if (_dailyMaxDate !== today) {
    _dailyMaxPV = 0;
    _dailyMaxPVTimestamp = null;
    _dailyMaxDate = today;
  }
  if (watts > _dailyMaxPV) {
    _dailyMaxPV = watts;
    _dailyMaxPVTimestamp = new Date().toISOString();
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function extractInvertersFromLoginResponse(data) {
  const inverters = [];
  const obj = data?.obj;
  if (!obj) return inverters;

  // The login response may nest inverters inside a plant/station list
  const items = Array.isArray(obj)
    ? obj
    : obj.plantList || obj.stationList || obj.inverterList || [obj];

  for (const item of items) {
    // Inverter lists nested inside a plant object
    const nested = item?.inverterList || item?.deviceList || item?.devices || [];
    for (const inv of nested) {
      const sn = inv.serialNum || inv.sn || inv.inverterSn || inv.deviceSn;
      if (sn) {
        inverters.push({ serialNum: sn, name: inv.name || inv.deviceName || sn });
      }
    }
    // Inverter directly as a top-level item
    const directSn = item.serialNum || item.sn || item.inverterSn;
    if (directSn && !nested.length) {
      inverters.push({ serialNum: directSn, name: item.name || item.deviceName || directSn });
    }
  }
  return inverters;
}

async function authenticate() {
  const username = process.env.EG4_USERNAME || process.env.EG4_EMAIL;
  const password = process.env.EG4_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'EG4 credentials not configured. Set EG4_USERNAME and EG4_PASSWORD in .env',
    );
  }

  console.log(`[EG4] Logging in as "${username}"...`);

  const body = new URLSearchParams({ account: username, password }).toString();
  const res = await axios.post(`${BASE_URL}/WManage/web/login`, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    validateStatus: () => true, // handle status codes manually
  });

  console.log(`[EG4] Login status: ${res.status}`);
  console.log(`[EG4] Login response: ${JSON.stringify(res.data).slice(0, 400)}`);

  if (res.status !== 200) {
    throw new Error(`EG4 login HTTP ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
  }
  if (res.data?.success === false) {
    throw new Error(`EG4 login rejected: ${res.data?.msg || res.data?.message || JSON.stringify(res.data).slice(0, 200)}`);
  }

  // Capture session cookie (JSESSIONID or similar)
  const setCookies = res.headers['set-cookie'] || [];
  if (setCookies.length > 0) {
    _sessionCookie = setCookies.map(c => c.split(';')[0]).join('; ');
    console.log(`[EG4] Session cookie: ${_sessionCookie.slice(0, 50)}...`);
  } else {
    console.warn('[EG4] Warning: no Set-Cookie in login response');
    _sessionCookie = ''; // Proceed anyway — server may use IP-based sessions
  }

  // Parse inverters from the login payload
  _inverters = extractInvertersFromLoginResponse(res.data);

  // Fallback: explicit serial numbers from .env
  if (_inverters.length === 0) {
    const envSerials = process.env.EG4_SERIAL_NUMBERS || '';
    if (envSerials) {
      _inverters = envSerials.split(',').map(s => ({ serialNum: s.trim(), name: s.trim() }));
      console.log(`[EG4] Using EG4_SERIAL_NUMBERS from env: ${_inverters.map(i => i.serialNum).join(', ')}`);
    } else {
      console.warn('[EG4] No inverters found in login response. Add EG4_SERIAL_NUMBERS=SN1,SN2 to .env if needed.');
    }
  } else {
    console.log(`[EG4] Inverters found: ${_inverters.map(i => `${i.serialNum}(${i.name})`).join(', ')}`);
  }

  _cookieExpiry = Date.now() + 2 * 60 * 60 * 1000; // 2-hour session
  return _sessionCookie;
}

async function getSession() {
  if (_sessionCookie !== null && Date.now() < _cookieExpiry) return _sessionCookie;
  return authenticate();
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function portalPost(path, params = {}) {
  const cookie = await getSession();
  const body   = new URLSearchParams(params).toString();
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
    ...(cookie ? { Cookie: cookie } : {}),
  };

  let res = await axios.post(`${BASE_URL}${path}`, body, {
    headers,
    validateStatus: () => true,
  });

  // Re-authenticate on 401 and retry once
  if (res.status === 401) {
    console.log('[EG4] Session expired — re-authenticating');
    _sessionCookie = null;
    _cookieExpiry  = 0;
    const newCookie = await authenticate();
    res = await axios.post(`${BASE_URL}${path}`, body, {
      headers: { ...headers, Cookie: newCookie || '' },
    });
  }

  return res.data;
}

// ── Data parsing ──────────────────────────────────────────────────────────────

// Try multiple field name variants; return the first non-null numeric value found
function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

function parseRuntime(obj = {}) {
  return {
    solarPower:     pick(obj, 'pvPower',   'pv1Power',  'totalPvPower', 'solarPower',  'ppv', 'PPV'),
    loadPower:      pick(obj, 'loadPower', 'homeLoad',  'consumePower', 'homePower',   'pLoadPower'),
    batteryPower:   pick(obj, 'batPower',  'storagePower','batteryPower','pBatPower',  'Pbat'),
    gridPower:      pick(obj, 'pGridPower','gridPower', 'meterPower',   'pGrid',       'Pgrid'),
    batterySOC:     pick(obj, 'soc',       'batCapacity','SOC',         'batSoc',      'capacity', 'socText'),
    batteryVoltage: pick(obj, 'vBat',      'batVoltage','Vbat'),
    pvVoltage:      pick(obj, 'vpv1',      'pv1Voltage','Vpv1'),
    temperature:    pick(obj, 'tInv',      'temperature','inverterTemp'),
  };
}

function parseEnergy(obj = {}) {
  return {
    dailyProduction: pick(obj, 'eToday','todayEnergy','eDay','dailyEnergy','todayYield','epvToday'),
    totalProduction: pick(obj, 'eTotal','totalEnergy','lifeTimeEnergy','totalYield'),
    dailyLoad:       pick(obj, 'eTodayLoad','todayLoadEnergy','loadEnergyToday'),
    dailyGridBuy:    pick(obj, 'eBuyToday','eTodayGrid','gridBuyToday'),
  };
}

// ── Per-inverter data fetch ───────────────────────────────────────────────────

async function fetchInverterData(inv) {
  const [rtData, enData] = await Promise.all([
    portalPost('/WManage/web/inverter/getRuntimeInfo', { serialNum: inv.serialNum }),
    portalPost('/WManage/web/inverter/getEnergy',      { serialNum: inv.serialNum }),
  ]);

  const rt = parseRuntime(rtData?.obj || rtData);
  const en = parseEnergy(enData?.obj || enData);

  return {
    serialNum:    inv.serialNum,
    deviceName:   inv.name,
    connectStatus: (rt.solarPower || rt.loadPower) ? 1 : 0, // online if any live data
    ...rt,
    ...en,
    _rtRaw: rtData,
    _enRaw: enData,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Primary dashboard endpoint
router.get('/daily-stats', async (_req, res) => {
  try {
    await getSession();

    if (_inverters.length === 0) {
      return res.status(503).json({
        error: 'No inverters found. Login succeeded but no serial numbers were returned. ' +
               'Add EG4_SERIAL_NUMBERS=SN1,SN2 to your .env file.',
      });
    }

    const inverters = await Promise.all(_inverters.map(fetchInverterData));

    const combined = {
      solarPower:      inverters.reduce((s, i) => s + (i.solarPower      || 0), 0),
      loadPower:       inverters.reduce((s, i) => s + (i.loadPower       || 0), 0),
      batteryPower:    inverters.reduce((s, i) => s + (i.batteryPower    || 0), 0),
      gridPower:       inverters.reduce((s, i) => s + (i.gridPower       || 0), 0),
      dailyProduction: inverters.reduce((s, i) => s + (i.dailyProduction || 0), 0),
    };

    updateDailyMax(combined.solarPower);

    res.json({
      inverters,
      combined,
      dailyMaxPV:          _dailyMaxPV,
      dailyMaxPVTimestamp: _dailyMaxPVTimestamp,
      lastUpdated:         new Date().toISOString(),
    });
  } catch (err) {
    console.error('[EG4] daily-stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Diagnostic — visit http://localhost:3001/api/eg4/test in browser
router.get('/test', async (_req, res) => {
  const result = {
    step1_login:   null,
    step2_inverters: null,
    step3_runtime: null,
    step4_energy:  null,
  };

  // Step 1: login
  try {
    _sessionCookie = null;
    _cookieExpiry  = 0;
    _inverters     = [];
    await authenticate();
    result.step1_login = {
      success: true,
      cookiePreview: (_sessionCookie || '').slice(0, 60) || '(no cookie — server may use IP sessions)',
    };
  } catch (err) {
    result.step1_login = { success: false, error: err.message };
    return res.json(result);
  }

  // Step 2: inverter list
  result.step2_inverters = { success: true, inverters: _inverters };
  if (_inverters.length === 0) {
    result.step2_inverters.warning = 'No inverters found in login response. Set EG4_SERIAL_NUMBERS in .env.';
    return res.json(result);
  }

  const firstSn = _inverters[0].serialNum;

  // Step 3: runtime info
  try {
    const data = await portalPost('/WManage/web/inverter/getRuntimeInfo', { serialNum: firstSn });
    result.step3_runtime = { success: true, raw: data, parsed: parseRuntime(data?.obj || data) };
  } catch (err) {
    result.step3_runtime = { success: false, error: err.message };
  }

  // Step 4: energy data
  try {
    const data = await portalPost('/WManage/web/inverter/getEnergy', { serialNum: firstSn });
    result.step4_energy = { success: true, raw: data, parsed: parseEnergy(data?.obj || data) };
  } catch (err) {
    result.step4_energy = { success: false, error: err.message };
  }

  res.json(result);
});

export { router as eg4Router };
