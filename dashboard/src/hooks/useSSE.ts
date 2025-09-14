import { useState, useEffect, useRef } from 'react';
import { DeviceReading } from '../types/device';

export const useSSE = (initialDeviceId?: string, interval: number = 2) => {
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState(initialDeviceId);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = (deviceId: string, queryParams?: string) => {
    // Always close any existing connection first (like BSM dashboard)
    if (eventSourceRef.current) {
      console.log('Closing existing EventSource connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }

    setCurrentDeviceId(deviceId);

    try {
      // Build the correct URL: /bess/{deviceId}/stream?params
      let url = `http://localhost:8002/bess/${deviceId}/stream`;
      if (queryParams) {
        url += `?${queryParams}`;
      }

      console.log('Starting EventSource connection to:', url);
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnected(true);
        const logMessage = `[${new Date().toLocaleTimeString()}] Connected to ${deviceId}`;
        setLogs(prev => [logMessage, ...prev.slice(0, 99)]);
      };

      eventSource.onmessage = (event) => {
        try {
          const reading = JSON.parse(event.data);
          setData(reading);
          const logMessage = `[${new Date().toLocaleTimeString()}] Data received: SOC=${reading.bms_soc}% V=${reading.bms_voltage}V`;
          setLogs(prev => [logMessage, ...prev.slice(0, 99)]);
        } catch (err) {
          console.error('Failed to parse SSE data:', err);
          const logMessage = `[${new Date().toLocaleTimeString()}] Parse error: ${err}`;
          setLogs(prev => [logMessage, ...prev.slice(0, 99)]);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        const logMessage = `[${new Date().toLocaleTimeString()}] Connection error - retrying...`;
        setLogs(prev => [logMessage, ...prev.slice(0, 99)]);
      };
    } catch (err) {
      console.warn('SSE not available, using mock data');
      setConnected(true);

      // Extract interval from query params, default to 2 seconds
      let intervalSeconds = 2;
      if (queryParams) {
        const urlParams = new URLSearchParams(queryParams);
        const intervalParam = urlParams.get('interval');
        if (intervalParam) {
          intervalSeconds = parseFloat(intervalParam);
        }
      }

      // Mock SSE with interval updates - Essential metrics only
      // Initialize persistent mock state
      const mockState = {
        soc: 50, // Starting SOC
        direction: 1, // 1 for charging, -1 for discharging
        cycleCount: 0
      };

      mockIntervalRef.current = setInterval(() => {
        // Create realistic SOC charging/discharging cycles
        // Simulate battery behavior: charge to 95%, discharge to 20%, repeat
        if (mockState.soc >= 95) {
          mockState.direction = -1; // Start discharging
        } else if (mockState.soc <= 20) {
          mockState.direction = 1; // Start charging
          mockState.cycleCount++;
        }

        // Add some variation to the rate (0.5% to 2% per interval)
        const rateVariation = 0.5 + Math.random() * 1.5;
        mockState.soc += mockState.direction * rateVariation;

        // Ensure bounds
        mockState.soc = Math.max(10, Math.min(100, mockState.soc));

        const mockReading = {
          timestamp: new Date().toISOString(),

          // 1. BMS - Core KPIs and Cell Health
          bms_soc: mockState.soc,
          bms_soh: 85 + Math.random() * 15,
          bms_voltage: 800 + Math.random() * 200,
          bms_current: -50 + Math.random() * 100,
          bms_cell_ave_v: 3.2 + Math.random() * 0.8,
          bms_cell_ave_t: 25 + Math.random() * 20,
          bms_cell_max_v: 3.6 + Math.random() * 0.2,
          bms_cell_min_v: 3.0 + Math.random() * 0.2,
          bms_cell_v_diff: Math.random() * 50, // mV spread
          bms_cell_t_diff: Math.random() * 10, // °C spread

          // 2. PCS - AC/DC Conversion & Thermal
          pcs_apparent_power: -70 + Math.random() * 140, // Can be negative (discharge)
          pcs_dc_voltage: 800 + Math.random() * 200,
          pcs_dc_current: -30 + Math.random() * 60,
          pcs_ac_current_a: -20 + Math.random() * 40,
          pcs_ac_current_b: -20 + Math.random() * 40,
          pcs_ac_current_c: -20 + Math.random() * 40,
          pcs_ac_voltage_ab: 380 + Math.random() * 40,
          pcs_ac_voltage_bc: 380 + Math.random() * 40,
          pcs_ac_voltage_ca: 380 + Math.random() * 40,
          pcs_temp_igbt: 35 + Math.random() * 30,
          pcs_temp_environment: 15 + Math.random() * 15,

          // 3. Auxiliary & Thermal Systems
          aux_outside_temp: 15 + Math.random() * 15,
          aux_outwater_temp: 20 + Math.random() * 10,
          aux_return_water_pressure: 1.5 + Math.random() * 1.5,
          aux_power_apparent: 0.2 + Math.random() * 0.6,

          // 4. Environmental Sensors
          env_humidity: 40 + Math.random() * 30,
          env_temperature: 15 + Math.random() * 15,

          // 5. Essential Safety (minimal)
          safety_smoke_flag: Math.random() > 0.95, // Rarely triggers (5% chance)
        };

        setData(mockReading);
        const logMessage = `[${new Date().toLocaleTimeString()}] Mock data: SOC=${mockState.soc.toFixed(1)}% V=${mockReading.bms_voltage.toFixed(1)}V ${mockState.direction > 0 ? 'CHARGING' : 'DISCHARGING'}`;
        setLogs(prev => [logMessage, ...prev.slice(0, 99)]);
      }, intervalSeconds * 1000);
    }
  };

  const stop = () => {
    console.log('Stopping EventSource connection');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
    setConnected(false);
    setCurrentDeviceId(undefined);
    const logMessage = `[${new Date().toLocaleTimeString()}] Disconnected`;
    setLogs(prev => [logMessage, ...prev.slice(0, 99)]);
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return { data, logs, connected, start, stop, currentDeviceId };
};