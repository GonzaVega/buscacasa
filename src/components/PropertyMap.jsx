import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { STATUS_CONFIG } from './StatusBadge'

function formatPrice(price, expenses) {
  const fmt = (n) => n ? `$${Number(n).toLocaleString('es-AR')}` : null
  return [fmt(price), expenses ? `+ $${Number(expenses).toLocaleString('es-AR')} exp.` : null].filter(Boolean).join(' ')
}

export default function PropertyMap({
  properties = [],
  onEdit,
  currentUser,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [selectedProperty, setSelectedProperty] = useState(null)

  // Filter properties that have valid numeric coordinates
  const locatableProperties = properties.filter(
    p => p.location && typeof p.location.lat === 'number' && typeof p.location.lng === 'number'
  )

  const unlocatableCount = properties.length - locatableProperties.length

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize Leaflet map if not already created
    if (!mapInstanceRef.current) {
      // Default center: Mendoza, Argentina [-32.8908, -68.8458]
      const defaultCenter = [-32.8908, -68.8458]
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView(defaultCenter, 13)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Tile layer: OpenStreetMap Standard (100% Free, No API Key Required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (locatableProperties.length === 0) return

    const bounds = L.latLngBounds([])

    locatableProperties.forEach(p => {
      const { lat, lng } = p.location
      const statusKey = p.status || 'uncalled'
      const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG['uncalled']
      const isFinalist = !!p.finalist
      const isUnviewed = !p.viewedBy?.some(v => v.uid === currentUser?.uid)

      // Custom marker HTML
      const markerHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: ${cfg.color};
          border: 3px solid ${isFinalist ? '#F5A623' : '#FFFFFF'};
          box-shadow: 0 4px 14px rgba(0,0,0,0.35)${isFinalist ? ', 0 0 12px rgba(245,166,35,0.8)' : ''};
          color: #ffffff;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
          ${cfg.icon || '🏠'}
          ${isFinalist ? `
            <span style="
              position: absolute;
              top: -6px;
              right: -6px;
              background: #F5A623;
              color: #000;
              font-size: 10px;
              border-radius: 50%;
              width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">★</span>
          ` : ''}
          ${isUnviewed ? `
            <span style="
              position: absolute;
              top: -5px;
              left: -5px;
              background: linear-gradient(135deg, #2563EB, #7C3AED);
              border: 2px solid #FFFFFF;
              border-radius: 50%;
              width: 13px;
              height: 13px;
              box-shadow: 0 0 8px rgba(37,99,235,0.85);
            "></span>
          ` : ''}
        </div>
      `

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-property-pin',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -22],
      })

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)

      marker.on('click', () => {
        setSelectedProperty(p)
      })

      bounds.extend([lat, lng])
      markersRef.current.push(marker)
    })

    if (locatableProperties.length > 0) {
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
      })
    }

    return () => {
      // Don't destroy map on every render, only cleanup markers
    }
  }, [locatableProperties, currentUser])

  // Cleanup map when component unmounts entirely
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100dvh - 220px)', minHeight: 460, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Map Element */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Notice if some properties lack geolocation */}
      {unlocatableCount > 0 && (
        <div style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 1000,
          background: 'rgba(26, 26, 46, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <span>📍</span>
          <span>
            {unlocatableCount} de {properties.length} propiedades sin ubicar en el mapa.
          </span>
        </div>
      )}

      {/* Selected Property Floating Card Preview */}
      {selectedProperty && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: 380,
          zIndex: 1000,
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          animation: 'fadeSlideUp 0.25s ease-out',
        }}>
          <button
            type="button"
            onClick={() => setSelectedProperty(null)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 26,
              height: 26,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              zIndex: 2,
            }}
          >
            ✕
          </button>

          <div style={{ display: 'flex', gap: 12, padding: 12 }}>
            {selectedProperty.photos?.[0] ? (
              <img
                src={selectedProperty.photos[0]}
                alt=""
                style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 90,
                height: 90,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                flexShrink: 0,
              }}>
                🏠
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {!selectedProperty.viewedBy?.some(v => v.uid === currentUser?.uid) && (
                  <div style={{ marginBottom: 4 }}>
                    <span className="badge-unviewed" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                      Nuevo para vos
                    </span>
                  </div>
                )}
                <h4 style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {selectedProperty.title || 'Propiedad'}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  📍 {selectedProperty.neighborhood || selectedProperty.address || 'Sin zona'}
                </p>
                <div style={{ marginTop: 4, fontWeight: 700, color: 'var(--accent)', fontSize: '0.92rem' }}>
                  {formatPrice(selectedProperty.price, selectedProperty.expenses) || 'Consultar precio'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onEdit(selectedProperty)}
                  style={{ flex: 1, fontSize: '0.78rem', padding: '5px 10px' }}
                >
                  ✏️ Abrir ficha
                </button>

                {selectedProperty.location?.lat && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedProperty.location.lat},${selectedProperty.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '5px 8px' }}
                    title="Cómo llegar con Google Maps"
                  >
                    🚗 Ir
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
