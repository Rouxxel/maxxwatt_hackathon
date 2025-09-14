import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Circle,
  Play,
  Square,
  Battery,
  Zap,
  Thermometer,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDeviceData } from '../hooks/useDeviceData';
import { useSSE } from '../hooks/useSSE';

interface MetricCardProps {
  title: string;
  value: string | number | null | undefined;
  unit?: string;
  icon?: React.ReactNode;
  status?: 'normal' | 'warning' | 'critical';
}

const MetricCard = ({ title, value, unit, icon, status = 'normal' }: MetricCardProps) => {
  const formatValue = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return '--';
    if (typeof val === 'number') return val.toFixed(2);
    return val;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'warning': return 'border-warning/30 bg-warning/5';
      case 'critical': return 'border-destructive/30 bg-destructive/5';
      default: return 'border-primary/20';
    }
  };

  return (
    <Card className={`bg-card/60 backdrop-blur-sm ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            {icon}
            {title}
          </span>
          {status !== 'normal' && (
            <AlertTriangle className={`h-4 w-4 ${
              status === 'warning' ? 'text-warning' : 'text-destructive'
            }`} />
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">
            {formatValue(value)}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};



const DeviceDetail = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const [isStreaming, setIsStreaming] = useState(false);
  const [date, setDate] = useState<string>("");
  const [interval, setInterval] = useState<string>("2");
  const [online, setOnline] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [hourlyChartPoints, setHourlyChartPoints] = useState<any[]>([]);
  const [chartRefreshKey, setChartRefreshKey] = useState(0);
  const [lastProcessedHour, setLastProcessedHour] = useState<string | null>(null);
  const [hourlyAggregation, setHourlyAggregation] = useState<Map<string, any>>(new Map());
  const [dataPointCount, setDataPointCount] = useState(0);

  // Simple device data state for display
  const [deviceData, setDeviceData] = useState<any>(null);
  const { data: realtimeData, logs, connected, start, stop } = useSSE(deviceId || '');

  // Chart data - include completed hourly points plus current hour in progress
  const socChartData = useMemo(() => {
    const data = [...hourlyChartPoints];

    // Add current hour in progress if we have data
    if (hourlyAggregation.size > 0 && lastProcessedHour) {
      const currentHourData = hourlyAggregation.get(lastProcessedHour);
      if (currentHourData) {
        const date = currentHourData.time;
        const dayMonth = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');

        const currentChartPoint = {
          time: `${dayMonth} ${hour}:${minute}`,
          soc: Math.round(currentHourData.avgSoc * 10) / 10,
          fullTime: currentHourData.time
        };

        // Only add if it's not already in the completed hourly points
        const alreadyExists = data.some(point => point.time === currentChartPoint.time);
        if (!alreadyExists) {
          data.push(currentChartPoint);
        }
      }
    }

    return data;
  }, [hourlyChartPoints, hourlyAggregation, lastProcessedHour, chartRefreshKey, realtimeData]);

  useEffect(() => {
    if (!deviceId) return;

    // Check if device is online and streaming from localStorage
    const isDeviceOnline = localStorage.getItem(`device_online_${deviceId}`) === 'true';
    const isDeviceStreaming = localStorage.getItem(`device_streaming_${deviceId}`) === 'true';
    const streamConfig = localStorage.getItem(`device_stream_config_${deviceId}`);

    setOnline(isDeviceOnline);

    // Restore previous chart data
    const savedChartData = localStorage.getItem(`device_chart_data_${deviceId}`);
    if (savedChartData) {
      try {
        const parsedData = JSON.parse(savedChartData);
        setChartData(parsedData);
      } catch (e) {
        console.warn('Failed to parse saved chart data');
      }
    }

    // Restore SOC chart points from localStorage
    const savedSocData = localStorage.getItem(`device_soc_chart_${deviceId}`);
    if (savedSocData) {
      try {
        const parsedSocData = JSON.parse(savedSocData);
        setHourlyChartPoints(parsedSocData);
      } catch (e) {
        console.warn('Failed to parse saved SOC chart data');
      }
    }

    // Initialize with placeholder data
    setDeviceData({
      device_id: deviceId,
      total_records: 0,
      batch_size: 0,
    });

    // Auto-resume streaming if it was active - only once per device
    if (isDeviceStreaming && streamConfig && !isStreaming) {
      try {
        const config = JSON.parse(streamConfig);
        setDate(config.date || '');
        setInterval(config.interval || '2');
        setIsStreaming(true); // Set this immediately to prevent multiple calls

        console.log('Auto-resuming stream for', deviceId);

        // Auto-resume streaming after a short delay to ensure state is set
        setTimeout(() => {
          let queryParams = `interval=${config.interval || '2'}`;
          if (config.date) {
            queryParams += `&date=${config.date}`;
          }
          start(deviceId, queryParams);
        }, 500);
      } catch (e) {
        console.warn('Failed to parse stream config');
      }
    }
  }, [deviceId]); // Remove 'start' from dependencies to prevent multiple calls

  // Update chart data when receiving realtime data and set device online
  useEffect(() => {
    if (realtimeData && realtimeData.bms_soc != null) {
      // Set device online when receiving actual stream data
      if (!online) {
        setOnline(true);
        localStorage.setItem(`device_online_${deviceId}`, 'true');
      }

      // Keep all raw data for other purposes
      setChartData(prev => [...prev, realtimeData].slice(-10000));

      // Use actual data timestamp for per-minute accumulation for cleaner chart
      const dataTimestamp = new Date(realtimeData.timestamp);
      const dataMinuteKey = `${dataTimestamp.getFullYear()}-${String(dataTimestamp.getMonth() + 1).padStart(2, '0')}-${String(dataTimestamp.getDate()).padStart(2, '0')}-${String(dataTimestamp.getHours()).padStart(2, '0')}-${String(dataTimestamp.getMinutes()).padStart(2, '0')}`;

      // Update per-minute aggregation for clean chart
      setHourlyAggregation(prevAgg => {
        const newAgg = new Map(prevAgg);
        if (!newAgg.has(dataMinuteKey)) {
          newAgg.set(dataMinuteKey, {
            time: dataTimestamp,
            sum: parseFloat(realtimeData.bms_soc),
            count: 1,
            avgSoc: parseFloat(realtimeData.bms_soc)
          });
        } else {
          const minData = newAgg.get(dataMinuteKey)!;
          minData.sum += parseFloat(realtimeData.bms_soc);
          minData.count += 1;
          minData.avgSoc = minData.sum / minData.count;
        }
        return newAgg;
      });

      // When we complete a minute, add the completed minute to chart points
      if (lastProcessedHour !== null && dataMinuteKey !== lastProcessedHour) {
        const completedMinuteData = hourlyAggregation.get(lastProcessedHour!);
        if (completedMinuteData) {
          const date = completedMinuteData.time;
          const dayMonth = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
          const hour = String(date.getHours()).padStart(2, '0');
          const minute = String(date.getMinutes()).padStart(2, '0');
          const chartPoint = {
            time: `${dayMonth} ${hour}:${minute}`,
            soc: Math.round(completedMinuteData.avgSoc * 10) / 10,
            fullTime: completedMinuteData.time
          };
          setHourlyChartPoints(prevPoints => {
            const newPoints = [...prevPoints, chartPoint];
            // Persist SOC chart data to localStorage with dedicated key
            localStorage.setItem(`device_soc_chart_${deviceId}`, JSON.stringify(newPoints.slice(-24 * 60))); // 24 hours * 60 minutes
            return newPoints.slice(-24 * 60); // Keep last 24 hours of minute intervals
          });
        }
        setChartRefreshKey(prevKey => prevKey + 1);
      }

      // Update the last processed minute
      setLastProcessedHour(dataMinuteKey);

      // Force chart refresh on every new data point for real-time updates
      setChartRefreshKey(prevKey => prevKey + 1);
    }
  }, [realtimeData, online, deviceId, lastProcessedHour, hourlyAggregation]);

  const handleStartStream = () => {
    if (!deviceId || !interval) return;

    // Reset chart refresh state when starting new stream (but keep historical chart points)
    setChartRefreshKey(0);
    setLastProcessedHour(null);
    // Don't clear hourly chart points - preserve historical data
    setHourlyAggregation(new Map());
    setDataPointCount(0);

    // Build query parameters
    let queryParams = `interval=${interval}`;
    if (date) {
      queryParams += `&date=${date}`;
    }

    // Start streaming with device ID and query parameters
    start(deviceId, queryParams);
    setIsStreaming(true);

    // Save streaming state and configuration to localStorage
    localStorage.setItem(`device_streaming_${deviceId}`, 'true');
    localStorage.setItem(`device_stream_config_${deviceId}`, JSON.stringify({
      interval,
      date,
      timestamp: Date.now()
    }));
    // Don't set online=true here - wait for actual data
  };

  const handleStopStream = () => {
    stop();
    setIsStreaming(false);
    setOnline(false);

    // Reset chart refresh state but preserve historical data
    setChartRefreshKey(0);
    setLastProcessedHour(null);
    // Don't clear hourly chart points - preserve historical SOC data
    setHourlyAggregation(new Map());
    setDataPointCount(0);

    // Clear streaming status from localStorage but keep chart data
    localStorage.removeItem(`device_online_${deviceId}`);
    localStorage.removeItem(`device_streaming_${deviceId}`);
    // Don't remove chart data - preserve it for future viewing
    // localStorage.removeItem(`device_chart_data_${deviceId}`);
    localStorage.removeItem(`device_stream_config_${deviceId}`);

    // Clear chart data in component state as well
    setChartData([]);
  };

  const currentData = realtimeData;

  const headerExtra = (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Circle
          className={`h-3 w-3 ${
            online ? 'text-success fill-success' : 'text-destructive fill-destructive'
          }`}
        />
        <Badge
          variant={online ? "default" : "secondary"}
          className={online ? "bg-success/20 text-success border-success/30" : "bg-muted text-foreground border-border"}
        >
          <span className="text-foreground">{online ? 'Online' : 'Offline'}</span>
        </Badge>
      </div>

      {isStreaming ? (
        <Button
          onClick={handleStopStream}
          variant="outline"
          className="bg-background/60 backdrop-blur-sm border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <Square className="h-4 w-4 mr-2" />
          Stop Stream
        </Button>
      ) : (
        <Button
          onClick={handleStartStream}
          className="bg-primary hover:bg-primary/90"
          disabled={!interval}
        >
          <Play className="h-4 w-4 mr-2" />
          Start Stream
        </Button>
      )}
    </div>
  );

  if (!deviceId) {
    return (
      <Layout headerTitle="Device not found">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Device not found</h1>
            <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
              Back to Overview
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      headerTitle={`Device: ${deviceId}`}
      headerExtra={headerExtra}
      selectedDevice={deviceId}
    >
      <div className="bg-gradient-to-br from-background via-background to-primary/5 -m-6 min-h-[calc(100vh-4rem)] p-6">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            className="bg-background/60 backdrop-blur-sm border-primary/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{deviceId}</h1>
            <p className="text-sm text-muted-foreground">Battery Energy Storage System</p>
          </div>
        </div>

        {/* Stream Configuration */}
        <div className="flex flex-wrap items-end gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">Month (optional)</label>
            <input
              type="month"
              className="border rounded px-2 py-1 text-black bg-white"
              value={date}
              onChange={e => setDate(e.target.value)}
              placeholder="Leave empty for current data"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Interval (seconds)</label>
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              className="border rounded px-2 py-1 text-black bg-white"
              value={interval}
              onChange={e => setInterval(e.target.value)}
              required
              placeholder="e.g. 2"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Configure stream settings above, then click "Start Stream" in the header</p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card/60 backdrop-blur-sm border-primary/20">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bms">Battery Management</TabsTrigger>
            <TabsTrigger value="pcs">Power Conversion</TabsTrigger>
            <TabsTrigger value="auxiliary">Auxiliary & Thermal</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="State of Charge"
                value={currentData?.bms_soc}
                unit="%"
                icon={<Battery className="h-4 w-4" />}
                status={currentData?.bms_soc && currentData.bms_soc < 20 ? 'warning' : 'normal'}
              />
              <MetricCard
                title="State of Health"
                value={currentData?.bms_soh}
                unit="%"
                icon={<Activity className="h-4 w-4" />}
              />
              <MetricCard
                title="Pack Voltage"
                value={currentData?.bms_voltage}
                unit="V"
                icon={<Zap className="h-4 w-4" />}
              />
              <MetricCard
                title="Pack Current"
                value={currentData?.bms_current}
                unit="A"
                icon={<Zap className="h-4 w-4" />}
              />
            </div>

            {/* SOC Chart */}
            <Card className="bg-card/60 backdrop-blur-sm border-primary/20 mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Battery className="h-5 w-5 text-primary" />
                    State of Charge Over Time
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHourlyChartPoints([]);
                      localStorage.removeItem(`device_soc_chart_${deviceId}`);
                    }}
                    className="text-xs"
                  >
                    Clear Data
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={socChartData} key={`soc-chart-${chartRefreshKey}`}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="time"
                        stroke="#6b7280"
                        fontSize={11}
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                        tickFormatter={(value) => {
                          // Show only time for cleaner display
                          const parts = value.split(' ');
                          return parts.length > 1 ? parts[1] : value;
                        }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        domain={[0, 100]}
                        label={{ value: 'SOC (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          color: '#f9fafb'
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'SOC']}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="soc"
                        stroke="#BEEEC1"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, stroke: '#BEEEC1', strokeWidth: 2, fill: '#BEEEC1' }}
                        connectNulls={true}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animationDuration={300}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {socChartData.length === 0 && (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Battery className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No SOC data available</p>
                      <p className="text-sm">Start streaming to see real-time SOC changes</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Data Display */}
            {currentData && (
              <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Live Data Stream
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    Last Update: {currentData.timestamp ? new Date(currentData.timestamp).toLocaleString() : 'No data'}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    {Object.entries(currentData).map(([key, value]) => {
                      if (
                        key === 'timestamp' ||
                        value === null ||
                        value === undefined ||
                        typeof value === 'object' ||
                        Array.isArray(value)
                      ) {
                        return null;
                      }
                      return (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-mono">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bms">
            {/* SOC Chart moved to Overview */}
            {/* BMS Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                title="Cell Average Voltage"
                value={currentData?.bms_cell_ave_v}
                unit="V"
                icon={<Battery className="h-4 w-4" />}
              />
              <MetricCard
                title="Cell Average Temperature"
                value={currentData?.bms_cell_ave_t}
                unit="°C"
                icon={<Thermometer className="h-4 w-4" />}
                status={currentData?.bms_cell_ave_t && currentData.bms_cell_ave_t > 45 ? 'warning' : 'normal'}
              />
              <MetricCard
                title="Cell Voltage Difference"
                value={currentData?.bms_cell_v_diff}
                unit="mV"
                icon={<Battery className="h-4 w-4" />}
              />
              <MetricCard
                title="Cell Temperature Difference"
                value={currentData?.bms_cell_t_diff}
                unit="°C"
                icon={<Thermometer className="h-4 w-4" />}
              />
              <MetricCard
                title="Max Cell Voltage"
                value={currentData?.bms_cell_max_v}
                unit="V"
                icon={<Battery className="h-4 w-4" />}
              />
              <MetricCard
                title="Min Cell Voltage"
                value={currentData?.bms_cell_min_v}
                unit="V"
                icon={<Battery className="h-4 w-4" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="pcs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Power Output */}
              <MetricCard
                title="Apparent Power"
                value={currentData?.pcs_apparent_power}
                unit="kW"
                icon={<Zap className="h-4 w-4" />}
              />

              {/* DC Side Monitoring */}
              <MetricCard
                title="DC Voltage"
                value={currentData?.pcs_dc_voltage}
                unit="V"
                icon={<Zap className="h-4 w-4" />}
              />
              <MetricCard
                title="DC Current"
                value={currentData?.pcs_dc_current}
                unit="A"
                icon={<Zap className="h-4 w-4" />}
              />

              {/* AC Side Monitoring - All 3 Phases */}
              <MetricCard
                title="AC Current (Phase A)"
                value={currentData?.pcs_ac_current_a}
                unit="A"
                icon={<Zap className="h-4 w-4" />}
              />
              <MetricCard
                title="AC Current (Phase B)"
                value={currentData?.pcs_ac_current_b}
                unit="A"
                icon={<Zap className="h-4 w-4" />}
              />
              <MetricCard
                title="AC Current (Phase C)"
                value={currentData?.pcs_ac_current_c}
                unit="A"
                icon={<Zap className="h-4 w-4" />}
              />
              <MetricCard
                title="AC Voltage (AB)"
                value={currentData?.pcs_ac_voltage_ab}
                unit="V"
                icon={<Zap className="h-4 w-4" />}
              />
              <MetricCard
                title="AC Voltage (BC)"
                value={currentData?.pcs_ac_voltage_bc}
                unit="V"
                icon={<Zap className="h-4 w-4" />}
              />
              <MetricCard
                title="AC Voltage (CA)"
                value={currentData?.pcs_ac_voltage_ca}
                unit="V"
                icon={<Zap className="h-4 w-4" />}
              />

              {/* Thermal Monitoring */}
              <MetricCard
                title="IGBT Temperature"
                value={currentData?.pcs_temp_igbt}
                unit="°C"
                icon={<Thermometer className="h-4 w-4" />}
                status={currentData?.pcs_temp_igbt && currentData.pcs_temp_igbt > 80 ? 'critical' : 'normal'}
              />
              <MetricCard
                title="Environment Temperature"
                value={currentData?.pcs_temp_environment}
                unit="°C"
                icon={<Thermometer className="h-4 w-4" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="auxiliary">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* HVAC & Thermal Management */}
              <MetricCard
                title="Outside Temperature"
                value={currentData?.aux_outside_temp}
                unit="°C"
                icon={<Thermometer className="h-4 w-4" />}
                status={currentData?.aux_outside_temp && currentData.aux_outside_temp > 40 ? 'warning' : 'normal'}
              />
              <MetricCard
                title="Coolant Temperature"
                value={currentData?.aux_outwater_temp}
                unit="°C"
                icon={<Thermometer className="h-4 w-4" />}
              />
              <MetricCard
                title="Return Water Pressure"
                value={currentData?.aux_return_water_pressure}
                unit="bar"
                icon={<Activity className="h-4 w-4" />}
                status={currentData?.aux_return_water_pressure && currentData.aux_return_water_pressure < 1.5 ? 'warning' : 'normal'}
              />

              {/* Auxiliary Power */}
              <MetricCard
                title="Auxiliary Power"
                value={currentData?.aux_power_apparent}
                unit="kW"
                icon={<Zap className="h-4 w-4" />}
              />

              {/* Environmental Sensors */}
              <MetricCard
                title="Humidity"
                value={currentData?.env_humidity}
                unit="%"
                icon={<Activity className="h-4 w-4" />}
                status={currentData?.env_humidity && (currentData.env_humidity > 85 || currentData.env_humidity < 20) ? 'warning' : 'normal'}
              />
              <MetricCard
                title="Ambient Temperature"
                value={currentData?.env_temperature}
                unit="°C"
                icon={<Thermometer className="h-4 w-4" />}
              />

              {/* Essential Safety */}
              <MetricCard
                title="Smoke Detector"
                value={currentData?.safety_smoke_flag ? "ALERT" : "Normal"}
                unit=""
                icon={<AlertTriangle className="h-4 w-4" />}
                status={currentData?.safety_smoke_flag ? 'critical' : 'normal'}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Logs Section */}
        {logs.length > 0 && (
          <Card className="mt-8 bg-card/60 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-xs space-y-1">
                {logs.slice(-20).map((log, index) => (
                  <div key={index} className="text-muted-foreground">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DeviceDetail;