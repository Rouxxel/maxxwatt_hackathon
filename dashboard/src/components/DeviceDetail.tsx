import { useMemo, useRef, useEffect, useState } from 'react';
import { MetricCard } from './MetricCard';
import { AlertsBanner } from './AlertsBanner';
import { LogsPanel } from './LogsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Battery, 
  Zap, 
  Thermometer, 
  Droplets, 
  ShieldAlert,
  Activity,
  Gauge,
  Power
} from 'lucide-react';
import { DeviceData, DeviceReading, Alert, AlertLevel } from '../types/device';

interface DeviceDetailProps {
  deviceData: DeviceData | null;
  realtimeData: DeviceReading | null;
  logs: string[];
  connected: boolean;
}

export const DeviceDetail = ({ deviceData, realtimeData, logs, connected }: DeviceDetailProps) => {
  // Accumulate one point per hour
  // Hourly data state, only update when a new hour is reached
  // Hourly accumulation state
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const hourlyMapRef = useRef<Map<string, { sum: number, count: number, avg: number, reading: any }>>(new Map());
  const lastHourRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // Only reset hourlyData if device changes, and persist in localStorage
  // Initialize hourlyMap and hourlyData from deviceData or localStorage
  useEffect(() => {
    if (!deviceData?.data || !deviceData.device_id) return;
    const storageKey = `hourlyData_${deviceData.device_id}`;
    // Try to load from localStorage first
    const stored = localStorage.getItem(storageKey);
    let map = new Map();
    if (stored) {
      try {
        const arr = JSON.parse(stored);
        arr.forEach((item: any) => {
          const hour = new Date(item.timestamp).toISOString().slice(0, 13);
          map.set(hour, {
            sum: item.bms?.soc || 0,
            count: 1,
            avg: item.bms?.soc || 0,
            reading: item
          });
        });
      } catch {}
    } else {
      deviceData.data.forEach(reading => {
        const hour = new Date(reading.timestamp).toISOString().slice(0, 13);
        if (!map.has(hour)) {
          map.set(hour, {
            sum: reading.bms?.soc || 0,
            count: 1,
            avg: reading.bms?.soc || 0,
            reading
          });
        } else {
          const entry = map.get(hour);
          entry.sum += reading.bms?.soc || 0;
          entry.count += 1;
          entry.avg = entry.sum / entry.count;
          entry.reading = reading;
        }
      });
      // Save to localStorage
      const arr = Array.from(map.values()).map(e => e.reading);
      localStorage.setItem(storageKey, JSON.stringify(arr));
    }
    hourlyMapRef.current = map;
    // Build hourlyData array from map (sorted)
    const sorted = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v.reading, bms: { ...v.reading.bms, soc: v.avg } }));
    setHourlyData(sorted);
    if (sorted.length > 0) lastHourRef.current = new Date(sorted[sorted.length-1].timestamp).toISOString().slice(0, 13);
    initializedRef.current = true;
  }, [deviceData?.device_id]);

  // Add new realtimeData if a new hour is reached, and persist in localStorage
  // Accumulate and plot one point per real hour (browser time)
  useEffect(() => {
    if (!realtimeData || !deviceData?.device_id) return;
    const map = hourlyMapRef.current;
    const now = new Date();
    const hourKey = now.toISOString().slice(0, 13); // Real browser hour
    let shouldAdd = false;
    if (!lastHourRef.current) {
      shouldAdd = true;
    } else {
      const lastDate = new Date(lastHourRef.current + ':00:00.000Z');
      if ((now.getTime() - lastDate.getTime()) >= 60 * 60 * 1000) {
        shouldAdd = true;
      }
    }
    if (shouldAdd) {
      // New real hour: push previous hour's average to chart
      map.set(hourKey, {
        sum: realtimeData.bms?.soc || 0,
        count: 1,
        avg: realtimeData.bms?.soc || 0,
        reading: { ...realtimeData, timestamp: now.toISOString() }
      });
      lastHourRef.current = hourKey;
      const arr = Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => ({ ...v.reading, bms: { ...v.reading.bms, soc: v.avg } }));
      setHourlyData(arr);
      localStorage.setItem(`hourlyData_${deviceData.device_id}`, JSON.stringify(arr));
    } else {
      // Accumulate for current real hour
      if (map.has(hourKey)) {
        const entry = map.get(hourKey);
        entry.sum += realtimeData.bms?.soc || 0;
        entry.count += 1;
        entry.avg = entry.sum / entry.count;
        entry.reading = { ...realtimeData, timestamp: now.toISOString() };
      } else {
        map.set(hourKey, {
          sum: realtimeData.bms?.soc || 0,
          count: 1,
          avg: realtimeData.bms?.soc || 0,
          reading: { ...realtimeData, timestamp: now.toISOString() }
        });
      }
    }
  }, [realtimeData, deviceData?.device_id]);
  const alerts = useMemo(() => {
    if (!realtimeData) return [];
    
    const alerts: Alert[] = [];
    
    // SOC Alert
    if (realtimeData.bms?.soc && realtimeData.bms.soc < 20) {
      alerts.push({
        id: 'soc-low',
        level: 'critical',
        message: `Low SOC: ${realtimeData.bms.soc.toFixed(1)}%`,
        timestamp: realtimeData.timestamp,
      });
    }
    
    // IGBT Temperature Alert
    if (realtimeData.pcs?.igbt_temp && realtimeData.pcs.igbt_temp > 80) {
      alerts.push({
        id: 'igbt-temp',
        level: 'warning',
        message: `High IGBT Temperature: ${realtimeData.pcs.igbt_temp.toFixed(1)}°C`,
        timestamp: realtimeData.timestamp,
      });
    }
    
    // Safety Alerts
    if (realtimeData.safety?.smoke) {
      alerts.push({
        id: 'smoke',
        level: 'critical',
        message: 'Smoke detected!',
        timestamp: realtimeData.timestamp,
      });
    }
    
    if (realtimeData.safety?.fire) {
      alerts.push({
        id: 'fire',
        level: 'critical',
        message: 'Fire detected!',
        timestamp: realtimeData.timestamp,
      });
    }
    
    return alerts;
  }, [realtimeData]);

  const getAlertLevel = (metric: string, value: number): AlertLevel => {
    switch (metric) {
      case 'soc':
        return value < 20 ? 'critical' : value < 40 ? 'warning' : 'normal';
      case 'igbt_temp':
        return value > 80 ? 'critical' : value > 70 ? 'warning' : 'normal';
      case 'voltage':
        return value < 700 || value > 1200 ? 'critical' : 'normal';
      default:
        return 'normal';
    }
  };


  if (!deviceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select a device to view details</p>
        </div>
      </div>
    );
  }

  const currentData = realtimeData || deviceData.data[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{deviceData.device_id}</h1>
          <p className="text-muted-foreground">Real-time device monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={connected ? 'default' : 'secondary'} className="flex items-center gap-2 px-3 py-1">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
            {connected ? 'Live Stream' : 'Disconnected'}
          </Badge>
          <div className="text-sm text-muted-foreground">
            Last update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <AlertsBanner alerts={alerts} />

      {/* Charts removed */}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* BMS Metrics */}
        {currentData.bms && (
          <>
            <MetricCard
              title="State of Charge"
              value={currentData.bms.soc || 0}
              unit="%"
              format="percentage"
              icon={<Battery className="h-4 w-4" />}
              alertLevel={getAlertLevel('soc', currentData.bms.soc || 0)}
            />
            <MetricCard
              title="State of Health"
              value={currentData.bms.soh || 0}
              unit="%"
              format="percentage"
              icon={<Gauge className="h-4 w-4" />}
            />
            <MetricCard
              title="Voltage"
              value={currentData.bms.voltage || 0}
              unit="V"
              icon={<Zap className="h-4 w-4" />}
              alertLevel={getAlertLevel('voltage', currentData.bms.voltage || 0)}
            />
            <MetricCard
              title="Current"
              value={currentData.bms.current || 0}
              unit="A"
              icon={<Activity className="h-4 w-4" />}
            />
          </>
        )}

        {/* PCS Metrics */}
        {currentData.pcs && (
          <>
            <MetricCard
              title="IGBT Temperature"
              value={currentData.pcs.igbt_temp || 0}
              unit="°C"
              icon={<Thermometer className="h-4 w-4" />}
              alertLevel={getAlertLevel('igbt_temp', currentData.pcs.igbt_temp || 0)}
            />
            <MetricCard
              title="Power"
              value={(currentData.pcs.power || 0) / 1000}
              unit="kW"
              icon={<Power className="h-4 w-4" />}
            />
            <MetricCard
              title="DC Voltage"
              value={currentData.pcs.dc_voltage || 0}
              unit="V"
              icon={<Zap className="h-4 w-4" />}
            />
            <MetricCard
              title="AC Voltage"
              value={currentData.pcs.ac_voltage || 0}
              unit="V"
              icon={<Zap className="h-4 w-4" />}
            />
          </>
        )}

        {/* Environmental Metrics */}
        {currentData.env && (
          <>
            <MetricCard
              title="Temperature"
              value={currentData.env.temperature || 0}
              unit="°C"
              icon={<Thermometer className="h-4 w-4" />}
            />
            <MetricCard
              title="Humidity"
              value={currentData.env.humidity || 0}
              unit="%"
              icon={<Droplets className="h-4 w-4" />}
            />
          </>
        )}

        {/* Safety Metrics */}
        {currentData.safety && (
          <>
            <MetricCard
              title="Smoke Detection"
              value={currentData.safety.smoke || false}
              format="boolean"
              icon={<ShieldAlert className="h-4 w-4" />}
              alertLevel={currentData.safety.smoke ? 'critical' : 'normal'}
            />
            <MetricCard
              title="Fire Detection"
              value={currentData.safety.fire || false}
              format="boolean"
              icon={<ShieldAlert className="h-4 w-4" />}
              alertLevel={currentData.safety.fire ? 'critical' : 'normal'}
            />
          </>
        )}
      </div>

      {/* Logs */}
      <LogsPanel logs={logs} />
    </div>
  );
};