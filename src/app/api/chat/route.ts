import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

function extractNamesFromMessage(message: string): string[] {
  const names: string[] = []
  
  // Simple name extraction patterns
  const patterns = [
    /(?:get|for|give)\s+([A-Z][a-z]+)/gi,
    /([A-Z][a-z]+)\s+for/gi,
    /([A-Z][a-z]+)'s\s+birthday/gi
  ]
  
  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(message)) !== null) {
      const name = match[1].trim()
      if (name.length > 1 && !['Get', 'For', 'The', 'What', 'Should'].includes(name)) {
        names.push(name)
      }
    }
  })
  
  return [...new Set(names)]
}

export async function POST(request: NextRequest) {
  console.log('Chat API called')
  
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const { message, userId } = await request.json()
    console.log('Request:', { message, userId })

    if (!message || !userId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Extract potential names from message
    const searchTerms = extractNamesFromMessage(message)
    console.log('Search terms:', searchTerms)

    let searchedContact = null
    
    // If we have search terms, look for specific contacts
    if (searchTerms.length > 0) {
      for (const term of searchTerms) {
        console.log(`Searching for: "${term}"`)
        const { data: results, error: searchError } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', userId)
          .ilike('name', `%${term}%`)
          .limit(10)

        console.log(`Search results for "${term}":`, results?.map(c => c.name) || [])
        
        if (searchError) {
          console.error('Search error:', searchError)
        }

        if (results && results.length > 0) {
          // Find best match - prioritize first name matches
          searchedContact = results.find(c => 
            c.name.toLowerCase().split(' ')[0] === term.toLowerCase()
          ) || results[0]
          
          console.log(`Best match for "${term}": ${searchedContact.name}`)
          break
        } else {
          console.log(`No results found for "${term}"`)
        }
      }
    }

    // Also log all contact names for debugging
    const { data: debugContacts } = await supabase
      .from('contacts')
      .select('name')
      .eq('user_id', userId)
      .limit(20)
    
    console.log('First 20 contact names:', debugContacts?.map(c => c.name) || [])

    // Get some general contacts too
    const { data: allContacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .limit(10)

    const products = [
      {
        id: 1,
        name: 'Tuberose Candle',
        brand: 'Diptyque',
        price: 78,
        description: 'Sophisticated floral candle',
        interests: ['Design', 'Art', 'Luxury']
      },
      {
        id: 2,
        name: 'Premium Wine Set',
        brand: 'Vintage Selection',
        price: 185,
        description: 'Premium wines from Napa Valley',
        interests: ['Wine', 'Business']
      },
      {
        id: 3,
        name: 'Artisan Coffee Set',
        brand: 'Blue Bottle',
        price: 65,
        description: 'Premium coffee with pour-over set',
        interests: ['Coffee', 'Artisan']
      }
    ]

    const prompt = `You are a gift recommendation assistant.

${searchedContact ? 
  `FOUND CONTACT: ${JSON.stringify(searchedContact)}` : 
  `CONTACTS SAMPLE: ${JSON.stringify(allContacts?.slice(0, 5) || [])}`
}

PRODUCTS: ${JSON.stringify(products)}
USER: "${message}"

${searchedContact ? 
  'Focus on this specific contact and their details for personalized recommendations.' :
  'Provide general guidance or ask for more details about who they want to shop for.'
}

Respond with ONLY valid JSON:
{
  "response": "Your helpful response",
  "recommendedProducts": [{"id": 1, "reason": "why this fits", "contactName": "${searchedContact?.name || ''}"}],
  "suggestedActions": ["Ask about someone specific", "Browse products"]
}`

    console.log('Calling Claude...')
    let response
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
        break // Success, exit retry loop
      } catch (error: unknown) {
        retryCount++
        const errorStatus = error && typeof error === 'object' && 'status' in error ? (error as { status: number }).status : 'unknown'
        console.log(`Attempt ${retryCount} failed:`, errorStatus)
        
        if (errorStatus === 529 && retryCount < maxRetries) {
          // API overloaded, wait and retry
          const waitTime = Math.pow(2, retryCount) * 1000 // Exponential backoff
          console.log(`Retrying in ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          throw error // Give up after max retries or non-retryable error
        }
      }
    }

    if (!response) {
      // Fallback mock response when API is overloaded
      console.log('Using mock response due to API overload')
      return NextResponse.json({
        response: `I found ${searchedContact ? searchedContact.name : 'some contacts'} in your list! Based on their profile, I'd recommend checking out our curated gift options. The Artisan Coffee Set would make a great birthday gift.`,
        recommendedProducts: [
          {
            id: 3,
            reason: "Coffee makes a universally appreciated gift",
            contactName: searchedContact?.name || ""
          }
        ],
        suggestedActions: ["Tell me more about their interests", "Show me other gift options"]
      })
    }

    const responseText = response.content[0]?.text || '{}'
    
    try {
      const parsed = JSON.parse(responseText)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({
        response: "I'd be happy to help with gift recommendations!",
        recommendedProducts: [],
        suggestedActions: ["Ask about gift recommendations"]
      })
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}