'use client'
import ContactList from '@/components/ContactList'
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
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    
    getSession()

    // Listen for auth changes and handle token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        }
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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

  // If user is logged in, show contact management
  if (user) {
    return <ContactList user={user} />
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