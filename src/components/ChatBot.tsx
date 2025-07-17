'use client'
import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  recommendedProducts?: Array<{
    id: number
    reason: string
    contactName?: string
  }>
  suggestedActions?: string[]
  timestamp: Date
}

interface ChatBotProps {
  user: User
  isOpen: boolean
  onClose: () => void
}

export default function ChatBot({ user, isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat opens
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm your AI gift assistant. I can help you find perfect gifts for your contacts based on their interests and your relationship. Try asking 'What should I get [contact name] for their birthday?'",
        suggestedActions: [
          "What should I get for a birthday?",
          "Show me my work contacts",
          "Help me find a gift under $100"
        ],
        timestamp: new Date()
      }])
    }
  }, [isOpen, messages.length])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Chat service unavailable')
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        recommendedProducts: data.recommendedProducts || [],
        suggestedActions: data.suggestedActions || [],
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSuggestedAction = (action: string) => {
    setInput(action)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h3 style={{ margin: 0, color: '#111827' }}>AI Gift Assistant</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '5px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((message, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: message.role === 'user' ? '#3b82f6' : '#f1f5f9',
                color: message.role === 'user' ? 'white' : '#334155'
              }}>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {message.content}
                </div>

                {/* Recommended Products */}
                {message.recommendedProducts && message.recommendedProducts.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>
                      Recommended:
                    </div>
                    {message.recommendedProducts.map((product, idx) => (
                      <div key={idx} style={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '6px',
                        fontSize: '14px'
                      }}>
                        <div style={{ fontWeight: '500', color: '#1e293b' }}>
                          Product #{product.id}
                          {product.contactName && ` for ${product.contactName}`}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '13px' }}>
                          {product.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Actions */}
                {message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>
                      Try asking:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {message.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedAction(action)}
                          style={{
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '13px',
                            color: '#475569',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          "{action}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                backgroundColor: '#f1f5f9',
                borderRadius: '18px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#64748b',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#64748b',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                }} />
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#64748b',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder=&quot;Ask about gift recommendations&quot;
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '24px',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '12px',
                backgroundColor: loading || !input.trim() ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}