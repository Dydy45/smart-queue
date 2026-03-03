/**
 * Provider pour les notifications toast avec hook useToast
 * Utilise React Context API pour partager les notifications partout
 */

'use client'

import React, { createContext, useState, useCallback, useContext } from 'react'
import type { Toast, ToastType, ToastContextType } from './toast-types'

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * Hook pour utiliser les notifications toast
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast doit être utilisé à l\'intérieur du ToastProvider')
  }
  
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = Date.now().toString()
      const newToast: Toast = { id, message, type, duration }

      setToasts((prevToasts) => [...prevToasts, newToast])

      // Retirer le toast après la durée spécifiée
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration ?? 3000),
    [showToast]
  )

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration ?? 4000),
    [showToast]
  )

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration ?? 3000),
    [showToast]
  )

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration ?? 3500),
    [showToast]
  )

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast,
    toasts,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Composant qui affiche les toasts à l'écran
 */
function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

/**
 * Composant individuel d'un toast
 */
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: (id: string) => void
}) {
  const bgColor = {
    success: 'bg-success text-success-content',
    error: 'bg-error text-error-content',
    warning: 'bg-warning text-warning-content',
    info: 'bg-info text-info-content',
  }[toast.type]

  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[toast.type]

  return (
    <div
      className={`alert ${bgColor} shadow-lg rounded-lg p-4 min-w-64 animate-slide-in pointer-events-auto`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="flex-1 text-sm">{toast.message}</span>
        <button
          onClick={() => onRemove(toast.id)}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
