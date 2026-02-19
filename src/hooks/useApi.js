import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic hook for polling an API endpoint.
 * Returns { data, loading, error, refetch }.
 * Falls back to null data (components should use mock data as default).
 */
export function useApi(url, { interval = 30_000, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try {
          const json = await res.json();
          if (json?.error) msg = json.error;
        } catch (_) { /* keep HTTP status as message */ }
        throw new Error(msg);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.warn(`[useApi] ${url} failed:`, err.message);
      setError(err.message);
      // Don't clear data — keep stale data visible
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchData();
    intervalRef.current = setInterval(fetchData, interval);

    return () => clearInterval(intervalRef.current);
  }, [fetchData, interval, enabled]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook to check which backend services are configured.
 */
export function useApiHealth() {
  return useApi('/api/health', { interval: 60_000 });
}

/**
 * Ecobee thermostat data — polls every 3 minutes (Ecobee rate limit).
 */
export function useEcobeeData() {
  return useApi('/api/ecobee/thermostats', { interval: 180_000 });
}

/**
 * Emporia circuit-level data — polls every 15 seconds.
 */
export function useEmporiaData() {
  return useApi('/api/emporia/circuits', { interval: 15_000 });
}

/**
 * EG4 full system overview — polls every 30 seconds.
 */
export function useEg4System() {
  return useApi('/api/eg4/system', { interval: 30_000 });
}

/**
 * EG4 combined real-time data + daily max PV — polls every 30 seconds.
 * Primary data source for the EG4 dashboard.
 */
export function useEg4DailyStats() {
  return useApi('/api/eg4/daily-stats', { interval: 30_000 });
}

/**
 * EG4 inverter real-time data — polls every 15 seconds.
 */
export function useEg4Inverter(deviceSn) {
  return useApi(`/api/eg4/inverter/${deviceSn}`, {
    interval: 15_000,
    enabled: !!deviceSn,
  });
}
