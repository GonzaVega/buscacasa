import StatusBadge, { STATUS_CONFIG } from './StatusBadge'
import StarRating from './StarRating'
import UserAvatar from './UserAvatar'

const STATUS_ORDER = ['uncalled', 'contacted', 'visited', 'candidate', 'discarded']

function formatPhone(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('54')) return digits
  if (digits.startsWith('0'))  return '549' + digits.slice(1)
  return '549' + digits
}

function formatPrice(price, expenses) {
  const fmt = (n) => n ? `$${Number(n).toLocaleString('es-AR')}` : null
  return [fmt(price), expenses ? `+ $${Number(expenses).toLocaleString('es-AR')} exp.` : null].filter(Boolean).join(' ')
}

// "Visto por" pill row
function ViewedByRow({ viewedBy = [], currentUser, onToggle }) {
  const iViewed = viewedBy.some(v => v.uid === currentUser?.uid)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {viewedBy.length === 0 && (
        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
          Nadie la vio aún
        </span>
      )}
      {viewedBy.map(v => (
        <div key={v.uid} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <UserAvatar displayName={v.displayName} email={v.email} size={20} title={`${v.displayName} ya la vio`} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {v.displayName?.split(' ')[0]}
          </span>
        </div>
      ))}
      {viewedBy.length >= 2 && (
        <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 600 }}>
          👀 {viewedBy.length === 2 ? 'Los dos' : `Los ${viewedBy.length}`}
        </span>
      )}
      <button
        type="button"
        className="btn btn-sm"
        onClick={onToggle}
        style={{
          fontSize: '0.68rem',
          padding: '3px 8px',
          background: iViewed ? 'var(--blue-dim)' : 'linear-gradient(135deg, rgba(37,99,235,0.22), rgba(124,58,237,0.22))',
          color: iViewed ? 'var(--blue)' : '#93C5FD',
          border: `1px solid ${iViewed ? 'rgba(59,130,246,0.3)' : 'rgba(147,197,253,0.45)'}`,
          fontWeight: iViewed ? 500 : 700,
        }}
        title={iViewed ? 'Quitar mi marca de vista' : 'Marcar que ya la vi'}
      >
        {iViewed ? '✔ Ya la vi' : '👀 Marcar vista'}
      </button>
    </div>
  )
}

