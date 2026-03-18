import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toUpperCase();
  
  const getStyles = () => {
    switch (s) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getDotColor = () => {
    switch (s) {
      case 'APPROVED': return 'bg-emerald-500';
      case 'REJECTED': return 'bg-rose-500';
      case 'PENDING': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
      getStyles(),
      className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", getDotColor())}></span>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
