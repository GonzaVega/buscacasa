import UserAvatar from './UserAvatar'

export default function Header({ user, onLogout, onNewProperty }) {
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario'

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(13,13,26,0.88)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        gap: 12,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🏠</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.03em' }}>
            Busca<span style={{ color: 'var(--accent)' }}>Casa</span>
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            id="btn-add-property"
            className="btn btn-primary btn-sm"
            onClick={onNewProperty}
          >
            <span style={{ fontSize: '1.15rem', lineHeight: 1, fontWeight: 800 }}>+</span>
            <span className="hide-xs">Agregar</span>
          </button>

          {/* Avatar with dropdown hint */}
          <button
            onClick={onLogout}
            title={`${displayName} — Cerrar sesión`}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              borderRadius: 99, padding: '3px 8px 3px 3px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            id="btn-user-menu"
          >
            <UserAvatar displayName={displayName} email={user?.email} size={32} />
            <span className="hide-xs" style={{
              fontSize: '0.82rem', fontWeight: 600,
              color: 'var(--text-secondary)', maxWidth: 80,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {displayName.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 400px) { .hide-xs { display: none; } }
      `}</style>
    </header>
  )
}
