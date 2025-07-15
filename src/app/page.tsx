'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import LoginForm from '@/components/LoginForm'
import InviteForm from '@/components/InviteForm'
import WaitlistForm from '@/components/WaitlistForm'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasValidInvite, setHasValidInvite] = useState(false)

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

  const handleValidInvite = () => {
    setHasValidInvite(true)
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  // If user is logged in, show dashboard
  if (user) {
    return (
      <main style={{ 
        padding: '50px 20px', 
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h1 style={{ marginBottom: '20px', color: '#111827' }}>Welcome to Herd by Design!</h1>
        <p style={{ marginBottom: '10px', color: '#6b7280' }}>Logged in as: {user.email}</p>
        
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
        
        <div style={{ 
          marginTop: '40px', 
          padding: '30px', 
          backgroundColor: '#f9fafb', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ marginTop: 0, color: '#111827' }}>Coming Soon:</h2>
          <ul style={{ 
            textAlign: 'left', 
            maxWidth: '300px', 
            margin: '0 auto',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            <li>Contact Management</li>
            <li>AI Gift Recommendations</li>
            <li>Shopping Cart</li>
            <li>Contact Import</li>
          </ul>
        </div>
      </main>
    )
  }

  // If user has valid invite, show signup/login
  if (hasValidInvite) {
    return <LoginForm />
  }

  // Default landing page with invite code and waitlist
  return (
    <main style={{ 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        padding: '60px 20px 40px 20px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          color: '#111827',
          margin: '0 0 20px 0'
        }}>
          Herd
        </h1>
        <p style={{ 
          fontSize: '20px', 
          color: '#6b7280',
          margin: 0,
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: '1.5'
        }}>
          Infrastructure for humans.
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        <InviteForm onValidCode={handleValidInvite} />
        
        <div style={{
          textAlign: 'center',
          margin: '30px 0',
          color: '#9ca3af',
          fontSize: '14px'
        }}>
          OR
        </div>
        
        <WaitlistForm />
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        <p>Herd by Design © 2025</p>
      </div>
    </main>
  )
}