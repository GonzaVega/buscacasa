import { useState, useMemo } from 'react'
import PropertyCard from './PropertyCard'
import PropertyMap from './PropertyMap'
import { STATUS_CONFIG } from './StatusBadge'

const ALL_STATUSES = ['all', 'uncalled', 'contacted', 'visited', 'candidate', 'discarded']
const SORT_OPTIONS = [
  { value: 'newest',     label: '🕐 Más recientes' },
  { value: 'oldest',     label: '🕐 Más antiguos' },
  { value: 'price_asc',  label: '💰 Precio ↑' },
  { value: 'price_desc', label: '💰 Precio ↓' },
  { value: 'rating',     label: '⭐ Mejor rating' },
]

export default function PropertyList({
  properties, loading,
  onEdit, onStatusChange, onMarkViewed, onToggleFinalist,
  currentUser,
}) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch]             = useState('')
  const [sort, setSort]                 = useState('newest')
  const [viewMode, setViewMode]         = useState('cards') // 'cards' | 'map'

  const finalists = useMemo(
    () => properties.filter(p => p.finalist && (p.status || 'uncalled') !== 'discarded'),
    [properties]
  )

  const filtered = useMemo(() => {
    let list = properties.filter(p => !p.finalist) // finalists shown separately above

    if (filterStatus !== 'all') {
      list = list.filter(p => (p.status || 'uncalled') === filterStatus)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.neighborhood?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      if (sort === 'price_asc')  return (Number(a.price) || 0) - (Number(b.price) || 0)
      if (sort === 'price_desc') return (Number(b.price) || 0) - (Number(a.price) || 0)
      if (sort === 'rating')     return (b.rating || 0) - (a.rating || 0)
      if (sort === 'oldest')     return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      return 0 // newest = Firestore default
    })

    return list
  }, [properties, filterStatus, search, sort])

  // Count by status (excluding finalists from counts)
  const counts = useMemo(() => {
    const nonFinalists = properties.filter(p => !p.finalist)
    const map = { all: nonFinalists.length }
    nonFinalists.forEach(p => {
      const s = p.status || 'uncalled'
      map[s] = (map[s] || 0) + 1
    })
    return map
  }, [properties])

  // All matching properties for the map view (finalists + filtered)
  const mapProperties = useMemo(() => {
    let list = properties
    if (filterStatus !== 'all') {
      list = list.filter(p => (p.status || 'uncalled') === filterStatus)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.neighborhood?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      )
    }
    return list
  }, [properties, filterStatus, search])

  const cardProps = (p) => ({
    property: p,
    onEdit,
    onStatusChange,
    onMarkViewed,
    onToggleFinalist,
    currentUser,
  })

  if (loading) {
    return (
      <div style={{ padding: '64px 0', display: 'flex', justifyContent: 'center' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  return (
    <div>
      {/* ===================== VIEW MODE TOGGLE & FILTERS ===================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
      }}>
        {/* Toggle Cards / Map */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-card)',
          padding: 3,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setViewMode('cards')}
            style={{
              background: viewMode === 'cards' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: viewMode === 'cards' ? 700 : 500,
            }}
          >
            📋 Tarjetas
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setViewMode('map')}
            style={{
              background: viewMode === 'map' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'map' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: viewMode === 'map' ? 700 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🗺️ Mapa
            {mapProperties.filter(p => p.location?.lat).length > 0 && (
              <span style={{
                background: viewMode === 'map' ? 'rgba(255,255,255,0.25)' : 'var(--bg-input)',
                borderRadius: 99,
                padding: '1px 6px',
                fontSize: '0.7rem',
              }}>
                {mapProperties.filter(p => p.location?.lat).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===================== SEARCH + SORT ===================== */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          id="search-input"
          className="input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar por barrio, dirección, título..."
          style={{ flex: 1, minWidth: 180 }}
        />
        {viewMode === 'cards' && (
          <select
            className="input"
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ width: 'auto', minWidth: 150, cursor: 'pointer' }}
            id="sort-select"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* ===================== STATUS FILTER CHIPS ===================== */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        paddingBottom: 12, scrollbarWidth: 'none',
      }}>
        {ALL_STATUSES.map(s => {
          const cfg    = s === 'all' ? null : STATUS_CONFIG[s]
          const active = filterStatus === s
          const count  = counts[s] || 0
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className="btn btn-sm"
              id={`filter-${s}`}
              style={{
                flexShrink: 0,
                background: active
                  ? (cfg ? cfg.bg : 'var(--accent-dim)')
                  : 'var(--bg-card)',
                color: active
                  ? (cfg ? cfg.color : 'var(--accent)')
                  : 'var(--text-secondary)',
                border: `1px solid ${active ? (cfg ? cfg.color + '44' : 'var(--accent)') : 'var(--border)'}`,
                fontWeight: active ? 700 : 500,
              }}
            >
              {cfg ? `${cfg.icon} ${cfg.label}` : '🏘️ Todas'}
              {count > 0 && (
                <span style={{
                  background: active ? 'rgba(255,255,255,0.2)' : 'var(--bg-card-hover)',
                  borderRadius: 99, padding: '1px 6px', fontSize: '0.7rem', marginLeft: 2,
                }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ===================== MAP VIEW ===================== */}
      {viewMode === 'map' ? (
        <div style={{ marginTop: 8, paddingBottom: 80 }}>
          <PropertyMap
            properties={mapProperties}
            onEdit={onEdit}
            currentUser={currentUser}
          />
        </div>
      ) : (
        /* ===================== CARDS VIEW ===================== */
        <>
          {/* Finalists section */}
          {finalists.length > 0 && (
            <section style={{ marginBottom: 36, marginTop: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(90deg, rgba(245,166,35,0.12), transparent)',
                  border: '1px solid rgba(245,166,35,0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 14px',
                  flex: 1,
                }}>
                  <span style={{ fontSize: '1.2rem' }}>⭐</span>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.95rem' }}>
                      Finalistas
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                      {finalists.length} propiedad{finalists.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}>
                {finalists.map(p => <PropertyCard key={p.id} {...cardProps(p)} />)}
              </div>

              {/* Separator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginTop: 28,
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  Otras propiedades
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            </section>
          )}

          {search && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{search}"
            </p>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>
                {search ? '🔍' : filterStatus !== 'all' ? STATUS_CONFIG[filterStatus]?.icon : '🏠'}
              </div>
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                {search
                  ? 'No hay resultados'
                  : filterStatus !== 'all'
                    ? `Ninguna en "${STATUS_CONFIG[filterStatus]?.label}"`
                    : 'Todavía no hay propiedades'}
              </h3>
              <p style={{ fontSize: '0.875rem' }}>
                {properties.length === 0
                  ? 'Usá el botón "+" para empezar a guardar opciones.'
                  : 'Probá con otro filtro o búsqueda.'}
              </p>
            </div>
          )}

          {/* Main Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
            paddingBottom: 100,
            marginTop: 8,
          }}>
            {filtered.map(p => <PropertyCard key={p.id} {...cardProps(p)} />)}
          </div>
        </>
      )}
    </div>
  )
}
