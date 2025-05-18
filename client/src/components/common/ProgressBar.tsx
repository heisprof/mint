import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProgressBar({ value, max = 100, size = 'sm', className }: ProgressBarProps) {
  const percentage = (value / max) * 100;
  
  const getColorClass = () => {
    if (percentage < 60) return 'bg-success';
    if (percentage < 80) return 'bg-warning';
    return 'bg-error';
  };
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  return (
    <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size], className)}>
      <div 
        className={cn("h-full rounded-full", getColorClass())} 
        style={{ width: `${Math.min(percentage, 100)}%` }}
      ></div>
    </div>
  );
}
