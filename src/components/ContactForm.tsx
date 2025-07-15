'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Contact {
  id?: number
  name: string
  email?: string
  phone?: string
  company?: string
  location?: string
  group_name: string
  notes?: string
  interests?: string[]
  relationship?: string
  job_title?: string
  birthday?: string
  last_contact?: string
  meeting_context?: string
}

interface ContactFormProps {
  user: User
  contact?: Contact | null
  onSave: () => void
  onCancel: () => void
}

export default function ContactForm({ user, contact, onSave, onCancel }: ContactFormProps) {
  const [formData, setFormData] = useState<Contact>({
    name: '',
    email: '',
    phone: '',
    company: '',
    location: '',
    group_name: 'All',
    notes: '',
    interests: [],
    relationship: '',
    job_title: '',
    birthday: '',
    last_contact: '',
    meeting_context: ''
  })
  const [interestsInput, setInterestsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const groups = ['All', 'Family', 'Work', 'Friends', 'Professional']

  useEffect(() => {
    if (contact) {
      setFormData(contact)
      setInterestsInput(contact.interests?.join(', ') || '')
    }
  }, [contact])

  const handleInputChange = (field: keyof Contact, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleInterestsChange = (value: string) => {
    setInterestsInput(value)
    const interestsArray = value
      .split(',')
      .map(interest => interest.trim())
      .filter(interest => interest.length > 0)
    
    setFormData(prev => ({
      ...prev,
      interests: interestsArray
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name.trim()) {
      setError('Name is required')
      setLoading(false)
      return
    }

    try {
      // Clean the data - only include fields that exist in database
      const contactData = {
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        company: formData.company?.trim() || null,
        location: formData.location?.trim() || null,
        group_name: formData.group_name || 'All',
        notes: formData.notes?.trim() || null,
        interests: formData.interests || [],
        relationship: formData.relationship?.trim() || null,
        job_title: formData.job_title?.trim() || null,
        birthday: formData.birthday || null,
        meeting_context: formData.meeting_context?.trim() || null,
        user_id: user.id
      }

      console.log('Submitting contact data:', contactData)
      console.log('User ID:', user.id)
      console.log('User ID type:', typeof user.id)

      if (contact?.id) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', contact.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Create new contact
        const { error } = await supabase
          .from('contacts')
          .insert([contactData])

        if (error) throw error
      }

      onSave()
    } catch (err: unknown) {
      console.error('Full error object:', err)
      let message = 'An error occurred'
      
      if (err instanceof Error) {
        message = err.message
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String(err.message)
      }
      
      console.error('Error message:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#111827' }}>
          {contact?.id ? 'Edit Contact' : 'Add New Contact'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          {/* Name - Required */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="Full name"
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="email@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Company and Job Title */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                Company
              </label>
              <input
                type="text"
                value={formData.company || ''}
                onChange={(e) => handleInputChange('company', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                placeholder="Company name"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                Job Title
              </label>
              <input
                type="text"
                value={formData.job_title || ''}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                placeholder="Job title"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="City, State"
            />
          </div>

          {/* Group and Relationship */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                Group
              </label>
              <select
                value={formData.group_name}
                onChange={(e) => handleInputChange('group_name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                {groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                Relationship
              </label>
              <input
                type="text"
                value={formData.relationship || ''}
                onChange={(e) => handleInputChange('relationship', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                placeholder="e.g., Colleague, Friend"
              />
            </div>
          </div>

          {/* Interests */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
              Interests
            </label>
            <input
              type="text"
              value={interestsInput}
              onChange={(e) => handleInterestsChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="Design, Coffee, Travel (comma separated)"
            />
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
              Separate multiple interests with commas
            </p>
          </div>

          {/* Birthday */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
              Birthday
            </label>
            <input
              type="date"
              value={formData.birthday || ''}
              onChange={(e) => handleInputChange('birthday', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                resize: 'vertical'
              }}
              placeholder="Any notes about this contact..."
            />
          </div>

          {/* Meeting Context */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
              How you met
            </label>
            <input
              type="text"
              value={formData.meeting_context || ''}
              onChange={(e) => handleInputChange('meeting_context', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
              placeholder="e.g., Met at tech conference"
            />
          </div>

          {error && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {loading ? 'Saving...' : (contact?.id ? 'Update Contact' : 'Add Contact')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}