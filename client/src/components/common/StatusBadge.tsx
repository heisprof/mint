import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'healthy' | 'warning' | 'critical' | 'unknown';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showText?: boolean;
}

export default function StatusBadge({ status, className, showText = true }: StatusBadgeProps) {
  const statusText = {
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
    unknown: 'Unknown'
  };
  
  const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
  
  const statusClasses = {
    healthy: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    critical: "bg-error/20 text-error",
    unknown: "bg-muted text-muted-foreground"
  };
  
  return (
    <span className={cn(baseClasses, statusClasses[status], className)}>
      {showText ? statusText[status] : null}
    </span>
  );
}
