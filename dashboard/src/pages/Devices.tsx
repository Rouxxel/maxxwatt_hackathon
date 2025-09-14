// This page is deprecated. Each device now has its own page.
// (intentionally left blank)


import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { DeviceDetail as DeviceDetailComponent } from '../components/DeviceDetail';
import { useDeviceData } from '../hooks/useDeviceData';
import { useSSE } from '../hooks/useSSE';



const Devices = () => {
  const location = useLocation();
  // Get device from query param if present
  const queryDevice = (() => {
    const params = new URLSearchParams(location.search);
    return params.get('device') || '';
  })();
  const [selectedDevice, setSelectedDevice] = useState<string>(queryDevice);

  // Update selectedDevice if query param changes (e.g., user navigates from Overview)
  useEffect(() => {
    if (queryDevice && queryDevice !== selectedDevice) {
      setSelectedDevice(queryDevice);
      setFetchData(false);
    }
  }, [queryDevice]);
  const [fetchData, setFetchData] = useState(false);
  const [date, setDate] = useState('');
  const [interval, setInterval] = useState('');
  // Only allow these device IDs
  const devices = [
    { device_id: 'ZHPESS232A230002' },
    { device_id: 'ZHPESS232A230003' },
    { device_id: 'ZHPESS232A230007' },
  ];
  const devicesLoading = false;
  const { deviceData, loading, setDeviceData } = useDeviceData(selectedDevice, fetchData);
  const { data: realtimeData, logs } = useSSE(selectedDevice);
  const [isConnected, setIsConnected] = useState(false);

  // Check device online status from localStorage
  useEffect(() => {
    if (selectedDevice) {
      const isOnline = localStorage.getItem(`device_online_${selectedDevice}`) === 'true';
      setIsConnected(isOnline);
    }
  }, [selectedDevice]);

  // When deviceData is loaded from API, set connected and save to localStorage
  useEffect(() => {
    if (fetchData && deviceData && deviceData.data && deviceData.data.length > 0 && !Number.isNaN(deviceData.data[0].bms?.soc)) {
      setIsConnected(true);
      localStorage.setItem(`device_online_${selectedDevice}`, 'true');
    }
  }, [deviceData, fetchData, selectedDevice]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center border-b bg-card px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg text-foreground">BESS Dashboard</span>
            </div>
            <div className="ml-auto">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isConnected ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
              }`}>
                {isConnected ? '● Connected' : '○ Disconnected'}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            <div className="mb-4 flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Device</label>
                <select
                  value={selectedDevice}
                  onChange={e => {
                    setSelectedDevice(e.target.value);
                    setFetchData(false);
                  }}
                  className="border rounded px-2 py-1 min-w-[160px] text-neutral-900 bg-white"
                  disabled={devicesLoading}
                >
                  <option value="">Select device</option>
                  {devices.map(device => (
                    <option key={device.device_id} value={device.device_id}>
                      {device.device_id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <input
                  type="month"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="border rounded px-2 py-1 text-neutral-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interval</label>
                <input
                  type="number"
                  min={1}
                  value={interval}
                  onChange={e => setInterval(e.target.value)}
                  className="border rounded px-2 py-1 text-neutral-900 bg-white"
                  placeholder="Enter interval (number)"
                />
              </div>
              <button
                className="bg-primary text-black px-4 py-2 rounded disabled:opacity-50"
                disabled={!selectedDevice || !date || !interval}
                onClick={() => setFetchData(true)}
              >
                {isConnected ? 'Connected' : 'Connect'}
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DeviceDetailComponent
                deviceData={deviceData}
                realtimeData={realtimeData}
                logs={logs}
                connected={isConnected}
              />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Devices;