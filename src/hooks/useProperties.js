import { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy,
  arrayUnion, arrayRemove
} from 'firebase/firestore'

// ── Cloudinary unsigned upload ─────────────────────────────────────────────
// Uses an unsigned upload preset — safe to call from the browser, no secret exposed.
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

async function uploadToCloudinary(file) {
  const formData = new FormData()
  formData.append('file',           file)
  formData.append('upload_preset',  UPLOAD_PRESET)
  formData.append('folder',         'buscacasa')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) throw new Error(`Cloudinary error: ${res.status}`)
  const data = await res.json()
  return data.secure_url // e.g. https://res.cloudinary.com/...
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useProperties(user) {
  const [properties, setProperties] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!user) { setProperties([]); setLoading(false); return }
    const q    = query(collection(db, 'properties'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setProperties(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user])

  const userInfo = () => ({
    uid:         user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
    email:       user.email || '',
  })

  const addProperty = async (data) =>
    addDoc(collection(db, 'properties'), {
      ...data,
      finalist: false,
      viewedBy: [userInfo()],
      createdBy:  userInfo(),
      createdAt:  serverTimestamp(),
      updatedAt:  serverTimestamp(),
    })

  const updateProperty = async (id, data) =>
    updateDoc(doc(db, 'properties', id), {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userInfo(),
    })

  // eslint-disable-next-line no-unused-vars
  const deleteProperty = async (id, _photos) =>
    // Note: Cloudinary photos stay in the cloud (unsigned preset can't delete).
    // Free tier has ample space for this use-case.
    deleteDoc(doc(db, 'properties', id))

  // Upload a photo to Cloudinary and return the public URL
  const uploadPhoto = async (file) => uploadToCloudinary(file)

  // Toggle current user in viewedBy array
  const markViewed = async (id, alreadyViewed) => {
    const info = userInfo()
    await updateDoc(doc(db, 'properties', id), {
      viewedBy: alreadyViewed
        ? arrayRemove({ uid: info.uid, displayName: info.displayName, email: info.email })
        : arrayUnion({ uid: info.uid, displayName: info.displayName, email: info.email }),
    })
  }

  const toggleFinalist = async (id, current) =>
    updateDoc(doc(db, 'properties', id), {
      finalist:  !current,
      updatedAt: serverTimestamp(),
    })

  return {
    properties, loading,
    addProperty, updateProperty, deleteProperty,
    uploadPhoto, markViewed, toggleFinalist,
  }
}
