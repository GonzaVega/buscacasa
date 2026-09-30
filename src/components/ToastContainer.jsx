import { useEffect, useRef, useState } from 'react'

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  // Simple pub/sub — other components call window.showToast(msg, type)
  useEffect(() => {
    window.showToast = (message, type = 'info') => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    return () => { delete window.showToast }
  }, [])

  if (!toasts.length) return null

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && '✅ '}
          {t.type === 'error'   && '❌ '}
          {t.type === 'info'    && 'ℹ️ '}
          {t.message}
        </div>
      ))}
    </div>
  )
}
