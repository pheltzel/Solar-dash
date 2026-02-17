import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Emporia uses AWS Cognito for auth
const COGNITO_URL = 'https://cognito-idp.us-east-2.amazonaws.com/';
const COGNITO_CLIENT_ID = '4qte47jbstod8apnb0c0lich17'; // Public Emporia Vue client ID
const API_BASE = 'https://api.emporiaenergy.com';

let idToken = null;
let tokenExpiry = 0;

// ── Auth ──────────────────────────────────────────────────────────────────────

async function authenticate() {
  const email = process.env.EMPORIA_EMAIL;
  const password = process.env.EMPORIA_PASSWORD;

  if (!email || !password) {
    throw new Error('Emporia credentials not configured. Set EMPORIA_EMAIL and EMPORIA_PASSWORD in .env');
  }

  const { data } = await axios.post(COGNITO_URL, {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  }, {
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
  });

  idToken = data.AuthenticationResult.IdToken;
  tokenExpiry = Date.now() + data.AuthenticationResult.ExpiresIn * 1000 - 60_000;
  console.log('[Emporia] Authenticated successfully');
  return idToken;
}

async function getToken() {
  if (idToken && Date.now() < tokenExpiry) return idToken;
  return authenticate();
}

function apiHeaders(token) {
  return { authtoken: token };
}

// ── Data endpoints ────────────────────────────────────────────────────────────

// Get customer info and device list
router.get('/devices', async (_req, res) => {
  try {
    const token = await getToken();
    const { data } = await axios.get(`${API_BASE}/customers/devices`, {
      headers: apiHeaders(token),
    });
    res.json(data);
  } catch (err) {
    console.error('[Emporia] devices error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get instant (live) usage for a device
router.get('/usage/instant', async (req, res) => {
  try {
    const token = await getToken();

    // First get devices to find the Vue device
    const devRes = await axios.get(`${API_BASE}/customers/devices`, {
      headers: apiHeaders(token),
    });

    const devices = devRes.data.devices || [];
    if (devices.length === 0) {
      return res.status(404).json({ error: 'No Emporia devices found' });
    }

    // Get instant usage for each device
    const results = await Promise.all(
      devices.map(async (device) => {
        try {
          const { data } = await axios.get(
            `${API_BASE}/AppAPI?apiMethod=getDeviceListUsages&deviceGids=${device.deviceGid}&instant=true&scale=1MIN&energyUnit=KilowattHours`,
            { headers: apiHeaders(token) }
          );
          return { device: device.deviceGid, locationName: device.locationProperties?.deviceName, ...data };
        } catch {
          return { device: device.deviceGid, error: 'Failed to fetch' };
        }
      })
    );

    res.json(results);
  } catch (err) {
    console.error('[Emporia] instant usage error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get chart usage data for a time range
router.get('/usage/chart', async (req, res) => {
  try {
    const token = await getToken();
    const { deviceGid, channel, start, end, scale = '1H', unit = 'KilowattHours' } = req.query;

    if (!deviceGid) {
      return res.status(400).json({ error: 'deviceGid query param required' });
    }

    const now = new Date();
    const startDate = start || new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const endDate = end || now.toISOString();

    const { data } = await axios.get(
      `${API_BASE}/AppAPI?apiMethod=getChartUsage&deviceGid=${deviceGid}&channel=${channel || '1,2,3'}&start=${startDate}&end=${endDate}&scale=${scale}&energyUnit=${unit}`,
      { headers: apiHeaders(token) }
    );

    res.json(data);
  } catch (err) {
    console.error('[Emporia] chart usage error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get all circuit-level data (combined device + usage in dashboard format)
router.get('/circuits', async (_req, res) => {
  try {
    const token = await getToken();

    // Get devices
    const { data: custData } = await axios.get(`${API_BASE}/customers/devices`, {
      headers: apiHeaders(token),
    });

    const devices = custData.devices || [];
    if (devices.length === 0) {
      return res.status(404).json({ error: 'No devices found' });
    }

    const deviceGids = devices.map(d => d.deviceGid).join('+');

    // Get instant usage
    const { data: usageData } = await axios.get(
      `${API_BASE}/AppAPI?apiMethod=getDeviceListUsages&deviceGids=${deviceGids}&instant=true&scale=1MIN&energyUnit=KilowattHours`,
      { headers: apiHeaders(token) }
    );

    // Build circuit list from device channels
    const circuits = [];
    let totalPower = 0;

    for (const device of devices) {
      const channels = device.channels || [];
      for (const ch of channels) {
        // Find matching usage data
        const deviceUsages = usageData?.deviceListUsages?.devices || [];
        const devUsage = deviceUsages.find(u => u.deviceGid === device.deviceGid);
        const chUsage = devUsage?.channelUsages?.find(cu => cu.channel === ch.channelNum);

        const powerKw = chUsage ? Math.abs(chUsage.usage) * 60 : 0; // Convert kWh/min to kW

        circuits.push({
          name: ch.name || `Channel ${ch.channelNum}`,
          channelNum: ch.channelNum,
          deviceGid: device.deviceGid,
          power: Math.round(powerKw * 1000) / 1000, // kW with 3 decimal places
          daily: 0, // Would need separate call for daily totals
        });

        if (ch.channelNum !== '1,2,3') { // Skip mains total
          totalPower += powerKw;
        }
      }
    }

    res.json({
      totalPower: Math.round(totalPower * 1000) / 1000,
      circuits: circuits.filter(c => c.name && c.name !== 'Main'),
      _raw: { devices: custData, usage: usageData },
    });
  } catch (err) {
    console.error('[Emporia] circuits error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

export { router as emporiaRouter };