export default function PropertyCard({ property, onEdit, onStatusChange, onMarkViewed, onToggleFinalist, currentUser }) {
  const {
    title, url, price, expenses, neighborhood, phone, status, rating,
    pros = [], cons = [], photos = [], createdBy, viewedBy = [], finalist = false,
  } = property

  const statusIdx  = STATUS_ORDER.indexOf(status || 'uncalled')
  const nextStatus = STATUS_ORDER[statusIdx + 1] || null
  const iViewed    = viewedBy.some(v => v.uid === currentUser?.uid)

  const waLink = phone
    ? `https://wa.me/${formatPhone(phone)}?text=${encodeURIComponent(`Hola! Vi tu publicación${title ? ': ' + title : ''} y me interesa.`)}`
    : null

  const mainPhoto = photos[0] || null

  return (
    <article
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: !iViewed
          ? '1.5px solid rgba(96, 165, 250, 0.45)'
          : (finalist ? '1.5px solid rgba(245,166,35,0.5)' : '1px solid var(--border)'),
        boxShadow: !iViewed
          ? '0 4px 20px rgba(37, 99, 235, 0.16)'
          : (finalist ? '0 4px 24px rgba(245,166,35,0.12)' : 'var(--shadow-card)'),
      }}
      id={`property-${property.id}`}
    >
      {/* Photo */}
      <div
        onClick={() => onEdit(property)}
        style={{
          height: 180,
          background: mainPhoto
            ? `url(${mainPhoto}) center/cover no-repeat`
            : `linear-gradient(135deg, var(--bg-card-hover), var(--bg-surface))`,
          position: 'relative',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        {!mainPhoto && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 48, opacity: 0.2,
          }}>🏠</div>
        )}

        {photos.length > 1 && (
          <span style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            color: 'white', fontSize: '0.75rem', fontWeight: 600,
            padding: '3px 8px', borderRadius: 99,
          }}>📷 {photos.length}</span>
        )}

        {/* Badges top-left */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, alignItems: 'center', zIndex: 2 }}>
          <StatusBadge status={status || 'uncalled'} />
          {!iViewed && (
            <span
              className="badge-unviewed"
              title="Aún no revisaste esta propiedad"
            >
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#93C5FD',
                boxShadow: '0 0 6px #60A5FA',
                animation: 'pulseGlow 1.8s infinite',
                display: 'inline-block',
              }} />
              Nuevo
            </span>
          )}
        </div>

        {/* Finalist star top-right */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleFinalist(property.id, finalist) }}
          title={finalist ? 'Quitar de finalistas' : 'Marcar como finalista'}
          id={`btn-finalist-${property.id}`}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: finalist ? 'rgba(245,166,35,0.25)' : 'rgba(0,0,0,0.4)',
            border: finalist ? '1px solid rgba(245,166,35,0.5)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 99,
            color: finalist ? '#f5a623' : 'rgba(255,255,255,0.5)',
            fontSize: '1rem', lineHeight: 1,
            padding: '5px 7px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backdropFilter: 'blur(4px)',
          }}
        >
          {finalist ? '⭐' : '☆'}
        </button>

        {/* Hover overlay */}
        <div
          className="photo-overlay"
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          <span className="overlay-label" style={{
            opacity: 0, background: 'rgba(0,0,0,0.7)', color: 'white',
            padding: '8px 18px', borderRadius: 99,
            fontSize: '0.83rem', fontWeight: 600,
            transition: 'opacity 0.2s',
          }}>✏️ Ver detalle</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Title + neighborhood/address */}
        <div onClick={() => onEdit(property)} style={{ cursor: 'pointer' }}>
          <h3 style={{ lineHeight: 1.3, marginBottom: 3 }}>{title || 'Sin título'}</h3>
          {(property.address || neighborhood) && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              📍 {property.address ? `${property.address}${neighborhood ? ` (${neighborhood})` : ''}` : neighborhood}
            </p>
          )}
        </div>

        {/* Price */}
        {(price || expenses) && (
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)', margin: 0 }}>
            {formatPrice(price, expenses)}
          </p>
        )}

        {/* Rating */}
        {rating > 0 && <StarRating value={rating} readOnly size={17} />}

        {/* Pros/Cons preview */}
        {(pros.length > 0 || cons.length > 0) && (
          <div className="tag-list">
            {pros.slice(0, 2).map((p, i) => <span key={i} className="tag tag-pro">✓ {p}</span>)}
            {cons.slice(0, 1).map((c, i) => <span key={i} className="tag tag-con">✗ {c}</span>)}
            {pros.length + cons.length > 3 && (
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                +{pros.length + cons.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="divider" style={{ margin: '4px 0' }} />

        {/* Visto por */}
        <ViewedByRow
          viewedBy={viewedBy}
          currentUser={currentUser}
          onToggle={() => onMarkViewed(property.id, iViewed)}
        />

        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          {/* Creator */}
          {createdBy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <UserAvatar
                displayName={createdBy.displayName}
                email={createdBy.email}
                size={22}
                title={`Cargado por ${createdBy.displayName}`}
              />
              <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {createdBy.displayName?.split(' ')[0]}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="btn btn-sm"
                title="Contactar por WhatsApp"
                style={{
                  background: 'rgba(37,211,102,0.1)', color: '#25d366',
                  border: '1px solid rgba(37,211,102,0.2)', padding: '5px 9px',
                }}
                id={`btn-wa-${property.id}`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            )}

            {property.location?.lat && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${property.location.lat},${property.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm btn-icon"
                title="Cómo llegar con Google Maps"
                style={{ padding: '5px 8px', fontSize: '0.85rem' }}
              >
                🗺️
              </a>
            )}

            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost btn-sm btn-icon"
                title="Ver publicación original"
                style={{ padding: '5px 8px' }}
              >🔗</a>
            )}

            {nextStatus && (
              <button
                className="btn btn-sm"
                title={`→ ${STATUS_CONFIG[nextStatus]?.label}`}
                onClick={() => onStatusChange(property.id, nextStatus)}
                style={{
                  background: STATUS_CONFIG[nextStatus]?.bg,
                  color: STATUS_CONFIG[nextStatus]?.color,
                  border: `1px solid ${STATUS_CONFIG[nextStatus]?.color}33`,
                  padding: '5px 9px', fontSize: '0.73rem',
                }}
                id={`btn-status-${property.id}`}
              >
                {STATUS_CONFIG[nextStatus]?.icon} →
              </button>
            )}
          </div>
        </div>
      </div>

    </article>
  )
}
