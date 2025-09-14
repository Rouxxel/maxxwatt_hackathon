import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  Activity,
  Battery,
  Zap,
  Calendar,
  BarChart3,
  LineChart
} from 'lucide-react';

interface AnalysisResult {
  analysis: string;
  prompt_type: string;
  model_used: string;
  tokens_used?: number;
  success: boolean;
}

interface DeviceAnalysisResponse {
  device_id: string;
  records_analyzed: number;
  analysis_result: AnalysisResult;
}

const Forecast = () => {
  const navigate = useNavigate();
  // Hardcoded device options, no API calls
  const devices = [
    { device_id: 'ZHPESS232A230002' },
    { device_id: 'ZHPESS232A230003' },
    { device_id: 'ZHPESS232A230007' },
  ];

  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [forecastType, setForecastType] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<DeviceAnalysisResponse | null>(null);
  const [error, setError] = useState<string>('');

  // Using native month input like device page

  const runForecast = async () => {
    if (!selectedDevice || !forecastType) {
      setError('Please select both device and forecast type');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      // Map forecast types to prompt types
      const promptTypeMap: { [key: string]: string } = {
        'anomaly': 'anomaly',
        'degradation': 'degradation',
        'performance': 'performance'
      };

      const promptType = promptTypeMap[forecastType];
      const baseUrl = 'http://localhost:8002';

      // Step 1: Check localStorage for cached data
      const cacheKey = `bess_data_${selectedDevice}_${selectedPeriod || 'default'}`;
      let bessData = null;

      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        console.log('Using cached BESS data from localStorage');
        bessData = JSON.parse(cachedData);
      } else {
        console.log('Fetching fresh BESS data from API');
        // Fetch BESS data if not in cache
        const bessParams = new URLSearchParams({
          batch_size: '1000' // Fetch more data to cache
        });

        if (selectedPeriod) {
          bessParams.append('date', selectedPeriod);
        }

        const bessUrl = `${baseUrl}/bess/${selectedDevice}?${bessParams}`;
        const bessResponse = await fetch(bessUrl);

        if (!bessResponse.ok) {
          throw new Error(`Failed to fetch device data: ${bessResponse.status} - ${bessResponse.statusText}`);
        }

        bessData = await bessResponse.json();

        // Save to localStorage
        localStorage.setItem(cacheKey, JSON.stringify(bessData));
        console.log('BESS data cached to localStorage');
      }

      // Step 2: Get last 100 rows from the data
      const dataToAnalyze = {
        ...bessData,
        data: bessData.data.slice(-100), // Last 100 rows
        total_records: 100,
        batch_size: 100
      };

      console.log(`Using last 100 rows from ${bessData.data.length} total records`);

      // Step 3: Send data to AI analysis
      const analysisResponse = await fetch(`${baseUrl}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json_data: dataToAnalyze,
          prompt_type: promptType,
          model: 'gpt-4o-mini',
          max_tokens: 2000
        })
      });

      if (!analysisResponse.ok) {
        throw new Error(`AI Analysis failed: ${analysisResponse.status} - ${analysisResponse.statusText}`);
      }

      const analysisData = await analysisResponse.json();

      // Format result to match expected structure
      const result: DeviceAnalysisResponse = {
        device_id: selectedDevice,
        records_analyzed: 100,
        analysis_result: analysisData
      };

      setAnalysisResult(result);

    } catch (err) {
      console.error('Forecast error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Layout headerTitle="Forecast Analysis">
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              Forecast Analysis
            </h1>
            <p className="text-sm text-muted-foreground">Anomaly detection and degradation forecasting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-card/60 backdrop-blur-sm border-primary/20 sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Forecast Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Select Device
                  </label>
                  <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                    <SelectTrigger className="bg-background border-primary/20">
                      <SelectValue placeholder="Choose a device" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.device_id} value={device.device_id}>
                          {device.device_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Forecast Type
                  </label>
                  <Select value={forecastType} onValueChange={setForecastType}>
                    <SelectTrigger className="bg-background border-primary/20">
                      <SelectValue placeholder="Choose forecast type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anomaly">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          Anomaly Detection
                        </div>
                      </SelectItem>
                      <SelectItem value="degradation">
                        <div className="flex items-center gap-2">
                          <Battery className="h-4 w-4 text-destructive" />
                          Degradation Forecast
                        </div>
                      </SelectItem>
                      <SelectItem value="performance">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          Performance Analysis
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Analysis Period
                  </label>
                  <input
                    type="month"
                    value={selectedPeriod}
                    onChange={e => setSelectedPeriod(e.target.value)}
                    className="w-full p-2 border border-primary/20 rounded-md text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    style={{
                      colorScheme: 'dark'
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for optimal time period selection
                  </p>
                </div>

                <Button
                  onClick={runForecast}
                  disabled={!selectedDevice || !forecastType || isLoading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <LineChart className="h-4 w-4 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {analysisResult && (
                  <Button
                    onClick={() => {
                      setAnalysisResult(null);
                      setError('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Results
                  </Button>
                )}

                {selectedDevice && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-foreground mb-2">Analysis Configuration</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Device: {selectedDevice}</div>
                      {forecastType && <div>Type: {forecastType.charAt(0).toUpperCase() + forecastType.slice(1)}</div>}
                      {selectedPeriod && <div>Period: {new Date(selectedPeriod + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>}
                      <div>Data Limit: 100 records</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-card/60 backdrop-blur-sm border-primary/20">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="anomaly">Anomaly Detection</TabsTrigger>
                <TabsTrigger value="degradation">Degradation Forecast</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid gap-6">
                  <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Forecast Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
                          <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
                          <h3 className="font-medium">Anomaly Detection</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Identify unusual patterns and potential issues
                          </p>
                        </div>
                        <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                          <Battery className="h-8 w-8 text-destructive mx-auto mb-2" />
                          <h3 className="font-medium">Degradation Forecast</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Predict battery health decline over time
                          </p>
                        </div>
                        <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                          <h3 className="font-medium">Performance Prediction</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Forecast system performance metrics
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {!selectedDevice || !forecastType ? (
                    <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
                      <CardContent className="text-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Ready to Analyze</h3>
                        <p className="text-muted-foreground">
                          Select a device and forecast type to begin AI-powered analysis
                        </p>
                      </CardContent>
                    </Card>
                  ) : analysisResult ? (
                    <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <LineChart className="h-5 w-5 text-primary" />
                          Analysis Results
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Device: {analysisResult.device_id}</span>
                          <span>Records: {analysisResult.records_analyzed}</span>
                          <span>Model: {analysisResult.analysis_result.model_used}</span>
                          {analysisResult.analysis_result.tokens_used && (
                            <span>Tokens: {analysisResult.analysis_result.tokens_used}</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">
                              {forecastType.charAt(0).toUpperCase() + forecastType.slice(1)} Analysis Report
                            </h4>
                            <div className="bg-background border border-primary/20 rounded-lg p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
                              <MarkdownRenderer
                                content={analysisResult.analysis_result.analysis}
                                className="text-sm leading-relaxed"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : isLoading ? (
                    <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
                      <CardContent className="text-center py-12">
                        <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Analyzing Data</h3>
                        <p className="text-muted-foreground mb-4">
                          AI is analyzing {selectedDevice} data for {forecastType} insights...
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This may take 30-60 seconds depending on data complexity
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
                      <CardContent className="text-center py-12">
                        <LineChart className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Ready to Analyze</h3>
                        <p className="text-muted-foreground mb-4">
                          {forecastType.charAt(0).toUpperCase() + forecastType.slice(1)} analysis for {selectedDevice}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Click "Run Analysis" to start AI-powered analysis with OpenAI
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="anomaly">
                <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      Anomaly Detection Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult && forecastType === 'anomaly' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
                            <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
                            <h4 className="font-medium">Analysis Type</h4>
                            <p className="text-sm text-muted-foreground">Anomaly Detection</p>
                          </div>
                          <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                            <h4 className="font-medium">Records Analyzed</h4>
                            <p className="text-sm text-muted-foreground">{analysisResult.records_analyzed}</p>
                          </div>
                          <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                            <Activity className="h-8 w-8 text-success mx-auto mb-2" />
                            <h4 className="font-medium">AI Model</h4>
                            <p className="text-sm text-muted-foreground">{analysisResult.analysis_result.model_used}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-foreground mb-4">Anomaly Detection Report</h4>
                          <div className="bg-background border border-primary/20 rounded-lg p-6 max-h-[500px] overflow-y-auto">
                            <MarkdownRenderer
                              content={analysisResult.analysis_result.analysis}
                              className="text-sm leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-foreground mb-2">Anomaly Detection</h3>
                        <p className="text-muted-foreground">
                          Select "Anomaly Detection" as forecast type and run analysis to see results here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="degradation">
                <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Battery className="h-5 w-5 text-destructive" />
                      Degradation Forecast Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult && forecastType === 'degradation' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                            <Battery className="h-8 w-8 text-destructive mx-auto mb-2" />
                            <h4 className="font-medium">Analysis Type</h4>
                            <p className="text-sm text-muted-foreground">Degradation Forecast</p>
                          </div>
                          <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                            <h4 className="font-medium">Records Analyzed</h4>
                            <p className="text-sm text-muted-foreground">{analysisResult.records_analyzed}</p>
                          </div>
                          <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                            <Activity className="h-8 w-8 text-success mx-auto mb-2" />
                            <h4 className="font-medium">AI Model</h4>
                            <p className="text-sm text-muted-foreground">{analysisResult.analysis_result.model_used}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-foreground mb-4">Degradation Forecast Report</h4>
                          <div className="bg-background border border-primary/20 rounded-lg p-6 max-h-[500px] overflow-y-auto">
                            <MarkdownRenderer
                              content={analysisResult.analysis_result.analysis}
                              className="text-sm leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Battery className="h-16 w-16 text-destructive mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-foreground mb-2">Battery Degradation Forecast</h3>
                        <p className="text-muted-foreground">
                          Select "Degradation Forecast" as forecast type and run analysis to see results here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Forecast;