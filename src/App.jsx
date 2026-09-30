import { useState, useCallback } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProperties } from './hooks/useProperties'
import Login from './components/Login'
import Header from './components/Header'
import PropertyList from './components/PropertyList'
import PropertyModal from './components/PropertyModal'
import ToastContainer from './components/ToastContainer'

export default function App() {
  const { user, loading: authLoading, login, logout } = useAuth()
  const {
    properties, loading: propsLoading,
    addProperty, updateProperty, deleteProperty,
    uploadPhoto, markViewed, toggleFinalist,
  } = useProperties(user)

  const [modalOpen, setModalOpen]     = useState(false)
  const [editingProp, setEditingProp] = useState(null)

  const openNew  = () => { setEditingProp(null); setModalOpen(true) }
  const openEdit = useCallback((property) => { setEditingProp(property); setModalOpen(true) }, [])
  const closeModal = () => { setModalOpen(false); setEditingProp(null) }

  const handleSave = async (formData) => {
    const data = { ...formData }
    data.visitDate = data.visitDate ? new Date(data.visitDate) : null
    if (editingProp?.id) {
      await updateProperty(editingProp.id, data)
    } else {
      await addProperty(data)
    }
  }

  const handleDelete = async (id, photos) => {
    await deleteProperty(id, photos)
  }

  const handleStatusChange = async (id, newStatus) => {
    await updateProperty(id, { status: newStatus })
    window.showToast?.('Estado actualizado ✓', 'success')
  }

  const handleMarkViewed = async (id, alreadyViewed) => {
    await markViewed(id, alreadyViewed)
    window.showToast?.(alreadyViewed ? 'Marca de vista quitada' : 'Marcado como visto ✓', 'success')
  }

  const handleToggleFinalist = async (id, current) => {
    await toggleFinalist(id, current)
    window.showToast?.(current ? 'Quitado de finalistas' : '⭐ Marcado como finalista!', 'success')
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)',
        flexDirection: 'column', gap: 20,
      }}>
        <span style={{ fontSize: 48 }}>🏠</span>
        <span className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Login onLogin={login} />
        <ToastContainer />
      </>
    )
  }

  const displayName = user.displayName || user.email?.split('@')[0] || 'vos'

  return (
    <>
      <Header user={user} onLogout={logout} onNewProperty={openNew} />

      <main className="container" style={{ paddingTop: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20, flexWrap: 'wrap', gap: 8,
        }}>
          <h1 style={{ fontSize: '1.2rem' }}>
            Propiedades{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.95rem' }}>
              ({properties.length})
            </span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Hola, {displayName.split(' ')[0]} 👋
          </p>
        </div>

        <PropertyList
          properties={properties}
          loading={propsLoading}
          onEdit={openEdit}
          onStatusChange={handleStatusChange}
          onMarkViewed={handleMarkViewed}
          onToggleFinalist={handleToggleFinalist}
          currentUser={user}
        />
      </main>

      {/* FAB */}
      <button
        id="fab-add"
        className="btn btn-primary"
        onClick={openNew}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          borderRadius: 99, width: 56, height: 56,
          fontSize: '1.7rem', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(233,69,96,0.5)',
          zIndex: 40,
        }}
        aria-label="Agregar propiedad"
      >+</button>

      {modalOpen && (
        <PropertyModal
          property={editingProp}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
          uploadPhoto={uploadPhoto}
        />
      )}

      <ToastContainer />
    </>
  )
}
