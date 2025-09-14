import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import {
  ArrowLeft,
  FileText,
  Download,
  Activity,
  Battery,
  Zap,
  Thermometer,
  Shield,
  BarChart3,
  AlertTriangle,
  Clipboard,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

const Report = () => {
  const navigate = useNavigate();
  // Hardcoded device options, no API calls
  const devices = [
    { device_id: 'ZHPESS232A230002' },
    { device_id: 'ZHPESS232A230003' },
    { device_id: 'ZHPESS232A230007' },
  ];
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [reportType, setReportType] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportResult, setReportResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const reportTypes = [
    {
      value: 'performance',
      label: 'Performance Reports',
      description: 'Energy throughput, round-trip efficiency, cycle count, availability/uptime',
      icon: <Zap className="h-4 w-4" />
    },
    {
      value: 'degradation',
      label: 'Degradation & Health Reports',
      description: 'SOH trends, cell voltage/temperature spread, battery aging forecast',
      icon: <Battery className="h-4 w-4" />
    },
    {
      value: 'safety',
      label: 'Event & Safety Reports',
      description: 'Alarm/event logs, fire/smoke incidents, thermal stress events',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      value: 'regulatory',
      label: 'Regulations and Compliance Report',
      description: 'Grid compliance, insurance reports, ISO/IEC standards, EU/German regulations',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      value: 'financial',
      label: 'Financial Summary Report',
      description: 'Revenue analysis, operational costs, ROI calculations, energy arbitrage profits',
      icon: <DollarSign className="h-4 w-4" />
    }
  ];

  // Using native month input like forecast page

  const downloadPDF = () => {
    if (!reportResult) return;

    // Create a new window with the report content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportTypeLabel = reportTypes.find(t => t.value === reportResult.report_type)?.label || 'Report';
    const generatedDate = new Date(reportResult.generated_at).toLocaleDateString();
    const currentDate = new Date().toLocaleDateString();

    // Simple markdown to HTML conversion for PDF
    let htmlContent = reportResult.analysis_result.analysis;
    htmlContent = htmlContent.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    htmlContent = htmlContent.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    htmlContent = htmlContent.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    htmlContent = htmlContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    htmlContent = htmlContent.replace(/`([^`]+)`/g, '<code>$1</code>');
    htmlContent = htmlContent.replace(/^[\s]*-\s+(.*$)/gm, '<li>$1</li>');
    htmlContent = htmlContent.replace(/\n\n/g, '<br><br>');
    htmlContent = htmlContent.replace(/\n/g, '<br>');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MaxxWatt - ${reportTypeLabel}</title>
        <style>
          @page {
            margin: 1in;
            size: A4;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #666;
            max-width: none;
          }
          .header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #000000;
          }
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem;
          }
          .logo img {
            height: 60px;
            width: auto;
            max-width: 200px;
          }
          .company {
            font-size: 1.2rem;
            color: #888;
            margin-bottom: 1rem;
          }
          .report-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .report-info div {
            flex: 1;
          }
          .report-info label {
            font-weight: bold;
            color: #777;
            font-size: 0.9rem;
          }
          .report-info span {
            display: block;
            margin-top: 0.25rem;
          }
          h1 { color: #000000; font-size: 1.8rem; margin: 2rem 0 1rem 0; }
          h2 { color: #000000; font-size: 1.4rem; margin: 1.5rem 0 0.75rem 0; }
          h3 { color: #000000; font-size: 1.2rem; margin: 1.25rem 0 0.5rem 0; }
          p { margin: 0.75rem 0; }
          ul { margin: 1rem 0; padding-left: 2rem; }
          li { margin: 0.5rem 0; }
          code {
            background: #f1f3f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
          }
          strong { color: #000000; }
          .footer {
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 0.9rem;
            color: #888;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <img src="/logoweb-colored.png" alt="MaxxWatt Logo" />
          </div>
          <div class="company">Battery Energy Storage System Analysis</div>
        </div>

        <div class="report-info">
          <div>
            <label>Device ID:</label>
            <span>${reportResult.device_id}</span>
          </div>
          <div>
            <label>Report Type:</label>
            <span>${reportTypeLabel}</span>
          </div>
          <div>
            <label>Analysis Period:</label>
            <span>${reportResult.period || 'Optimal Selection'}</span>
          </div>
          <div>
            <label>Generated:</label>
            <span>${generatedDate}</span>
          </div>
        </div>

        <div class="content">
          ${htmlContent}
        </div>

        <div class="footer">
          <p><strong>MaxxWatt Energy Solutions</strong> | Generated on ${currentDate}</p>
          <p>This report contains ${reportResult.records_analyzed} data points analyzed using AI-powered insights</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait a moment for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const generateReport = async () => {
    if (!selectedDevice || !reportType) {
      setError('Please select both device and report type');
      return;
    }

    setIsLoading(true);
    setError('');
    setReportResult(null);

    try {
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

      // Step 2: Get last 100 rows for comprehensive report
      const dataToAnalyze = {
        ...bessData,
        data: bessData.data.slice(-100), // Last 100 rows for reports
        total_records: 100,
        batch_size: 100
      };

      console.log(`Using last 100 rows from ${bessData.data.length} total records for report`);

      // Use direct prompt type mapping
      const mappedPromptType = reportType;

      // Step 3: Send data to AI analysis
      console.log('Sending analysis request:', {
        records: dataToAnalyze.data?.length,
        prompt_type: mappedPromptType,
        model: 'gpt-4o-mini',
        original_report_type: reportType
      });

      const analysisResponse = await fetch(`${baseUrl}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json_data: dataToAnalyze,
          prompt_type: mappedPromptType,
          model: 'gpt-4o-mini',
          max_tokens: 3000 // More tokens for comprehensive reports
        })
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('Analysis API Error:', {
          status: analysisResponse.status,
          statusText: analysisResponse.statusText,
          body: errorText
        });

        // Check if it's a regulatory prompt type error and provide fallback
        if (errorText.includes('Invalid prompt type') && reportType === 'regulatory') {
          console.log('Regulatory prompt not available, using safety prompt as fallback');
          // Retry with safety prompt
          const fallbackResponse = await fetch(`${baseUrl}/ai/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              json_data: dataToAnalyze,
              prompt_type: 'safety',
              model: 'gpt-4o-mini',
              max_tokens: 3000
            })
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            // Add a note about the fallback
            fallbackData.analysis = `**Note: This analysis used a safety prompt as fallback. Please restart the server to use the proper Regulations and Compliance prompt.**\n\n${fallbackData.analysis}`;

            const result = {
              device_id: selectedDevice,
              report_type: reportType,
              period: selectedPeriod,
              records_analyzed: 100,
              generated_at: new Date().toISOString(),
              analysis_result: fallbackData
            };
            setReportResult(result);
            return;
          }
        }

        throw new Error(`AI Analysis failed: ${analysisResponse.status} - ${analysisResponse.statusText}. ${errorText}`);
      }

      const analysisData = await analysisResponse.json();

      // Format result to include report metadata
      const result = {
        device_id: selectedDevice,
        report_type: reportType,
        period: selectedPeriod,
        records_analyzed: 100,
        generated_at: new Date().toISOString(),
        analysis_result: analysisData
      };

      setReportResult(result);

    } catch (err) {
      console.error('Report generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during report generation');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Layout headerTitle="Report Generator">
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
              <FileText className="h-6 w-6 text-primary" />
              Report Generator
            </h1>
            <p className="text-sm text-muted-foreground">Generate detailed reports for your devices</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-card/60 backdrop-blur-sm border-primary/20 sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Report Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Device Selection */}
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

                {/* Report Type */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Report Type
                  </label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="bg-background border-primary/20">
                      <SelectValue placeholder="Choose report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon}
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Analysis Period */}
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

                {/* Generate Button */}
                <Button
                  onClick={generateReport}
                  disabled={!selectedDevice || !reportType || isLoading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {reportResult && (
                  <Button
                    onClick={() => {
                      setReportResult(null);
                      setError('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Report
                  </Button>
                )}

                {selectedDevice && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-foreground mb-2">Report Configuration</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Device: {selectedDevice}</div>
                      {reportType && <div>Type: {reportTypes.find(t => t.value === reportType)?.label}</div>}
                      {selectedPeriod && <div>Period: {new Date(selectedPeriod + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>}
                      <div>Data Sample: 100 records</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Report Results Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Report Results
                  </div>
                  {reportResult && (
                    <Button
                      onClick={downloadPDF}
                      variant="outline"
                      className="bg-background border-primary/20"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedDevice || !reportType ? (
                  <div className="text-center py-12">
                    <Clipboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Ready to Generate Report</h3>
                    <p className="text-muted-foreground">
                      Select a device and report type to begin AI-powered analysis
                    </p>
                  </div>
                ) : reportResult ? (
                  <div className="space-y-6">
                    {/* Report Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-primary/5 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Device</div>
                        <div className="font-medium">{reportResult.device_id}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Report Type</div>
                        <div className="font-medium">{reportTypes.find(t => t.value === reportResult.report_type)?.label}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Records</div>
                        <div className="font-medium">{reportResult.records_analyzed}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Generated</div>
                        <div className="font-medium">{new Date(reportResult.generated_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Report Content */}
                    <div className="bg-background border border-primary/20 rounded-lg p-6 min-h-[600px] max-h-[800px] overflow-y-auto">
                      <MarkdownRenderer
                        content={reportResult.analysis_result.analysis}
                        className="text-sm leading-relaxed"
                      />
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Generating Report</h3>
                    <p className="text-muted-foreground mb-4">
                      AI is analyzing {selectedDevice} data for {reportTypes.find(t => t.value === reportType)?.label.toLowerCase()}...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This may take 60-90 seconds for comprehensive reports
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="flex items-center justify-center mb-4">
                      {reportTypes.find(t => t.value === reportType)?.icon && (
                        <div className="h-12 w-12 text-primary flex items-center justify-center bg-primary/10 rounded-lg mr-3">
                          {React.cloneElement(reportTypes.find(t => t.value === reportType)!.icon, { className: 'h-6 w-6' })}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Ready to Generate</h3>
                    <p className="text-muted-foreground mb-4">
                      {reportTypes.find(t => t.value === reportType)?.label} for {selectedDevice}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click "Generate Report" to create comprehensive AI-powered analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Report;