import React, { useRef } from 'react';
import { useModalBehavior } from '../shared/useModalBehavior';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  isLoading?: boolean;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  className,
  isLoading
}: BaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  useModalBehavior({
    isOpen,
    onClose,
    modalRef,
    initialFocusRef,
  });

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          "w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 modal-enter animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[calc(100vh-2rem)]",
          maxWidthClasses[maxWidth],
          className
        )}
      >
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <h2 className="text-xl font-semibold font-display text-slate-900 dark:text-white leading-tight">
            {title}
          </h2>
          <button
            ref={initialFocusRef}
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
              <p className="text-slate-500 font-medium">Processing...</p>
            </div>
          ) : (
            children
          )}
        </div>

        {footer && (
          <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
