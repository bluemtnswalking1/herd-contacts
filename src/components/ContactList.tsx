'use client'
import ContactImport from './ContactImport'
import ContactForm from './ContactForm'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Contact {
  id: number
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
  created_at: string
}

interface ContactListProps {
  user: User
}

export default function ContactList({ user }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showImport, setShowImport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState('All')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const groups = ['All', 'Family', 'Work', 'Friends', 'Professional']

  useEffect(() => {
    fetchContacts()
  }, [user])

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteContact = async (contactId: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user.id)

      if (error) throw error
      setContacts(contacts.filter(c => c.id !== contactId))
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

const handleSaveContact = () => {
    setShowAddForm(false)
    setEditingContact(null)
    fetchContacts() // Refresh the list
  }

  const handleCancelForm = () => {
    setShowAddForm(false)
    setEditingContact(null)
  }

  const filteredContacts = selectedGroup === 'All' 
    ? contacts 
    : contacts.filter(contact => contact.group_name === selectedGroup)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Loading contacts...</p>
      </div>
    )
  }

const handleImportComplete = () => {
    setShowImport(false)
    fetchContacts() // Refresh the contact list
  }

  const handleCancelImport = () => {
    setShowImport(false)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#111827' }}>Your Contacts</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Logged in as: {user.email}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowImport(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📱 Import
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Add Contact
          </button>
          <button
            onClick={handleSignOut}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Group Filter */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedGroup === group ? '#3b82f6' : '#f3f4f6',
                color: selectedGroup === group ? 'white' : '#374151',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Contact List */}
      {filteredContacts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {selectedGroup === 'All' 
              ? 'No contacts yet. Add your first contact to get started!'
              : `No contacts in ${selectedGroup} group.`
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredContacts.map(contact => (
            <div key={contact.id} style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#111827' }}>{contact.name}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '14px' }}>
                    {contact.relationship || 'Contact'}
                  </p>
                  
                  <div style={{ display: 'grid', gap: '5px', fontSize: '14px' }}>
                    {contact.email && (
                      <div style={{ color: '#6b7280' }}>📧 {contact.email}</div>
                    )}
                    {contact.phone && (
                      <div style={{ color: '#6b7280' }}>📱 {contact.phone}</div>
                    )}
                    {contact.company && (
                      <div style={{ color: '#6b7280' }}>🏢 {contact.company}</div>
                    )}
                    {contact.location && (
                      <div style={{ color: '#6b7280' }}>📍 {contact.location}</div>
                    )}
                  </div>

                  {contact.notes && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {contact.notes}
                    </div>
                  )}

                  {contact.interests && contact.interests.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      {contact.interests.map((interest, idx) => (
                        <span key={idx} style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '12px',
                          fontSize: '12px',
                          marginRight: '5px',
                          marginBottom: '5px'
                        }}>
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                  <button
                    onClick={() => setEditingContact(contact)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
{/* Add/Edit Contact Form */}
      {(showAddForm || editingContact) && (
        <ContactForm
          user={user}
          contact={editingContact}
          onSave={handleSaveContact}
          onCancel={handleCancelForm}
        />
      )}
{/* Import Modal */}
      {showImport && (
        <ContactImport
          user={user}
          onImportComplete={handleImportComplete}
          onCancel={handleCancelImport}
        />
      )}
    </div>
  )
}