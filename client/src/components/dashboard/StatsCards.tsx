import React from 'react';
import { Database, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  iconClass?: string;
}

function StatsCard({ icon, title, value, iconClass }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-full p-3", iconClass)}>
            {icon}
          </div>
          <div className="ml-5">
            <h3 className="text-lg font-medium text-card-foreground/80">{title}</h3>
            <div className="text-2xl font-semibold">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  totalDatabases: number;
  criticalIssues: number;
  warnings: number;
  healthy: number;
}

import { cn } from '@/lib/utils';

export default function StatsCards({ totalDatabases, criticalIssues, warnings, healthy }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatsCard
        icon={<Database className="h-5 w-5 text-primary" />}
        title="Total Databases"
        value={totalDatabases}
        iconClass="bg-primary/20"
      />
      
      <StatsCard
        icon={<AlertOctagon className="h-5 w-5 text-error" />}
        title="Critical Issues"
        value={criticalIssues}
        iconClass="bg-error/20"
      />
      
      <StatsCard
        icon={<AlertTriangle className="h-5 w-5 text-warning" />}
        title="Warnings"
        value={warnings}
        iconClass="bg-warning/20"
      />
      
      <StatsCard
        icon={<CheckCircle className="h-5 w-5 text-success" />}
        title="Healthy"
        value={healthy}
        iconClass="bg-success/20"
      />
    </div>
  );
}
