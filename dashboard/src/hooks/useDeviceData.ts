import { useState, useEffect } from 'react';
import { DeviceData, DeviceReading } from '../types/device';

const generateMockReading = (): DeviceReading => ({
  timestamp: new Date().toISOString(),
  bms: {
    soc: Math.random() * 100,
    soh: 85 + Math.random() * 15,
    voltage: 800 + Math.random() * 200,
    current: -50 + Math.random() * 100,
  },
  pcs: {
    dc_voltage: 800 + Math.random() * 200,
    dc_current: -30 + Math.random() * 60,
    ac_voltage: 380 + Math.random() * 40,
    ac_current: -20 + Math.random() * 40,
    power: 10000 + Math.random() * 5000,
    igbt_temp: 45 + Math.random() * 40,
  },
  aux: {
    hvac_temp: 20 + Math.random() * 10,
    water_pressure: 2 + Math.random() * 3,
    auxiliary_power: 500 + Math.random() * 200,
  },
  env: {
    humidity: 40 + Math.random() * 20,
    temperature: 20 + Math.random() * 15,
  },
  safety: {
    smoke: Math.random() > 0.95,
    fire: Math.random() > 0.98,
    co: Math.random() * 50,
    voc: Math.random() * 100,
    error_codes: Math.random() > 0.9 ? ['ERR_001'] : [],
  },
});

export const useDeviceData = (deviceId: string, fetchOnInit = false) => {
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId || !fetchOnInit) {
      // Static placeholder with NaN values
      setDeviceData({
        device_id: deviceId || 'N/A',
        total_records: 0,
        batch_size: 0,
        data: [
          {
            timestamp: new Date().toISOString(),
            bms: { soc: NaN, soh: NaN, voltage: NaN, current: NaN },
            pcs: { dc_voltage: NaN, dc_current: NaN, ac_voltage: NaN, ac_current: NaN, power: NaN, igbt_temp: NaN },
            aux: { hvac_temp: NaN, water_pressure: NaN, auxiliary_power: NaN },
            env: { humidity: NaN, temperature: NaN },
            safety: { smoke: false, fire: false, co: NaN, voc: NaN, error_codes: [] },
          },
        ],
      });
      setLoading(false);
      return;
    }

    const fetchDeviceData = async () => {
      try {
        setLoading(true);
        // Use the correct API endpoint from the backend
        const response = await fetch(`http://localhost:8002/bess/${deviceId}?batch_size=50&skip=0`);
        if (!response.ok) {
          throw new Error('Failed to fetch device data');
        }
        const data = await response.json();
        setDeviceData(data);
        setError(null);
      } catch (err) {
        console.warn('API not available, using mock data');
        const mockData: DeviceData = {
          device_id: deviceId,
          total_records: 1000,
          batch_size: 50,
          data: Array.from({ length: 10 }, generateMockReading),
        };
        setDeviceData(mockData);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();
  }, [deviceId, fetchOnInit]);

  return { deviceData, loading, error, setDeviceData };
};