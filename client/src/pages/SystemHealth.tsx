import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocation } from 'wouter';
import { useDatabases } from '@/hooks/useDatabases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Database, CpuIcon, HardDrive, Clock, Users } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import ProgressBar from '@/components/common/ProgressBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for charts
const generateTimeSeriesData = (hours = 24, baseValue = 50, variance = 20) => {
  return Array.from({ length: hours }, (_, i) => {
    const time = new Date();
    time.setHours(time.getHours() - (hours - i));
    
    return {
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: Math.max(0, Math.min(100, baseValue + (Math.random() * variance * 2) - variance))
    };
  });
};

interface MetricChartProps {
  title: string;
  data: Array<{ time: string; value: number }>;
  color: string;
  yAxisLabel?: string;
  threshold?: number;
}

function MetricChart({ title, data, color, yAxisLabel = 'Value (%)', threshold }: MetricChartProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))" 
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                tickLine={false}
                label={{ 
                  value: yAxisLabel, 
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
              {threshold && (
                <Line
                  type="monotone"
                  dataKey={() => threshold}
                  stroke="hsl(var(--error))"
                  strokeDasharray="5 5"
                  name="Threshold"
                  dot={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                activeDot={{ r: 8 }}
                name="Current"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SystemHealth() {
  const [, setLocation] = useLocation();
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { databasesWithMetrics } = useDatabases();
  
  useEffect(() => {
    // Check URL for database parameter
    const urlParams = new URLSearchParams(window.location.search);
    const dbId = urlParams.get('database');
    
    if (dbId && databasesWithMetrics) {
      const exists = databasesWithMetrics.some(db => db.id.toString() === dbId);
      if (exists) {
        setSelectedDatabase(dbId);
      }
    } else if (databasesWithMetrics && databasesWithMetrics.length > 0) {
      // Set first database as default
      setSelectedDatabase(databasesWithMetrics[0].id.toString());
    }
  }, [databasesWithMetrics]);
  
  // Get current database details
  const currentDatabase = databasesWithMetrics?.find(db => db.id.toString() === selectedDatabase);
  
  // Mock time series data for charts
  const cpuTimeData = generateTimeSeriesData(24, currentDatabase?.cpu || 50, 15);
  const memoryTimeData = generateTimeSeriesData(24, currentDatabase?.memory || 50, 10);
  const diskTimeData = generateTimeSeriesData(24, currentDatabase?.diskUsage || 50, 5);
  const responseTimeData = generateTimeSeriesData(24, 50, 30).map(item => ({
    ...item,
    value: item.value * 3 // Scale to milliseconds (0-300ms)
  }));
  const connectionsTimeData = generateTimeSeriesData(24, 
    currentDatabase ? (currentDatabase.connections.active / currentDatabase.connections.max * 100) : 50, 
    20
  );
  
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="System Health Monitoring" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">System Health</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="mr-2 text-sm font-medium">Database:</span>
              <Select
                value={selectedDatabase}
                onValueChange={setSelectedDatabase}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select a database" />
                </SelectTrigger>
                <SelectContent>
                  {databasesWithMetrics?.map(db => (
                    <SelectItem key={db.id} value={db.id.toString()}>
                      {db.name} ({db.host})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setLocation('/databases')}>
              <Database className="h-4 w-4 mr-2" />
              Manage Databases
            </Button>
          </div>
        </div>
        
        {currentDatabase ? (
          <>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center mb-4 md:mb-0">
                    <Database className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <h2 className="text-xl font-bold">{currentDatabase.name}</h2>
                      <p className="text-sm text-muted-foreground">{currentDatabase.host}:{currentDatabase.port}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Status</div>
                      <StatusBadge status={currentDatabase.status as any} className="mt-1" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">CPU</div>
                      <div className="font-medium">{currentDatabase.cpu}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Memory</div>
                      <div className="font-medium">{currentDatabase.memory}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Disk</div>
                      <div className="font-medium">{currentDatabase.diskUsage}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Connections</div>
                      <div className="font-medium">
                        {currentDatabase.connections.active}/{currentDatabase.connections.max}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="storage">Storage</TabsTrigger>
                <TabsTrigger value="connections">Connections</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">System Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <CpuIcon className="h-4 w-4 mr-2 text-primary" />
                              <span className="font-medium">CPU Utilization</span>
                            </div>
                            <span className={`text-sm ${currentDatabase.cpu >= 85 ? 'text-error' : currentDatabase.cpu >= 70 ? 'text-warning' : ''}`}>
                              {currentDatabase.cpu}%
                            </span>
                          </div>
                          <ProgressBar 
                            value={currentDatabase.cpu} 
                            size="md"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium">Memory Usage</span>
                            </div>
                            <span className={`text-sm ${currentDatabase.memory >= 85 ? 'text-error' : currentDatabase.memory >= 70 ? 'text-warning' : ''}`}>
                              {currentDatabase.memory}%
                            </span>
                          </div>
                          <ProgressBar 
                            value={currentDatabase.memory} 
                            size="md"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <HardDrive className="h-4 w-4 mr-2 text-primary" />
                              <span className="font-medium">Disk Usage</span>
                            </div>
                            <span className={`text-sm ${currentDatabase.diskUsage >= 90 ? 'text-error' : currentDatabase.diskUsage >= 75 ? 'text-warning' : ''}`}>
                              {currentDatabase.diskUsage}%
                            </span>
                          </div>
                          <ProgressBar 
                            value={currentDatabase.diskUsage} 
                            size="md"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-primary" />
                              <span className="font-medium">Response Time</span>
                            </div>
                            <span className="text-sm">
                              {currentDatabase.connectionTime || 'N/A'} ms
                            </span>
                          </div>
                          {currentDatabase.connectionTime && (
                            <ProgressBar 
                              value={Math.min(currentDatabase.connectionTime / 3, 100)} 
                              size="md"
                            />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-primary" />
                              <span className="font-medium">Active Connections</span>
                            </div>
                            <span className="text-sm">
                              {currentDatabase.connections.active} / {currentDatabase.connections.max}
                            </span>
                          </div>
                          <ProgressBar 
                            value={currentDatabase.connections.active} 
                            max={currentDatabase.connections.max} 
                            size="md"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[375px] overflow-auto">
                        <ul className="divide-y divide-border">
                          {currentDatabase.alerts?.map((alert, index) => (
                            <li key={index} className="p-4 hover:bg-muted/30">
                              <div className="flex items-start">
                                <div className={`flex-shrink-0 rounded-full p-1 ${alert.severity === 'critical' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'}`}>
                                  {alert.severity === 'critical' ? '🔴' : '⚠️'}
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">{alert.metricName}</p>
                                    <p className="text-xs text-muted-foreground">{alert.timeAgo}</p>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                          {(!currentDatabase.alerts || currentDatabase.alerts.length === 0) && (
                            <li className="p-4 text-center text-muted-foreground text-sm">
                              No recent activity recorded
                            </li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="performance" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MetricChart 
                    title="CPU Utilization"
                    data={cpuTimeData}
                    color="hsl(var(--chart-1))"
                    threshold={85}
                  />
                  
                  <MetricChart 
                    title="Memory Usage"
                    data={memoryTimeData}
                    color="hsl(var(--chart-2))"
                    threshold={80}
                  />
                  
                  <MetricChart 
                    title="Response Time"
                    data={responseTimeData}
                    color="hsl(var(--chart-3))"
                    yAxisLabel="Time (ms)"
                    threshold={200}
                  />
                  
                  <MetricChart 
                    title="Query Performance"
                    data={generateTimeSeriesData(24, 40, 20)}
                    color="hsl(var(--chart-4))"
                    yAxisLabel="Execution Time (ms)"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="storage" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MetricChart 
                    title="Disk Usage"
                    data={diskTimeData}
                    color="hsl(var(--chart-5))"
                    threshold={90}
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tablespace Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">SYSTEM</span>
                            <span className="text-sm">78%</span>
                          </div>
                          <ProgressBar value={78} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">SYSAUX</span>
                            <span className="text-sm">63%</span>
                          </div>
                          <ProgressBar value={63} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">USERS</span>
                            <span className="text-sm text-warning">82%</span>
                          </div>
                          <ProgressBar value={82} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">DATA</span>
                            <span className="text-sm text-error">91%</span>
                          </div>
                          <ProgressBar value={91} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">INDEX</span>
                            <span className="text-sm">55%</span>
                          </div>
                          <ProgressBar value={55} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">TEMP</span>
                            <span className="text-sm">32%</span>
                          </div>
                          <ProgressBar value={32} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Filesystem Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">/oracle/data</span>
                            <span className="text-sm">67%</span>
                          </div>
                          <ProgressBar value={67} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">/oracle/arch</span>
                            <span className="text-sm text-warning">78%</span>
                          </div>
                          <ProgressBar value={78} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">/oracle/backup</span>
                            <span className="text-sm">45%</span>
                          </div>
                          <ProgressBar value={45} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">/oracle/redo</span>
                            <span className="text-sm">29%</span>
                          </div>
                          <ProgressBar value={29} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Storage Growth Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={Array.from({ length: 30 }, (_, i) => ({
                              day: `Day ${i + 1}`,
                              data: Math.floor(500 + (i * 15) + Math.random() * 50),
                              index: Math.floor(300 + (i * 5) + Math.random() * 20),
                              temp: Math.floor(100 + (i * 1) + Math.random() * 10),
                            }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="day"
                              stroke="hsl(var(--muted-foreground))" 
                              tickFormatter={(value) => value.replace('Day ', '')}
                              interval={6}
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
                            <Line type="monotone" dataKey="data" name="Data" stroke="hsl(var(--chart-1))" />
                            <Line type="monotone" dataKey="index" name="Index" stroke="hsl(var(--chart-2))" />
                            <Line type="monotone" dataKey="temp" name="Temp" stroke="hsl(var(--chart-3))" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="connections" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MetricChart 
                    title="Active Connections"
                    data={connectionsTimeData}
                    color="hsl(var(--chart-1))"
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Connection Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={Array.from({ length: 24 }, (_, i) => {
                              const hour = i;
                              return {
                                hour: `${hour}:00`,
                                web: Math.floor(Math.random() * 30) + 10,
                                app: Math.floor(Math.random() * 40) + 20,
                                batch: Math.floor(Math.random() * 15) + 5,
                              };
                            })}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="hour" 
                              stroke="hsl(var(--muted-foreground))" 
                              interval={3}
                            />
                            <YAxis 
                              stroke="hsl(var(--muted-foreground))"
                              label={{ 
                                value: 'Connections', 
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
                            <Line type="monotone" dataKey="web" name="Web" stroke="hsl(var(--chart-1))" />
                            <Line type="monotone" dataKey="app" name="Application" stroke="hsl(var(--chart-2))" />
                            <Line type="monotone" dataKey="batch" name="Batch Process" stroke="hsl(var(--chart-3))" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Session Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">Active</span>
                            <span className="text-sm">{currentDatabase.connections.active}</span>
                          </div>
                          <ProgressBar 
                            value={currentDatabase.connections.active} 
                            max={currentDatabase.connections.max} 
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">Inactive</span>
                            <span className="text-sm">42</span>
                          </div>
                          <ProgressBar 
                            value={42} 
                            max={currentDatabase.connections.max} 
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">Long Running ({'>'}10m)</span>
                            <span className="text-sm">8</span>
                          </div>
                          <ProgressBar 
                            value={8} 
                            max={currentDatabase.connections.max} 
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">Blocked</span>
                            <span className="text-sm text-warning">3</span>
                          </div>
                          <ProgressBar 
                            value={3} 
                            max={currentDatabase.connections.max} 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Resource-Consuming Sessions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Session ID</th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Username</th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">CPU (%)</th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Memory (MB)</th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Running Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-border hover:bg-muted/20">
                              <td className="p-3">SID_1234</td>
                              <td className="p-3">APP_USER</td>
                              <td className="p-3 text-error">42.3%</td>
                              <td className="p-3">256</td>
                              <td className="p-3">00:34:12</td>
                            </tr>
                            <tr className="border-b border-border hover:bg-muted/20">
                              <td className="p-3">SID_5678</td>
                              <td className="p-3">BATCH_PROC</td>
                              <td className="p-3 text-warning">28.1%</td>
                              <td className="p-3">512</td>
                              <td className="p-3">02:15:43</td>
                            </tr>
                            <tr className="border-b border-border hover:bg-muted/20">
                              <td className="p-3">SID_9012</td>
                              <td className="p-3">REPORTING</td>
                              <td className="p-3">15.7%</td>
                              <td className="p-3">384</td>
                              <td className="p-3">00:52:37</td>
                            </tr>
                            <tr className="border-b border-border hover:bg-muted/20">
                              <td className="p-3">SID_3456</td>
                              <td className="p-3">WEB_APP</td>
                              <td className="p-3">12.4%</td>
                              <td className="p-3">128</td>
                              <td className="p-3">00:08:45</td>
                            </tr>
                            <tr className="hover:bg-muted/20">
                              <td className="p-3">SID_7890</td>
                              <td className="p-3">ADMIN</td>
                              <td className="p-3">8.2%</td>
                              <td className="p-3">96</td>
                              <td className="p-3">00:15:28</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Database Selected</h3>
              <p className="text-muted-foreground mb-4">
                Please select a database to view system health information.
              </p>
              <Button onClick={() => setLocation('/databases')}>
                Manage Databases
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
