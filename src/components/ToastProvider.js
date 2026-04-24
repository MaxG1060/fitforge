'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((current) => [...current, { id, message, type }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const api = {
    toast,
    success: useCallback((m) => toast(m, 'success'), [toast]),
    error: useCallback((m) => toast(m, 'error'), [toast]),
    info: useCallback((m) => toast(m, 'info'), [toast]),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const STYLES = {
  success: 'bg-green-950 border-green-700 text-green-200',
  error: 'bg-red-950 border-red-700 text-red-200',
  info: 'bg-zinc-900 border-zinc-700 text-zinc-200',
}

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div
      className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-lg transition-all duration-200 ${STYLES[toast.type]} ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="font-bold shrink-0">{ICONS[toast.type]}</span>
        <p className="text-sm flex-1 min-w-0">{toast.message}</p>
        <button
          onClick={onDismiss}
          className="text-zinc-500 hover:text-zinc-300 shrink-0 -my-0.5"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
