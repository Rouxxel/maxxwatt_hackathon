import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../../components/AppSidebar';
import { DeviceDetail as DeviceDetailComponent } from '../../components/DeviceDetail';
import { useDeviceData } from '../../hooks/useDeviceData';
import { useSSE } from '../../hooks/useSSE';

const DevicePage = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [fetchData, setFetchData] = useState(false);
  const [date, setDate] = useState('');
  const [interval, setInterval] = useState('');
  const { deviceData, loading } = useDeviceData(deviceId || '', fetchData);
  const { data: realtimeData, logs } = useSSE(deviceId || '');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (fetchData && deviceData && deviceData.data && deviceData.data.length > 0 && !Number.isNaN(deviceData.data[0].bms?.soc)) {
      setIsConnected(true);
      window.localStorage.setItem('connectedDevice', JSON.stringify({
        device_id: deviceId,
        date,
        interval
      }));
    }
  }, [deviceData, fetchData, deviceId, date, interval]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center border-b bg-card px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg text-foreground">Device {deviceId}</span>
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
                disabled={!deviceId || !date || !interval}
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

export default DevicePage;
