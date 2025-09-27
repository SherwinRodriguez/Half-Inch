'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  autoClose?: boolean;
}

interface ToasterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// Global toast state
let toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'success', title, message, ...options });
  },
  error: (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'error', title, message, autoClose: false, ...options });
  },
  warning: (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'warning', title, message, ...options });
  },
  info: (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'info', title, message, ...options });
  },
  dismiss: (id: string) => {
    removeToast(id);
  },
  dismissAll: () => {
    toasts = [];
    listeners.forEach(listener => listener(toasts));
  }
};

function addToast(toast: Omit<Toast, 'id'>) {
  const newToast: Toast = {
    id: Math.random().toString(36).substring(2) + Date.now().toString(36),
    duration: 5000,
    autoClose: true,
    ...toast,
  };
  
  toasts = [...toasts, newToast];
  listeners.forEach(listener => listener(toasts));
  
  if (newToast.autoClose && newToast.duration) {
    setTimeout(() => {
      removeToast(newToast.id);
    }, newToast.duration);
  }
}

function removeToast(id: string) {
  toasts = toasts.filter(toast => toast.id !== id);
  listeners.forEach(listener => listener(toasts));
}

export function Toaster({ position = 'top-right' }: ToasterProps) {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setCurrentToasts);
    return () => {
      listeners = listeners.filter(listener => listener !== setCurrentToasts);
    };
  }, []);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (currentToasts.length === 0) return null;

  return (
    <div className={cn('fixed z-50 flex flex-col space-y-2', positionClasses[position])}>
      {currentToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 150);
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[toast.type];

  const typeClasses = {
    success: 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  return (
    <div
      className={cn(
        'max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto border transition-all duration-300 ease-in-out transform',
        typeClasses[toast.type],
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isExiting && '-translate-x-full opacity-0'
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={cn('w-5 h-5', iconColors[toast.type])} />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm opacity-90">{toast.message}</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400 opacity-70 hover:opacity-100 transition-opacity"
            >
              <span className="sr-only">Close</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
