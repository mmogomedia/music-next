'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
} from '@heroicons/react/24/solid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastContextType {
  showToast: (_message: string, _type?: ToastType, _duration?: number) => void;
  success: (_message: string, _duration?: number) => void;
  error: (_message: string, _duration?: number) => void;
  info: (_message: string, _duration?: number) => void;
  warning: (_message: string, _duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (_id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRemoveRef = useRef(onRemove);

  // Keep onRemove ref updated
  useEffect(() => {
    onRemoveRef.current = onRemove;
  }, [onRemove]);

  const handleRemove = useCallback(() => {
    setIsVisible(false);
    // Wait for exit animation before removing
    setTimeout(() => {
      onRemoveRef.current(toast.id);
    }, 300);
  }, [toast.id]);

  useEffect(() => {
    // Trigger animation after mount - use a small delay to ensure smooth animation
    const animationFrame = requestAnimationFrame(() => {
      // Add a tiny delay to ensure the DOM is ready
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    });

    if (toast.duration > 0) {
      const startTime = Date.now();
      let isRemoving = false;

      const updateProgress = () => {
        if (isRemoving) return;

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
        setProgress(remaining);

        if (remaining <= 0 && !isRemoving) {
          isRemoving = true;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          handleRemove();
        }
      };

      // Start progress tracking after a brief delay to ensure toast is visible
      const startDelay = setTimeout(() => {
        progressIntervalRef.current = setInterval(updateProgress, 16); // ~60fps
      }, 50);

      removeTimeoutRef.current = setTimeout(() => {
        if (!isRemoving) {
          isRemoving = true;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          handleRemove();
        }
      }, toast.duration);

      return () => {
        clearTimeout(startDelay);
        cancelAnimationFrame(animationFrame);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (removeTimeoutRef.current) {
          clearTimeout(removeTimeoutRef.current);
          removeTimeoutRef.current = null;
        }
      };
    } else {
      // For persistent toasts (duration = 0), just show them
      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.duration, toast.id]); // Only depend on toast properties, not handleRemove

  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-800/50',
          text: 'text-green-800 dark:text-green-200',
          icon: CheckCircleIconSolid,
          iconColor: 'text-green-600 dark:text-green-400',
          progressColor: 'bg-green-600 dark:bg-green-500',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-800/50',
          text: 'text-red-800 dark:text-red-200',
          icon: XCircleIconSolid,
          iconColor: 'text-red-600 dark:text-red-400',
          progressColor: 'bg-red-600 dark:bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/30',
          border: 'border-yellow-200 dark:border-yellow-800/50',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: ExclamationTriangleIconSolid,
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          progressColor: 'bg-yellow-600 dark:bg-yellow-500',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/30',
          border: 'border-blue-200 dark:border-blue-800/50',
          text: 'text-blue-800 dark:text-blue-200',
          icon: InformationCircleIconSolid,
          iconColor: 'text-blue-600 dark:text-blue-400',
          progressColor: 'bg-blue-600 dark:bg-blue-500',
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md border pointer-events-auto transition-all duration-300 transform ${
        config.bg
      } ${config.border} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      style={{
        minWidth: '320px',
        maxWidth: '420px',
      }}
    >
      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className='absolute top-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5 rounded-t-xl overflow-hidden'>
          <div
            className={`h-full ${config.progressColor} transition-all ease-linear`}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        <Icon className='w-5 h-5' />
      </div>

      {/* Message */}
      <div className='flex-1 min-w-0'>
        <p className={`text-sm font-medium ${config.text} leading-relaxed`}>
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleRemove}
        className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${config.text}`}
        aria-label='Dismiss toast'
      >
        <XMarkIcon className='w-4 h-4' />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 5000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
        createdAt: Date.now(),
      };

      setToasts(prev => [...prev, newToast]);
    },
    []
  );

  const success = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration);
    },
    [showToast]
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Container - Top Right */}
      <div className='fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[420px]'>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
