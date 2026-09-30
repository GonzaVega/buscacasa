import { useState } from 'react'

export default function Login({ onLogin }) {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Completá email y contraseña'); return }
    setLoading(true)
    setError('')
    try {
      await onLogin(email.trim(), password)
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Email o contraseña incorrectos')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Esperá un momento.')
      } else {
        setError('Error al ingresar. Verificá los datos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: `
        radial-gradient(ellipse 80% 60% at 50% -10%, rgba(233,69,96,0.15) 0%, transparent 60%),
        var(--bg-base)
      `,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 80, height: 80,
            background: 'var(--accent)',
            borderRadius: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(233,69,96,0.4)',
          }}>🏠</div>
          <h1 style={{ marginBottom: 8 }}>BuscaCasa</h1>
          <p style={{ fontSize: '0.95rem' }}>
            El tracker para encontrar su próximo hogar 🔑
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="gonzalo@ejemplo.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="login-password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                className="input"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '1rem', padding: 2,
                }}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--red-dim)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.85rem',
              color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <button
            id="btn-login"
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Ingresando...</>
              : '🚀 Ingresar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Los dos inician con su propio email y ven todo<br />en tiempo real. 👫
        </p>
      </div>
    </div>
  )
}
