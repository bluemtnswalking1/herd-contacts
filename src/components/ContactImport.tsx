'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Contact {
  name: string
  email: string
  phone: string
  company: string
  location: string
  job_title: string
  birthday: string | null
  notes: string
  relationship: string
  group_name: string
}

interface ContactImportProps {
  user: User
  onImportComplete: () => void
  onCancel: () => void
}

export default function ContactImport({ user, onImportComplete, onCancel }: ContactImportProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Contact[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setError('')

    try {
      const text = await selectedFile.text()
      console.log('File loaded, first 200 chars:', text.substring(0, 200))
      
      const contacts = parseCSV(text)
      console.log('Parsed contacts:', contacts.length)
      
      setPreview(contacts.slice(0, 3))
    } catch (err) {
      console.error('File parsing error:', err)
      setError('Error reading file')
    }
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('File appears to be empty')

    // Get headers from first line
    const headerLine = lines[0]
    const headers = parseCSVLine(headerLine)
    console.log('CSV Headers found:', headers)

    const contacts = []

    for (let i = 1; i < lines.length; i++) { // Import all contacts
      const values = parseCSVLine(lines[i])
      if (values.length < 2) continue

      // Create contact object from CSV row
      const contact: Record<string, string> = {}
      headers.forEach((header, index) => {
        contact[header] = values[index] || ''
      })

      // Map to our contact structure
      const mappedContact = {
        name: buildName(contact),
        email: extractEmail(contact),
        phone: extractPhone(contact),
        company: contact['Company'] || '',
        location: extractLocation(contact),
        job_title: contact['Job title'] || '',
        birthday: parseDate(contact['Birthday']),
        notes: '',
        relationship: 'iPhone Contact',
        group_name: 'Imported'
      }

      // Only add if we have a name
      if (mappedContact.name && mappedContact.name.trim() && mappedContact.name !== 'Unknown') {
        contacts.push(mappedContact)
      }
    }

    return contacts
  }

  const parseCSVLine = (line: string): string[] => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim().replace(/^"|"$/g, ''))
    return result
  }

  const buildName = (contact: Record<string, string>): string => {
    const firstName = contact['First name'] || ''
    const middleName = contact['Middle name'] || ''
    const lastName = contact['Last name'] || ''
    
    const fullName = [firstName, middleName, lastName]
      .filter(n => n && n.trim())
      .join(' ')
      .trim()
    
    return fullName || 'Unknown'
  }

const parseDate = (dateString: string): string | null => {
    if (!dateString || !dateString.trim()) return null
    
    try {
      // Handle various date formats from iPhone export
      const cleanDate = dateString.trim()
      
      // If it looks like "3/22/01 4:07 PM", extract just the date part
      if (cleanDate.includes(' ')) {
        const datePart = cleanDate.split(' ')[0] // Gets "3/22/01"
        const date = new Date(datePart)
        
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
        }
      }
      
      // Try parsing the full string
      const date = new Date(cleanDate)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
      
      return null
    } catch {
      return null
    }
  }

  const extractEmail = (contact: Record<string, string>): string => {
    const emailFields = [
      'Email : home',
      'Email : work', 
      'Email : ',
      'Email : other'
    ]
    
    for (const field of emailFields) {
      const email = contact[field]
      if (email && email.includes('@')) {
        return email
      }
    }
    return ''
  }

  const extractPhone = (contact: Record<string, string>): string => {
    const phoneFields = [
      'Phone : mobile',
      'Phone : iPhone', 
      'Phone : home',
      'Phone : work',
      'Phone : ',
      'Phone : main'
    ]
    
    for (const field of phoneFields) {
      const phone = contact[field]
      if (phone && phone.replace(/[^\d]/g, '').length >= 7) {
        return phone
      }
    }
    return ''
  }

  const extractLocation = (contact: Record<string, string>): string => {
    const city = contact['Address : home : City'] || contact['Address : work : City'] || ''
    const state = contact['Address : home : State'] || contact['Address : work : State'] || ''
    
    return [city, state].filter(l => l).join(', ').trim()
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    setError('')

    try {
      const text = await file.text()
      const contacts = parseCSV(text)
      
      console.log(`Preparing to import ${contacts.length} contacts`)
      
      // Add user_id and metadata
      const contactsWithUserId = contacts.map(contact => ({
        ...contact,
        user_id: user.id,
        source: 'csv_import',
        created_at: new Date().toISOString()
      }))

      console.log('Sample contact for DB:', contactsWithUserId[0])

      // Insert in small batches
      const batchSize = 50 // Larger batches for faster import
      let totalInserted = 0

      for (let i = 0; i < contactsWithUserId.length; i += batchSize) {
        const batch = contactsWithUserId.slice(i, i + batchSize)
        const batchNum = Math.floor(i/batchSize) + 1
        const totalBatches = Math.ceil(contactsWithUserId.length/batchSize)
        
        console.log(`Inserting batch ${batchNum}/${totalBatches} (${batch.length} contacts)`)
        
        const { error: insertError } = await supabase
          .from('contacts')
          .insert(batch)
          .select()

        if (insertError) {
          console.error('Insert error:', insertError)
          throw new Error(`Database error: ${insertError.message}`)
        }

        totalInserted += batch.length
        console.log(`✅ Batch ${batchNum} successful. Total: ${totalInserted}/${contactsWithUserId.length}`)
        
        // Small delay to prevent overwhelming the database
        if (i + batchSize < contactsWithUserId.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log(`All ${totalInserted} contacts imported successfully!`)
      onImportComplete()
      
    } catch (err: unknown) {
      console.error('Import failed:', err)
      const message = err instanceof Error ? err.message : 'Import failed'
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
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ margin: '0 0 20px 0' }}>Import Apple Contacts</h2>

        {/* File Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
            Select CSV File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#f9fafb'
            }}
          />
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
              Preview (first 3 contacts)
            </h3>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {preview.map((contact, idx) => (
                <div key={idx} style={{
                  padding: '10px',
                  borderBottom: idx < preview.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ fontWeight: '500' }}>{contact.name}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {contact.email && `📧 ${contact.email}`}
                    {contact.phone && ` | 📱 ${contact.phone}`}
                    {contact.company && ` | 🏢 ${contact.company}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading || !file ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Importing...' : 'Import Contacts'}
          </button>
        </div>
      </div>
    </div>
  )
}