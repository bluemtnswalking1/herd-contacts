'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import LoginForm from '@/components/LoginForm'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <main style={{ padding: '50px 20px', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '20px' }}>Welcome to Herd by Design!</h1>
      <p style={{ marginBottom: '10px' }}>Logged in as: {user.email}</p>
      
      <button
        onClick={handleSignOut}
        style={{
          padding: '10px 20px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Sign Out
      </button>
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h2>Coming Soon:</h2>
        <ul style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto' }}>
          <li>Contact Management</li>
          <li>AI Gift Recommendations</li>
          <li>Shopping Cart</li>
          <li>Contact Import</li>
        </ul>
      </div>
    </main>
  )
}