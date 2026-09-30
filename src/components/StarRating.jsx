export default function StarRating({ value = 0, onChange, readOnly = false, size = 24 }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onChange && onChange(star === value ? 0 : star)}
          style={{
            background: 'none',
            border: 'none',
            cursor: readOnly ? 'default' : 'pointer',
            padding: 1,
            fontSize: size,
            lineHeight: 1,
            transition: 'transform 0.15s',
            transform: 'scale(1)',
            filter: star <= value
              ? 'drop-shadow(0 0 4px rgba(245,166,35,0.6))'
              : 'none',
          }}
          onMouseEnter={e => { if (!readOnly) e.currentTarget.style.transform = 'scale(1.2)' }}
          onMouseLeave={e => { if (!readOnly) e.currentTarget.style.transform = 'scale(1)' }}
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
        >
          {star <= value ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  )
}
