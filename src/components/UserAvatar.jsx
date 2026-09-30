// Generates a consistent color from a string (name/email)
function stringToColor(str = '') {
  const colors = [
    '#e94560', // red-coral (accent)
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#f97316', // orange
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#ec4899', // pink
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function UserAvatar({ displayName = '', email = '', size = 32, title, style = {} }) {
  const name    = displayName || email.split('@')[0] || '?'
  const initial = name.charAt(0).toUpperCase()
  const color   = stringToColor(name)

  return (
    <div
      title={title || name}
      style={{
        width:           size,
        height:          size,
        borderRadius:    '50%',
        background:      color,
        color:           'white',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontSize:        size * 0.42,
        fontWeight:      700,
        fontFamily:      'Inter, sans-serif',
        flexShrink:      0,
        userSelect:      'none',
        letterSpacing:   '-0.02em',
        boxShadow:       `0 0 0 2px rgba(255,255,255,0.08)`,
        ...style,
      }}
    >
      {initial}
    </div>
  )
}
