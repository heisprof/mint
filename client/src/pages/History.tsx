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
  Tabs,
  TabsContent,
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
  
  const metricData = {};
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
  
  const metricChartData = Object.values(metricData).sort((a: any, b: any) => b.count - a.count);
  
  // Generate time series data by day
  const timeSeriesData = {};
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
  
  const timeChartData = Object.values(timeSeriesData).sort((a: any, b: any) => 
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="alerts">Alert History</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
            </TabsList>
          </Tabs>
          
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
        
        <TabsContent value="alerts" className="mt-0">
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
            <CardFooter className="flex justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {filteredAlerts?.length || 0} out of {alerts?.length || 0} total alerts
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="mt-0">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                View historical performance data for your databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartBarChart
                    data={[
                      { name: 'Week 1', cpu: 42, memory: 55, response: 85 },
                      { name: 'Week 2', cpu: 48, memory: 60, response: 78 },
                      { name: 'Week 3', cpu: 65, memory: 68, response: 90 },
                      { name: 'Week 4', cpu: 52, memory: 63, response: 82 },
                      { name: 'Week 5', cpu: 58, memory: 70, response: 85 },
                      { name: 'Week 6', cpu: 63, memory: 76, response: 88 },
                      { name: 'Week 7', cpu: 72, memory: 82, response: 94 },
                      { name: 'Week 8', cpu: 55, memory: 67, response: 86 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ 
                        value: 'Utilization (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: 'hsl(var(--muted-foreground))' }
                      }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="cpu" name="CPU Utilization" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="memory" name="Memory Usage" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="response" name="Response Time (rel.)" fill="hsl(var(--chart-3))" />
                  </RechartBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU Utilization History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartBarChart
                      data={Array.from({ length: 24 }, (_, i) => ({
                        hour: `${i}:00`,
                        value: Math.floor(Math.random() * 40) + 20
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="hsl(var(--muted-foreground))" 
                        interval={3}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value) => [`${value}%`, 'CPU']}
                      />
                      <Bar dataKey="value" name="CPU" fill="hsl(var(--chart-1))" />
                    </RechartBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartBarChart
                      data={Array.from({ length: 24 }, (_, i) => ({
                        hour: `${i}:00`,
                        value: Math.floor(Math.random() * 30) + 40
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="hsl(var(--muted-foreground))" 
                        interval={3}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value) => [`${value}%`, 'Memory']}
                      />
                      <Bar dataKey="value" name="Memory" fill="hsl(var(--chart-2))" />
                    </RechartBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="storage" className="mt-0">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Storage Trends</CardTitle>
              <CardDescription>
                View historical storage usage data for your databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartBarChart
                    data={Array.from({ length: 12 }, (_, i) => {
                      const month = new Date();
                      month.setMonth(month.getMonth() - 11 + i);
                      return {
                        month: format(month, 'MMM'),
                        data: 500 + i * 45 + Math.random() * 30,
                        index: 300 + i * 20 + Math.random() * 15,
                        logs: 200 + i * 10 + Math.random() * 10,
                      };
                    })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ 
                        value: 'Size (GB)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: 'hsl(var(--muted-foreground))' }
                      }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value) => [`${value.toFixed(1)} GB`]}
                    />
                    <Legend />
                    <Bar dataKey="data" name="Data Files" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="index" name="Index Files" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="logs" name="Log Files" fill="hsl(var(--chart-3))" />
                  </RechartBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Data Files', value: 850 },
                          { name: 'Index Files', value: 420 },
                          { name: 'Temp Files', value: 180 },
                          { name: 'Log Files', value: 250 },
                          { name: 'Archive Logs', value: 300 }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value) => [`${value} GB`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tablespace Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartBarChart
                      data={[
                        { name: 'System', thisMonth: 45, lastMonth: 42 },
                        { name: 'Users', thisMonth: 120, lastMonth: 95 },
                        { name: 'Data', thisMonth: 350, lastMonth: 280 },
                        { name: 'Index', thisMonth: 200, lastMonth: 180 },
                        { name: 'Temp', thisMonth: 80, lastMonth: 75 }
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        label={{ 
                          value: 'Size (GB)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: 'hsl(var(--muted-foreground))' }
                        }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value) => [`${value} GB`]}
                      />
                      <Legend />
                      <Bar dataKey="thisMonth" name="This Month" fill="hsl(var(--chart-1))" />
                      <Bar dataKey="lastMonth" name="Last Month" fill="hsl(var(--chart-2))" />
                    </RechartBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </div>
    </div>
  );
}
