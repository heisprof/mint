import React from 'react';
import { X } from 'lucide-react';
import { Database } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import ProgressBar from '@/components/common/ProgressBar';

interface DatabaseDetailsProps {
  database: Database & {
    cpu: number;
    diskUsage: number;
    memory: number;
    connections: {
      active: number;
      max: number;
    };
    alerts: Array<{
      id: number;
      severity: 'critical' | 'warning';
      metricName: string;
      message: string;
      timeAgo: string;
    }>;
  } | null;
  open: boolean;
  onClose: () => void;
  onEdit: (db: Database) => void;
  onViewReports: (db: Database) => void;
}

export default function DatabaseDetailsDialog({
  database,
  open,
  onClose,
  onEdit,
  onViewReports
}: DatabaseDetailsProps) {
  if (!database) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b border-border flex flex-row items-center justify-between p-4">
          <DialogTitle className="text-lg font-medium">Database Details: {database.name}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm text-muted-foreground">Connection Info</h4>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="text-sm"><span className="text-muted-foreground">Host:</span> {database.host}</div>
              <div className="text-sm"><span className="text-muted-foreground">Port:</span> {database.port}</div>
              <div className="text-sm"><span className="text-muted-foreground">Database:</span> {database.name}</div>
              <div className="text-sm"><span className="text-muted-foreground">Version:</span> Oracle 19c</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm text-muted-foreground">Status</h4>
            <div className="flex items-center mt-1">
              <StatusBadge status={database.status as any} />
              {database.status !== 'healthy' && (
                <span className="ml-2 text-sm">
                  {database.status === 'critical' 
                    ? 'Multiple critical issues detected' 
                    : 'Performance warnings detected'}
                </span>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm text-muted-foreground">Performance Metrics</h4>
            <div className="space-y-2 mt-1">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <div>CPU Utilization</div>
                  <div className={database.cpu >= 85 ? 'text-error' : database.cpu >= 70 ? 'text-warning' : ''}>
                    {database.cpu}% {database.cpu >= 85 ? '(Threshold: 85%)' : ''}
                  </div>
                </div>
                <ProgressBar value={database.cpu} />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <div>Disk Usage</div>
                  <div className={database.diskUsage >= 90 ? 'text-error' : database.diskUsage >= 75 ? 'text-warning' : ''}>
                    {database.diskUsage}% {database.diskUsage >= 90 ? '(Threshold: 90%)' : ''}
                  </div>
                </div>
                <ProgressBar value={database.diskUsage} />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <div>Memory Usage</div>
                  <div className={database.memory >= 80 ? 'text-warning' : ''}>
                    {database.memory}% {database.memory >= 80 ? '(Threshold: 80%)' : ''}
                  </div>
                </div>
                <ProgressBar value={database.memory} />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <div>Active Connections</div>
                  <div>
                    {database.connections.active} / {database.connections.max}
                  </div>
                </div>
                <ProgressBar 
                  value={database.connections.active} 
                  max={database.connections.max} 
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm text-muted-foreground">Recent Alerts</h4>
            <div className="space-y-2 mt-1">
              {database.alerts.length > 0 ? (
                database.alerts.map(alert => (
                  <div key={alert.id} className="text-sm flex items-start">
                    <span className={`mr-1 text-${alert.severity === 'critical' ? 'error' : 'warning'}`}>
                      {alert.severity === 'critical' ? '🔴' : '⚠️'}
                    </span>
                    <div>{alert.message} - {alert.timeAgo}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No recent alerts</div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end p-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={() => database && onEdit(database)}
            className="mr-2"
          >
            Edit Configuration
          </Button>
          <Button 
            onClick={() => database && onViewReports(database)}
          >
            View Detailed Reports
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
