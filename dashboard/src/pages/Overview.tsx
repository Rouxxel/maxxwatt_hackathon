import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Battery, Circle, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
  // Mock SOC chart data for demonstration
  const socChartData = Array.from({ length: 30 }, (_, i) => ({
    time: `2025-09-${(i+1).toString().padStart(2, '0')}`,
    soc: 60 + Math.round(Math.sin(i/5) * 20 + Math.random() * 10),
  }));

const Overview = () => {
  const navigate = useNavigate();
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, boolean>>({});

  // Static device list, no API calls
  const devices = [
    { device_id: 'ZHPESS232A230002', available_metrics: [], total_rows_per_metric: {} },
    { device_id: 'ZHPESS232A230003', available_metrics: [], total_rows_per_metric: {} },
    { device_id: 'ZHPESS232A230007', available_metrics: [], total_rows_per_metric: {} },
  ];

  // Load device online statuses from localStorage
  useEffect(() => {
    const statuses: Record<string, boolean> = {};
    devices.forEach(device => {
      const isOnline = localStorage.getItem(`device_online_${device.device_id}`) === 'true';
      statuses[device.device_id] = isOnline;
    });
    setDeviceStatuses(statuses);

    // Listen for localStorage changes to update status in real-time
    const handleStorageChange = () => {
      const updatedStatuses: Record<string, boolean> = {};
      devices.forEach(device => {
        const isOnline = localStorage.getItem(`device_online_${device.device_id}`) === 'true';
        updatedStatuses[device.device_id] = isOnline;
      });
      setDeviceStatuses(updatedStatuses);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Layout headerTitle="MaxxWatt Overview">
      <div className="bg-gradient-to-br from-background via-background to-primary/5 -m-6 min-h-[calc(100vh-4rem)] p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">MaxxWatt</h1>
          </div>
          <p className="text-xl text-muted-foreground">Energy Storage System Dashboard</p>
          <p className="text-sm text-muted-foreground mt-2">Monitor your battery energy storage devices</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card
            className="bg-card/60 backdrop-blur-sm border-primary/20"
          >
            <CardHeader className="text-center">
              <Battery className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                View all energy storage devices and their current status
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-card/60 backdrop-blur-sm border-primary/20"
            onClick={() => navigate('/forecast')}
          >
            <CardHeader className="text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Anomaly detection and degradation forecasting
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-card/60 backdrop-blur-sm border-primary/20"
            onClick={() => navigate('/report')}
          >
            <CardHeader className="text-center">
              <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Generate detailed reports for your devices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Device Overview */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Available Devices</h2>
          </div>

          {devices.length === 0 ? (
            <Card className="bg-card/60 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Battery className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No devices available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => {
                const isOnline = deviceStatuses[device.device_id] || false;

                return (
                  <Card
                    key={device.device_id}
                    className="bg-card/60 backdrop-blur-sm border-primary/20"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg truncate">{device.device_id}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Circle
                            className={`h-3 w-3 ${
                              isOnline
                                ? 'text-success fill-success'
                                : 'text-destructive fill-destructive'
                            }`}
                          />
                          <Badge
                            variant={isOnline ? "default" : "secondary"}
                            className={isOnline ? "bg-success/20 text-success border-success/30" : ""}
                          >
                            {isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Streaming:</span>
                          <span className="font-medium">{isOnline ? 'Active' : 'Stopped'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={`font-medium ${isOnline ? 'text-success' : 'text-muted-foreground'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4 bg-primary hover:bg-primary/90"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/device/${device.device_id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>


        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Powered by MaxxWatt Energy Management System</p>
        </div>
      </div>
    </Layout>
  );
};

export default Overview;