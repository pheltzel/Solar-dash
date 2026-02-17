import { Router } from 'express';
import axios from 'axios';

const router = Router();

const BASE_URL = 'https://api.ecobee.com';
const TOKEN_URL = `${BASE_URL}/token`;
const THERMOSTAT_URL = `${BASE_URL}/1/thermostat`;

// Token state — refreshed automatically
let accessToken = null;
let tokenExpiry = 0;

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function refreshAccessToken() {
  const refreshToken = process.env.ECOBEE_REFRESH_TOKEN;
  const apiKey = process.env.ECOBEE_API_KEY;

  if (!refreshToken || !apiKey) {
    throw new Error('Ecobee credentials not configured. Set ECOBEE_API_KEY and ECOBEE_REFRESH_TOKEN in .env');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: apiKey,
  });

  const { data } = await axios.post(TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 60_000; // refresh 1 min early

  // Persist the new refresh token for next restart
  if (data.refresh_token) {
    process.env.ECOBEE_REFRESH_TOKEN = data.refresh_token;
    console.log('[Ecobee] Token refreshed. New refresh_token stored in memory.');
    console.log(`[Ecobee] Update .env ECOBEE_REFRESH_TOKEN=${data.refresh_token}`);
  }

  return accessToken;
}

async function getToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  return refreshAccessToken();
}

// ── Initial PIN-based authorization flow ──────────────────────────────────────

// Step 1: Get a PIN to show the user
router.post('/authorize', async (_req, res) => {
  try {
    const apiKey = process.env.ECOBEE_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'ECOBEE_API_KEY not set in .env' });
    }

    const { data } = await axios.get(`${BASE_URL}/authorize`, {
      params: {
        response_type: 'ecobeePin',
        client_id: apiKey,
        scope: 'smartRead',
      },
    });

    res.json({
      pin: data.ecobeePin,
      authCode: data.code,
      instructions: `Go to ecobee.com → My Apps → Add Application → enter PIN: ${data.ecobeePin}`,
      expiresInMinutes: data.expires_in,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2: Exchange auth code for tokens (call after user enters PIN on ecobee.com)
router.post('/token', async (req, res) => {
  try {
    const { authCode } = req.body;
    const apiKey = process.env.ECOBEE_API_KEY;

    const params = new URLSearchParams({
      grant_type: 'ecobeePin',
      code: authCode,
      client_id: apiKey,
    });

    const { data } = await axios.post(TOKEN_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    accessToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000 - 60_000;
    process.env.ECOBEE_REFRESH_TOKEN = data.refresh_token;

    res.json({
      success: true,
      refreshToken: data.refresh_token,
      message: 'Save this refresh_token to your .env as ECOBEE_REFRESH_TOKEN',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Data endpoints ────────────────────────────────────────────────────────────

// Get all thermostats with full data
router.get('/thermostats', async (_req, res) => {
  try {
    const token = await getToken();

    const selection = JSON.stringify({
      selection: {
        selectionType: 'registered',
        selectionMatch: '',
        includeRuntime: true,
        includeSensors: true,
        includeWeather: true,
        includeSettings: true,
        includeEquipmentStatus: true,
      },
    });

    const { data } = await axios.get(THERMOSTAT_URL, {
      params: { format: 'json', body: selection },
      headers: { Authorization: `Bearer ${token}` },
    });

    // Transform to match our dashboard format
    const thermostats = data.thermostatList.map(t => {
      const mode = t.settings.hvacMode;
      // Pick the appropriate setpoint based on mode
      const setTemp = mode === 'cool'
        ? t.runtime.desiredCool / 10
        : mode === 'heat'
          ? t.runtime.desiredHeat / 10
          : t.runtime.desiredHeat / 10; // auto/off — show heat setpoint

      // Ecobee equipmentStatus is like "compCool1,fan" or "" — make it user-friendly
      const rawStatus = t.equipmentStatus || '';
      let hvacStatus = 'idle';
      if (rawStatus.includes('Cool') || rawStatus.includes('cool')) hvacStatus = 'cooling';
      else if (rawStatus.includes('Heat') || rawStatus.includes('heat') || rawStatus.includes('auxHeat')) hvacStatus = 'heating';
      else if (rawStatus.includes('fan')) hvacStatus = 'fan';
      else if (rawStatus.length > 0) hvacStatus = 'running';

      console.log(`[Ecobee] ${t.name}: ${t.runtime.actualTemperature / 10}°F (set ${setTemp}°F), mode=${mode}, status=${rawStatus} → ${hvacStatus}`);

      return {
        id: t.identifier,
        name: t.name,
        currentTemp: t.runtime.actualTemperature / 10,
        setTemp,
        coolSetTemp: t.runtime.desiredCool / 10,
        heatSetTemp: t.runtime.desiredHeat / 10,
        humidity: t.runtime.actualHumidity,
        mode,
        hvacStatus,
        schedule: t.program?.currentClimateRef || 'unknown',
        sensors: (t.remoteSensors || []).map(s => ({
          name: s.name,
          temp: s.capability.find(c => c.type === 'temperature')
            ? Number(s.capability.find(c => c.type === 'temperature').value) / 10
            : null,
          occupancy: s.capability.find(c => c.type === 'occupancy')?.value === 'true',
        })),
      };
    });

    // Weather from first thermostat
    const weather = data.thermostatList[0]?.weather?.forecasts?.[0];
    const outdoor = weather
      ? {
          temp: weather.temperature / 10,
          humidity: weather.relativeHumidity,
          condition: weather.condition,
        }
      : null;

    // Runtime from first thermostat
    const runtime = data.thermostatList[0]?.runtime;
    const runtimeHours = runtime
      ? {
          heatToday: ((runtime.runtimeRev ? 0 : 0) + (Number(runtime.actualTemperature) > 0 ? 0 : 0)),
        }
      : null;

    res.json({ thermostats, outdoor, _raw: data });
  } catch (err) {
    console.error('[Ecobee] Error:', err.response?.data || err.message);
    if (err.response?.status === 401) {
      accessToken = null;
      return res.status(401).json({ error: 'Token expired. Will retry on next request.' });
    }
    res.status(500).json({ error: err.message });
  }
});

export { router as ecobeeRouter };
