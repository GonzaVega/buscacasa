import { useState, useEffect, useRef } from 'react'
import StatusBadge, { STATUS_CONFIG } from './StatusBadge'
import StarRating from './StarRating'
import { extractMeta, geocodeLocation, parsePastedText } from '../utils/scraper'

const EMPTY_FORM = {
  title: '', url: '', price: '', expenses: '', neighborhood: '',
  address: '', location: null,
  phone: '', status: 'uncalled', rating: 0,
  pros: [], cons: [], notes: '', visitDate: '',
  photos: [], finalist: false,
}

function TagInput({ tags, onAdd, onRemove, type, placeholder }) {
  const [val, setVal] = useState('')

  const add = () => {
    const trimmed = val.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed)
      setVal('')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          className="input"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={add} style={{ flexShrink: 0 }}>
          + Agregar
        </button>
      </div>
      {tags.length > 0 && (
        <div className="tag-list">
          {tags.map((tag, i) => (
            <span key={i} className={`tag tag-${type}`}>
              {type === 'pro' ? '✓' : '✗'} {tag}
              <button className="tag-remove" onClick={() => onRemove(i)} aria-label="Quitar">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoUpload({ photos, onAdd, onRemove, uploadPhoto, propertyId }) {
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files) => {
    setUploading(true)
    for (const file of files) {
      try {
        const url = await uploadPhoto(file, propertyId || 'temp-' + Date.now())
        onAdd(url)
      } catch (e) {
        window.showToast?.('Error al subir foto', 'error')
      }
    }
    setUploading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {photos.map((url, i) => (
          <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button"
              onClick={() => onRemove(i)}
              style={{
                position: 'absolute', top: 2, right: 2,
                background: 'rgba(0,0,0,0.7)', color: 'white',
                border: 'none', borderRadius: '50%', width: 20, height: 20,
                cursor: 'pointer', fontSize: 12, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: 80, height: 80,
            border: '2px dashed var(--border)',
            borderRadius: 8, background: 'var(--bg-input)',
            cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: '1.5rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {uploading ? <span className="spinner" /> : '📷'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => handleFiles(Array.from(e.target.files || []))}
      />
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
        Desde el celular abre la cámara automáticamente.
      </p>
    </div>
  )
}

export default function PropertyModal({ property, onClose, onSave, onDelete, uploadPhoto }) {
  const isEditing  = !!property?.id
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [showPasteBox, setShowPasteBox] = useState(false)
  const [rawText, setRawText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab] = useState('basic') // basic | detail | photos

  useEffect(() => {
    if (property) {
      setForm({
        ...EMPTY_FORM,
        ...property,
        visitDate: property.visitDate?.toDate
          ? property.visitDate.toDate().toISOString().split('T')[0]
          : property.visitDate || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [property])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // --- Geocoding for Map ---
  const handleGeocode = async (customQuery) => {
    const query = customQuery || form.address || form.neighborhood
    if (!query) {
      window.showToast?.('Ingresá una dirección o barrio para ubicar', 'error')
      return
    }
    setGeocoding(true)
    try {
      const loc = await geocodeLocation(query)
      if (loc) {
        set('location', loc)
        window.showToast?.(`📍 Ubicado en el mapa: ${loc.displayName.split(',')[0]}`, 'success')
      } else {
        window.showToast?.('No se encontró esa ubicación. Probá agregar más datos (ej: Godoy Cruz, Mendoza).', 'error')
      }
    } catch (_) {
      window.showToast?.('Error al buscar coordenadas', 'error')
    } finally {
      setGeocoding(false)
    }
  }

  // --- Extract from Pasted Text (e.g. from Zonaprop or WhatsApp) ---
  const handleExtractFromText = () => {
    if (!rawText.trim()) return
    const extracted = parsePastedText(rawText)
    if (extracted.price) set('price', extracted.price)
    if (extracted.expenses) set('expenses', extracted.expenses)
    if (extracted.neighborhood && !form.neighborhood) {
      set('neighborhood', extracted.neighborhood)
      geocodeLocation(extracted.neighborhood).then(loc => {
        if (loc) set('location', loc)
      })
    }
    if (!form.notes) set('notes', rawText.trim().slice(0, 400))
    setShowPasteBox(false)
    setRawText('')
    window.showToast?.('¡Datos extraídos del texto copiado!', 'success')
  }

  // --- URL Scraper ---
  const scrapeUrl = async (inputUrl) => {
    const targetUrl = (typeof inputUrl === 'string' ? inputUrl : form.url).trim()
    if (!targetUrl) return
    setScraping(true)
    try {
      let data = null

      // 1. Try local Vite dev middleware / Netlify serverless function
      try {
        const res = await fetch(`/.netlify/functions/scrape?url=${encodeURIComponent(targetUrl)}`)
        const contentType = res.headers.get('content-type') || ''
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json()
          if (!json.error) {
            data = json
          }
        }
      } catch (err) {
        console.warn('Backend scrape failed, attempting client fallback proxies...', err)
      }

      // 2. Client-side fallback proxies (in case serverless function is unavailable)
      if (!data || (!data.title && !data.price)) {
        const proxyGenerators = [
          (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
          (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
        ]

        for (const makeProxy of proxyGenerators) {
          try {
            const proxyUrl = makeProxy(targetUrl)
            const res = await fetch(proxyUrl)
            if (res.ok) {
              const text = await res.text()
              let html = text
              try {
                const parsed = JSON.parse(text)
                if (parsed.contents) html = parsed.contents
              } catch (_) {}
              const extracted = extractMeta(html, targetUrl)
              if (extracted && (extracted.title || extracted.price)) {
                data = extracted
                break
              }
            }
          } catch (_) {}
        }
      }

      if (!data || (!data.title && !data.price && !data.neighborhood)) {
        throw new Error('No se encontraron datos')
      }

      if (data.title)        set('title',        data.title)
      if (data.neighborhood) set('neighborhood', data.neighborhood)
      if (data.price)        set('price',         data.price)
      if (data.expenses)     set('expenses',     data.expenses)
      if (data.photos?.length) {
        set('photos', data.photos)
      } else if (data.image) {
        set('photos', [data.image])
      }
      if (data.phone && !form.phone) set('phone', data.phone)

      // Auto-geocode neighborhood if location not set yet
      if (data.neighborhood && !form.location) {
        geocodeLocation(data.neighborhood).then(loc => {
          if (loc) set('location', loc)
        })
      }

      if (data.warning) {
        window.showToast?.(data.warning, 'info')
      } else {
        window.showToast?.('¡Datos importados! Revisá y completá lo que falta.', 'success')
      }
    } catch (e) {
      window.showToast?.('No se pudo importar automáticamente. Completá los datos a mano.', 'error')
    } finally {
      setScraping(false)
    }
  }

  // --- Save ---
  const handleSave = async () => {
    if (!form.title && !form.url) {
      window.showToast?.('Agregá al menos un título o URL', 'error')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
      window.showToast?.(isEditing ? 'Propiedad actualizada' : 'Propiedad agregada', 'success')
      onClose()
    } catch (e) {
      window.showToast?.('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await onDelete(property.id, form.photos)
      window.showToast?.('Propiedad eliminada', 'info')
      onClose()
    } catch (e) {
      window.showToast?.('Error al eliminar', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const tabs = [
    { id: 'basic',  label: '📋 Info' },
    { id: 'detail', label: '✍️ Notas' },
    { id: 'photos', label: `📷 Fotos ${form.photos.length > 0 ? `(${form.photos.length})` : ''}` },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={isEditing ? 'Editar propiedad' : 'Nueva propiedad'}>

        {/* Header */}
        <div style={{
          padding: '20px 20px 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <h2>{isEditing ? '✏️ Editar propiedad' : '🏠 Nueva propiedad'}</h2>
            {isEditing && property.createdBy && (
              <p style={{ fontSize: '0.78rem', marginTop: 4 }}>
                Cargado por {property.createdBy.displayName?.split(' ')[0]}
              </p>
            )}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cerrar" style={{ fontSize: '1.2rem', flexShrink: 0 }}>✕</button>
        </div>

        {/* URL Importer */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="input-group">
            <label className="input-label">🔗 URL de la publicación</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="input-url"
                className="input"
                value={form.url}
                onChange={e => set('url', e.target.value)}
                placeholder="https://www.zonaprop.com.ar/..."
                style={{ flex: 1 }}
                onPaste={e => {
                  const pasted = e.clipboardData?.getData('text')?.trim() || ''
                  if (pasted.startsWith('http')) {
                    set('url', pasted)
                    if (!form.title) {
                      setTimeout(() => scrapeUrl(pasted), 60)
                    }
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => scrapeUrl()}
                disabled={scraping || !form.url}
                style={{ flexShrink: 0, minWidth: 90 }}
                id="btn-scrape"
              >
                {scraping ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Importando</> : '⚡ Importar'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, flexWrap: 'wrap', gap: 6 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Pegá la URL y presioná "Importar" para autocompletar.
              </p>
              <button
                type="button"
                onClick={() => setShowPasteBox(b => !b)}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent)',
                  fontSize: '0.73rem', cursor: 'pointer', padding: 0, textDecoration: 'underline'
                }}
              >
                {showPasteBox ? '✕ Cerrar pegado' : '📋 ¿Sitio protegido? Pegar texto'}
              </button>
            </div>

            {showPasteBox && (
              <div style={{
                marginTop: 10, padding: 12, background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)'
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 600 }}>
                  Copiá el texto de Zonaprop o WhatsApp y pegalo acá para autodetectar precio y expensas:
                </p>
                <textarea
                  className="input"
                  rows={3}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Ej: Departamento en alquiler Godoy Cruz $720.000 + $25.000 expensas..."
                  style={{ fontSize: '0.8rem', marginBottom: 8 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExtractFromText}
                  disabled={!rawText.trim()}
                >
                  ⚡ Extraer datos del texto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          padding: '0 20px',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 14px',
                fontSize: '0.82rem', fontWeight: 600,
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>

          {/* === TAB: BASIC === */}
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div className="input-group">
                <label className="input-label">Título</label>
                <input id="input-title" className="input" value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="3 amb. en Palermo con terraza" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">💰 Precio</label>
                  <input id="input-price" className="input" type="number" value={form.price}
                    onChange={e => set('price', e.target.value)}
                    placeholder="250000" />
                </div>
                <div className="input-group">
                  <label className="input-label">+ Expensas</label>
                  <input id="input-expenses" className="input" type="number" value={form.expenses}
                    onChange={e => set('expenses', e.target.value)}
                    placeholder="45000" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">📍 Barrio / Zona</label>
                <input id="input-neighborhood" className="input" value={form.neighborhood}
                  onChange={e => set('neighborhood', e.target.value)}
                  placeholder="Godoy Cruz, Mendoza" />
              </div>

              {/* Address & Geolocation for Map */}
              <div className="input-group">
                <label className="input-label">🗺️ Dirección o Ubicación (para el mapa)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="input-address"
                    className="input"
                    value={form.address || ''}
                    onChange={e => set('address', e.target.value)}
                    placeholder="Ej: Necochea 37, Godoy Cruz"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleGeocode()}
                    disabled={geocoding || (!form.address && !form.neighborhood)}
                    style={{ flexShrink: 0 }}
                  >
                    {geocoding ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '📍 Ubicar'}
                  </button>
                </div>
                {form.location ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: 6, fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.12)',
                    padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <span style={{ color: 'var(--green)' }}>
                      ✓ Ubicado en mapa ({form.location.lat.toFixed(4)}, {form.location.lng.toFixed(4)})
                    </span>
                    <button
                      type="button"
                      onClick={() => set('location', null)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.73rem' }}
                    >
                      Quitar pin
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Tocá "Ubicar" para posicionar esta casa en el mapa interactivo.
                  </p>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">📱 Teléfono de contacto</label>
                <input id="input-phone" className="input" value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="1135001234 (sin 0 ni 15)" />
                {form.phone && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
                    ✅ WhatsApp listo al guardar
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="input-group">
                <label className="input-label">Estado</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set('status', key)}
                      className="btn btn-sm"
                      style={{
                        background: form.status === key ? cfg.bg : 'var(--bg-input)',
                        color: form.status === key ? cfg.color : 'var(--text-secondary)',
                        border: `1px solid ${form.status === key ? cfg.color + '44' : 'var(--border)'}`,
                        transform: form.status === key ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visit date (shows when visited or candidate) */}
              {(form.status === 'visited' || form.status === 'candidate') && (
                <div className="input-group">
                  <label className="input-label">📅 Fecha de visita</label>
                  <input id="input-visit-date" className="input" type="date" value={form.visitDate}
                    onChange={e => set('visitDate', e.target.value)} />
                </div>
              )}

              {/* Rating */}
              <div className="input-group">
                <label className="input-label">Calificación</label>
                <StarRating value={form.rating} onChange={v => set('rating', v)} size={28} />
              </div>

              {/* Finalist toggle */}
              <div className="input-group">
                <label className="input-label">¿Es finalista?</label>
                <button
                  type="button"
                  id="btn-toggle-finalist"
                  onClick={() => set('finalist', !form.finalist)}
                  className="btn btn-sm"
                  style={{
                    alignSelf: 'flex-start',
                    background: form.finalist ? 'var(--gold-dim)' : 'var(--bg-input)',
                    color: form.finalist ? 'var(--gold)' : 'var(--text-secondary)',
                    border: `1px solid ${form.finalist ? 'rgba(245,166,35,0.4)' : 'var(--border)'}`,
                    gap: 6,
                  }}
                >
                  {form.finalist ? '⭐ Finalista — quitar' : '☆ Marcar como finalista'}
                </button>
                {form.finalist && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: 2 }}>
                    Esta propiedad aparecerá destacada al tope de la lista.
                  </p>
                )}
              </div>
            </div>
          )}


          {/* === TAB: DETAIL === */}
          {activeTab === 'detail' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="input-group">
                <label className="input-label" style={{ color: 'var(--green)' }}>✅ Pros</label>
                <TagInput
                  tags={form.pros}
                  type="pro"
                  placeholder="Luminoso, cerca del subte..."
                  onAdd={v => set('pros', [...form.pros, v])}
                  onRemove={i => set('pros', form.pros.filter((_, idx) => idx !== i))}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ color: 'var(--red)' }}>❌ Contras</label>
                <TagInput
                  tags={form.cons}
                  type="con"
                  placeholder="Sin cochera, muy chico..."
                  onAdd={v => set('cons', [...form.cons, v])}
                  onRemove={i => set('cons', form.cons.filter((_, idx) => idx !== i))}
                />
              </div>

              <div className="input-group">
                <label className="input-label">📝 Notas libres</label>
                <textarea
                  id="input-notes"
                  className="input"
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="El dueño dijo que negocia el precio, el piso está en buen estado..."
                  rows={5}
                />
              </div>
            </div>
          )}

          {/* === TAB: PHOTOS === */}
          {activeTab === 'photos' && (
            <div className="input-group">
              <label className="input-label">Fotos de la visita</label>
              <PhotoUpload
                photos={form.photos}
                onAdd={url => set('photos', [...form.photos, url])}
                onRemove={i => set('photos', form.photos.filter((_, idx) => idx !== i))}
                uploadPhoto={uploadPhoto}
                propertyId={property?.id}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-modal)',
          borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
        }}>
          {isEditing ? (
            <button
              type="button"
              className={`btn btn-sm ${confirmDelete ? 'btn-danger' : 'btn-ghost'}`}
              onClick={handleDelete}
              disabled={deleting}
              id="btn-delete-property"
            >
              {deleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : ''}
              {confirmDelete ? '⚠️ Confirmar borrado' : '🗑️ Eliminar'}
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              id="btn-save-property"
            >
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Guardando...</> : isEditing ? '💾 Guardar cambios' : '✅ Agregar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
