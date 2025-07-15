'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email }])
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setError('This email is already on our waitlist!')
        } else {
          throw error
        }
      } else {
        setSuccess(true)
        setEmail('')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '30px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h3 style={{ color: '#15803d', marginBottom: '10px' }}>
          ✅ You&apos;re on the list!
        </h3>
        <p style={{ color: '#166534', margin: 0 }}>
          We&apos;ll send you an invite code when Herd is ready for early access.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '30px',
      margin: '20px 0'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Join the Waitlist</h3>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
        Get early access when we&apos;re ready to launch.
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '16px'
          }}
        />
        
        <button
          type="submit"
          disabled={loading || !email.trim()}
          style={{
            padding: '12px',
            backgroundColor: loading ? '#9ca3af' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Adding...' : 'Join Waitlist'}
        </button>
      </form>
      
      {error && (
        <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '10px' }}>
          {error}
        </p>
      )}
    </div>
  )
}