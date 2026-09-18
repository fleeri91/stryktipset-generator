'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const ToastContext = createContext<(message: string) => void>(() => {})

const TOAST_MS = 1700

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = useCallback((next: string) => {
    setMessage(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), TOAST_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <ToastContext.Provider value={flash}>
      {children}
      {message && (
        <div
          role="status"
          className="bg-paper text-paper-fg animate-toast-in fixed right-6 bottom-28 left-6 z-50 rounded-xl px-4 py-3 text-center font-mono text-xs shadow-[0_12px_30px_-8px_oklch(0.10_0.02_60/0.6)] lg:right-auto lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 lg:px-5"
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

/** Returns a `flash(message)` function that shows a short-lived toast. */
export function useToast() {
  return useContext(ToastContext)
}
