import { useState, useEffect } from 'react'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'

export function useAuth() {
  const [user, setUser]       = useState(undefined) // undefined = loading
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const logout = () => signOut(auth)

  return { user, loading, login, logout }
}
