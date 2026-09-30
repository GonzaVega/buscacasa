export const STATUS_CONFIG = {
  uncalled:  { label: 'Sin contactar', color: 'var(--gray)',  bg: 'var(--gray-dim)',  icon: '📋' },
  contacted: { label: 'Contactado',    color: 'var(--blue)',  bg: 'var(--blue-dim)',  icon: '📞' },
  visited:   { label: 'Visitado',      color: 'var(--amber)', bg: 'var(--amber-dim)', icon: '🏠' },
  candidate: { label: 'Candidato',     color: 'var(--green)', bg: 'var(--green-dim)', icon: '⭐' },
  discarded: { label: 'Descartado',    color: 'var(--red)',   bg: 'var(--red-dim)',   icon: '❌' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.uncalled
  return (
    <span
      className="badge"
      style={{
        color:      cfg.color,
        background: cfg.bg,
        fontSize:   size === 'lg' ? '0.8rem' : '0.7rem',
        padding:    size === 'lg' ? '5px 12px' : '3px 9px',
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  )
}
