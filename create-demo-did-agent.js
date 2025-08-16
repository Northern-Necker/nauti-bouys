/**
 * Create Demo D-ID Agent for Nauti-Bouys
 * This script creates a basic D-ID agent for testing the SDK integration
 */

const DID_API_KEY = 'bWV0b3JiZXJ0QGdtYWlsLmNvbQ:JAn6hh4wQ2TFoOAl-GD4F'
const DID_BASE_URL = 'https://api.d-id.com'

async function listAvailablePresenters() {
  try {
    console.log('📋 Checking available presenters...')
    
    const response = await fetch(`${DID_BASE_URL}/clips/presenters`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const presenters = await response.json()
    console.log('✅ Available presenters:', presenters.slice(0, 5)) // Show first 5
    
    return presenters
  } catch (error) {
    console.error('❌ Failed to list presenters:', error.message)
    return []
  }
}

async function createDemoAgent() {
  try {
    console.log('🚀 Creating Demo D-ID Agent for Nauti-Bouys...')

    // First, let's check available presenters
    const presenters = await listAvailablePresenters()
    
    // Use the first available presenter or a default one
    let presenterId = 'amy-jcwCkr1grs' // Default fallback
    if (presenters && presenters.length > 0) {
      // Find a female presenter if available
      const femalePresenter = presenters.find(p => 
        p.presenter_id && (
          p.presenter_id.includes('amy') || 
          p.presenter_id.includes('noelle') || 
          p.presenter_id.includes('sara')
        )
      )
      if (femalePresenter) {
        presenterId = femalePresenter.presenter_id
        console.log(`📝 Using presenter: ${presenterId}`)
      } else {
        presenterId = presenters[0].presenter_id
        console.log(`📝 Using first available presenter: ${presenterId}`)
      }
    }

    // Create a basic agent configuration
    const agentConfig = {
      name: "Savannah - Nauti Bouys Bartender",
      description: "AI Bartender and Concierge for Nauti-Bouys Bar",
      presenter: {
        type: "clip",
        presenter_id: presenterId,
        voice: {
          type: "microsoft",
          voice_id: "en-US-JennyMultilingualV2Neural"
        }
      },
      llm: {
        type: "openai_compatible",
        model: "gpt-3.5-turbo",
        instructions: `You are Savannah, the AI Bartender and Concierge at Nauti-Bouys Bar. 
        You are knowledgeable about cocktails, spirits, wines, and beers. 
        You provide friendly, professional service with a warm maritime charm. 
        Keep responses conversational and helpful, focusing on beverage recommendations and bar service.`,
        api_key: "demo-key-placeholder"
      },
      greetings: [
        "Ahoy! Welcome to Nauti-Bouys! I'm Savannah, your AI bartender. How can I help you navigate our beverage selection today?"
      ]
    }

    console.log('📋 Agent Configuration:')
    console.log(JSON.stringify(agentConfig, null, 2))

    // Make API call to create agent
    const response = await fetch(`${DID_BASE_URL}/agents`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agentConfig)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const agent = await response.json()
    
    console.log('✅ Demo Agent Created Successfully!')
    console.log('📝 Agent Details:')
    console.log(`   ID: ${agent.id}`)
    console.log(`   Name: ${agent.name}`)
    console.log(`   Status: ${agent.status}`)
    
    console.log('\n🔧 Update your frontend/.env file:')
    console.log(`VITE_DID_AGENT_ID=${agent.id}`)
    
    return agent

  } catch (error) {
    console.error('❌ Failed to create demo agent:', error.message)
    
    if (error.message.includes('401')) {
      console.log('\n💡 Authentication failed. Please check your D-ID API key.')
    } else if (error.message.includes('403')) {
      console.log('\n💡 Permission denied. You may need to upgrade your D-ID plan to create agents.')
    } else if (error.message.includes('429')) {
      console.log('\n💡 Rate limit exceeded. Please wait and try again.')
    }
    
    throw error
  }
}

// Run the script
if (require.main === module) {
  createDemoAgent()
    .then(agent => {
      console.log('\n🎉 Demo agent setup complete!')
      console.log('Next steps:')
      console.log('1. Update VITE_DID_AGENT_ID in frontend/.env')
      console.log('2. Restart your frontend development server')
      console.log('3. Test the D-ID Agent component')
    })
    .catch(error => {
      console.error('\n💥 Setup failed:', error.message)
      process.exit(1)
    })
}

module.exports = { createDemoAgent }
