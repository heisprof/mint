import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useAlerts } from '@/hooks/useAlerts';
import { useDatabases } from '@/hooks/useDatabases';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertOctagon, 
  AlertTriangle,
  Download,
  Calendar,
  Filter,
  Search,
  BarChart
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PieChart, Pie, Cell, BarChart as RechartBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export default function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('alerts');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const { alerts } = useAlerts();
  const { databases } = useDatabases();
  
  // Filter alerts based on filters
  const filteredAlerts = alerts?.filter(alert => {
    // Database filter
    if (selectedDatabase !== 'all' && alert.databaseId !== parseInt(selectedDatabase)) return false;
    
    // Severity filter
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
    
    // Date range filter
    if (dateRange?.from && new Date(alert.createdAt) < dateRange.from) return false;
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(alert.createdAt) > toDate) return false;
    }
    
    // Search filter
    if (searchQuery && !alert.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });
  
  // Generate data for charts
  const severityData = [
    { name: 'Critical', value: alerts?.filter(a => a.severity === 'critical').length || 0 },
    { name: 'Warning', value: alerts?.filter(a => a.severity === 'warning').length || 0 },
  ];
  
  const databaseAlertCounts = databases?.map(db => {
    const dbAlerts = alerts?.filter(a => a.databaseId === db.id) || [];
    return {
      name: db.name,
      critical: dbAlerts.filter(a => a.severity === 'critical').length,
      warning: dbAlerts.filter(a => a.severity === 'warning').length,
      total: dbAlerts.length
    };
  }) || [];
  
  // Sort databases by total alerts, descending
  databaseAlertCounts.sort((a, b) => b.total - a.total);
  
  const metricData: Record<string, { name: string; count: number }> = {};
  alerts?.forEach(alert => {
    // Normalize metric name
    const metricName = alert.metricName.replace(/_/g, ' ').replace(/tablespace_.+/, 'tablespace').replace(/disk_.+/, 'disk');
    
    if (!metricData[metricName]) {
      metricData[metricName] = { 
        name: metricName.charAt(0).toUpperCase() + metricName.slice(1), 
        count: 0 
      };
    }
    metricData[metricName].count++;
  });
  
  const metricChartData = Object.values(metricData).sort((a, b) => b.count - a.count);
  
  // Generate time series data by day
  const timeSeriesData: Record<string, { date: string; critical: number; warning: number }> = {};
  alerts?.forEach(alert => {
    const date = format(new Date(alert.createdAt), 'yyyy-MM-dd');
    
    if (!timeSeriesData[date]) {
      timeSeriesData[date] = {
        date,
        critical: 0,
        warning: 0
      };
    }
    
    if (alert.severity === 'critical') {
      timeSeriesData[date].critical++;
    } else if (alert.severity === 'warning') {
      timeSeriesData[date].warning++;
    }
  });
  
  const timeChartData = Object.values(timeSeriesData).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Colors for charts
  const COLORS = ['#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'];
  
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Historical Data" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">History & Reports</h1>
            <p className="text-muted-foreground mt-1">View historical data and generate reports</p>
          </div>
          <div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <button 
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'alerts' ? 'bg-background text-foreground shadow-sm' : ''}`}
                onClick={() => setActiveTab('alerts')}
              >
                Alert History
              </button>
              <button 
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'performance' ? 'bg-background text-foreground shadow-sm' : ''}`}
                onClick={() => setActiveTab('performance')}
              >
                Performance
              </button>
              <button 
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'storage' ? 'bg-background text-foreground shadow-sm' : ''}`}
                onClick={() => setActiveTab('storage')}
              >
                Storage
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
            />
            
            <Select
              value={selectedDatabase}
              onValueChange={setSelectedDatabase}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Databases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Databases</SelectItem>
                {databases?.map(db => (
                  <SelectItem key={db.id} value={db.id.toString()}>
                    {db.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {activeTab === 'alerts' && (
              <Select
                value={selectedSeverity}
                onValueChange={setSelectedSeverity}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-10 w-[180px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {activeTab === 'alerts' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Alerts by Severity</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[200px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--error))' : 'hsl(var(--warning))'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Alerts by Metric</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartBarChart
                        layout="vertical"
                        data={metricChartData.slice(0, 5)}
                        margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" width={80} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </RechartBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-1 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Alert Trends Over Time</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartBarChart
                        data={timeChartData.slice(-15)} // Last 15 days
                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))" 
                          tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--foreground))'
                          }}
                          formatter={(value, name) => [value, name === 'critical' ? 'Critical' : 'Warning']}
                          labelFormatter={(label) => format(new Date(label), 'PP')}
                        />
                        <Legend />
                        <Bar dataKey="critical" name="Critical" fill="hsl(var(--error))" />
                        <Bar dataKey="warning" name="Warning" fill="hsl(var(--warning))" />
                      </RechartBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Alert History</CardTitle>
                <CardDescription>
                  {filteredAlerts?.length || 0} alerts matching your current filters
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Severity</th>
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Database</th>
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Metric</th>
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Value</th>
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Message</th>
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Created</th>
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Ticket ID</th>
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlerts?.length ? (
                        filteredAlerts.map(alert => {
                          const database = databases?.find(db => db.id === alert.databaseId);
                          return (
                            <tr key={alert.id} className="border-b border-border hover:bg-muted/20">
                              <td className="p-4">
                                <div className="flex items-center">
                                  {alert.severity === 'critical' 
                                    ? <AlertOctagon className="h-4 w-4 text-error mr-2" /> 
                                    : <AlertTriangle className="h-4 w-4 text-warning mr-2" />
                                  }
                                  <span className="capitalize">{alert.severity}</span>
                                </div>
                              </td>
                              <td className="p-4">{database?.name || 'Unknown'}</td>
                              <td className="p-4 capitalize">{alert.metricName.replace(/_/g, ' ')}</td>
                              <td className="p-4">{alert.metricValue !== null ? `${alert.metricValue}%` : 'N/A'}</td>
                              <td className="p-4 max-w-xs truncate" title={alert.message}>{alert.message}</td>
                              <td className="p-4">{new Date(alert.createdAt).toLocaleString()}</td>
                              <td className="p-4">{alert.ticketId || 'None'}</td>
                              <td className="p-4">
                                {alert.acknowledgedAt 
                                  ? <span className="text-success">Acknowledged</span> 
                                  : <span className="text-warning">Active</span>
                                }
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-4 text-center">No alerts found matching the current filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredAlerts?.length || 0} of {alerts?.length || 0} alerts
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
        
        {activeTab === 'performance' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Historical performance metrics for selected database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <BarChart className="h-20 w-20 mx-auto mb-4 text-muted-foreground/80" />
                <h3 className="text-lg font-medium">Performance Data Unavailable</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                  Performance historical data is not yet available. This feature will be implemented
                  in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'storage' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Storage Trends</CardTitle>
              <CardDescription>
                Historical storage metrics for selected database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <BarChart className="h-20 w-20 mx-auto mb-4 text-muted-foreground/80" />
                <h3 className="text-lg font-medium">Storage History Unavailable</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                  Storage historical data is not yet available. This feature will be implemented
                  in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}