import React from 'react';
import { Alert as AlertType } from '@shared/schema';
import { AlertOctagon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AlertItemProps {
  alert: AlertType & {
    databaseName?: string;
    timeAgo: string;
  };
}

function AlertItem({ alert }: AlertItemProps) {
  return (
    <li className="px-4 py-3 hover:bg-muted/30 border-b border-border last:border-0">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-1">
          {alert.severity === 'critical' ? (
            <AlertOctagon className="text-error" size={18} />
          ) : (
            <AlertTriangle className="text-warning" size={18} />
          )}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{alert.metricName}</p>
            <p className="text-xs text-muted-foreground">{alert.timeAgo}</p>
          </div>
          <p className="text-sm text-muted-foreground">{alert.message}</p>
          <div className="mt-1 flex items-center text-xs">
            <span
              className={cn(
                "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                alert.severity === 'critical'
                  ? "bg-error/20 text-error"
                  : "bg-warning/20 text-warning"
              )}
            >
              {alert.severity === 'critical' ? 'Critical' : 'Warning'}
            </span>
            {alert.ticketId && (
              <span className="ml-2 px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                ID: {alert.ticketId}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

interface AlertsListProps {
  alerts: Array<AlertType & {
    databaseName?: string;
    timeAgo: string;
  }>;
  onViewAll: () => void;
}

export default function AlertsList({ alerts, onViewAll }: AlertsListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="border-b border-border flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg">Recent Alerts</CardTitle>
        <Button variant="link" size="sm" onClick={onViewAll}>
          View All
        </Button>
      </CardHeader>
      <div className="overflow-y-auto max-h-[460px]">
        <ul className="divide-y divide-border">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </ul>
      </div>
    </Card>
  );
}
