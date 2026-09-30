import { useState, useCallback } from 'react'

// Simple global toast system
let toastListeners = []

export function addToast(message, type = 'info') {
  const id = Date.now()
  toastListeners.forEach(fn => fn({ id, message, type }))
}

export function useToast() {
  const [toasts, setToasts] = useState([])

  const register = useCallback((fn) => {
    toastListeners.push(fn)
    return () => { toastListeners = toastListeners.filter(f => f !== fn) }
  }, [])

  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id))

  return { toasts, register, removeToast }
}
