import { useState, useEffect } from 'react';
import { Device } from '../types/device';

const MOCK_DEVICES: Device[] = [
  {
    device_id: 'BESS-001',
    available_metrics: ['bms', 'pcs', 'aux', 'env', 'safety'],
    total_rows_per_metric: {
      bms: 1500,
      pcs: 1200,
      aux: 800,
      env: 600,
      safety: 300
    }
  },
  {
    device_id: 'BESS-002',
    available_metrics: ['bms', 'pcs', 'env'],
    total_rows_per_metric: {
      bms: 2100,
      pcs: 1800,
      env: 900
    }
  },
  {
    device_id: 'BESS-003',
    available_metrics: [],
    total_rows_per_metric: {}
  }
];

export const useDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        // Use the correct API endpoint from the backend
        const response = await fetch('http://localhost:8002/bess/devices');
        if (!response.ok) {
          throw new Error('Failed to fetch devices');
        }
        const data = await response.json();
        setDevices(data.devices || []);
        setError(null);
      } catch (err) {
        console.warn('API not available, using mock data');
        setDevices(MOCK_DEVICES);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  return { devices, loading, error };
};