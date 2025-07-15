'use client'
import { useState } from 'react'

interface InviteFormProps {
  onValidCode: () => void
}

export default function InviteForm({ onValidCode }: InviteFormProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validCodes = ['herdbeta2025', 'HERDBETA2025'] // Case insensitive

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simulate checking
    setTimeout(() => {
      if (validCodes.includes(inviteCode.trim())) {
        onValidCode()
      } else {
        setError('Invalid invite code. Please check your code and try again.')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '30px',
      margin: '20px 0'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Have an Invite Code?</h3>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
        Enter your invite code to create your account.
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder="Enter invite code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
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
          disabled={loading || !inviteCode.trim()}
          style={{
            padding: '12px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Checking...' : 'Continue'}
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