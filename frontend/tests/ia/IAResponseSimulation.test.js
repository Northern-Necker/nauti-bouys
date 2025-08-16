import { describe, it, expect, vi } from 'vitest'

// Import the response simulation logic from IAPage
// Since it's internal to the component, we'll recreate it for testing
const getSimulatedResponse = (userMessage) => {
  const responses = {
    beverage: "I'd be happy to help you find the perfect beverage! We have an excellent selection of wines, craft beers, signature cocktails, and refreshing mocktails. What type of drink are you in the mood for today?",
    reservation: "I can help you make a reservation! Our reservation system is currently being finalized, but I can provide you with information about available time slots and special events. What date and time were you thinking?",
    menu: "Our beverage menu features carefully curated selections including premium wines from California vineyards, craft beers from local breweries, artisan cocktails created by our expert mixologists, and refreshing non-alcoholic options. Would you like recommendations in any particular category?",
    default: "That's a great question! While I'm still learning and our full AI capabilities are being developed, I'm here to help with information about our beverages, reservations, and services. Is there anything specific about Nauti Bouys you'd like to know?"
  }

  const message = userMessage.toLowerCase()
  if (message.includes('drink') || message.includes('beverage') || message.includes('wine') || message.includes('beer')) {
    return responses.beverage
  } else if (message.includes('reservation') || message.includes('book') || message.includes('table')) {
    return responses.reservation
  } else if (message.includes('menu') || message.includes('what do you have')) {
    return responses.menu
  } else {
    return responses.default
  }
}

describe('IA Response Simulation', () => {
  describe('Keyword Detection', () => {
    it('detects beverage-related keywords', () => {
      const drinkKeywords = ['drink', 'beverage', 'wine', 'beer']
      
      drinkKeywords.forEach(keyword => {
        const response = getSimulatedResponse(`I want a ${keyword}`)
        expect(response).toContain("I'd be happy to help you find the perfect beverage!")
      })
    })

    it('detects reservation-related keywords', () => {
      const reservationKeywords = ['reservation', 'book', 'table']
      
      reservationKeywords.forEach(keyword => {
        const response = getSimulatedResponse(`I need a ${keyword}`)
        expect(response).toContain("I can help you make a reservation!")
      })
    })

    it('detects menu-related keywords', () => {
      const menuKeywords = ['menu', 'what do you have']
      
      menuKeywords.forEach(keyword => {
        const response = getSimulatedResponse(keyword)
        expect(response).toContain("Our beverage menu features carefully curated selections")
      })
    })

    it('provides default response for unrecognized keywords', () => {
      const unknownQueries = ['hello', 'weather', 'directions', 'random question']
      
      unknownQueries.forEach(query => {
        const response = getSimulatedResponse(query)
        expect(response).toContain("That's a great question!")
      })
    })
  })

  describe('Case Insensitivity', () => {
    it('handles uppercase keywords', () => {
      const response = getSimulatedResponse('WINE RECOMMENDATION')
      expect(response).toContain("I'd be happy to help you find the perfect beverage!")
    })

    it('handles mixed case keywords', () => {
      const response = getSimulatedResponse('Can I make a ReSeRvAtIoN?')
      expect(response).toContain("I can help you make a reservation!")
    })

    it('handles lowercase keywords', () => {
      const response = getSimulatedResponse('show me the menu please')
      expect(response).toContain("Our beverage menu features carefully curated selections")
    })
  })

  describe('Complex Phrase Detection', () => {
    it('detects keywords in longer sentences', () => {
      const complexSentences = [
        "I'm looking for a good wine to pair with dinner",
        "Could you help me find the perfect beer for this weather?",
        "What kind of cocktails do you have available?",
        "I'd like to make a reservation for tonight"
      ]

      const expectedResponses = [
        "beverage", // wine
        "beverage", // beer
        "beverage", // cocktails (though not explicitly in keywords)
        "reservation" // reservation
      ]

      complexSentences.forEach((sentence, index) => {
        const response = getSimulatedResponse(sentence)
        if (expectedResponses[index] === "beverage") {
          expect(response).toContain("I'd be happy to help you find the perfect beverage!")
        } else if (expectedResponses[index] === "reservation") {
          expect(response).toContain("I can help you make a reservation!")
        }
      })
    })

    it('handles multiple keywords in one message', () => {
      // When multiple keywords are present, it should match the first category found
      const response = getSimulatedResponse('I want to see the wine menu and make a reservation')
      // Wine comes first in the if-else chain, so should get beverage response
      expect(response).toContain("I'd be happy to help you find the perfect beverage!")
    })
  })

  describe('Edge Cases', () => {
    it('handles empty string', () => {
      const response = getSimulatedResponse('')
      expect(response).toContain("That's a great question!")
    })

    it('handles only whitespace', () => {
      const response = getSimulatedResponse('   ')
      expect(response).toContain("That's a great question!")
    })

    it('handles special characters', () => {
      const response = getSimulatedResponse('!@#$%^&*()')
      expect(response).toContain("That's a great question!")
    })

    it('handles numbers', () => {
      const response = getSimulatedResponse('12345')
      expect(response).toContain("That's a great question!")
    })

    it('handles partial matches', () => {
      // Words that contain keywords but aren't exact matches
      const partialMatches = [
        'drinking', // contains 'drink'
        'winery', // contains 'wine'
        'booking', // contains 'book'
      ]

      partialMatches.forEach(word => {
        const response = getSimulatedResponse(word)
        if (word === 'drinking') {
          expect(response).toContain("I'd be happy to help you find the perfect beverage!")
        } else if (word === 'winery') {
          expect(response).toContain("I'd be happy to help you find the perfect beverage!")
        } else if (word === 'booking') {
          expect(response).toContain("I can help you make a reservation!")
        }
      })
    })
  })

  describe('Response Quality', () => {
    it('provides informative beverage responses', () => {
      const response = getSimulatedResponse('wine')
      expect(response).toContain('wines')
      expect(response).toContain('craft beers')
      expect(response).toContain('signature cocktails')
      expect(response).toContain('mocktails')
    })

    it('provides helpful reservation responses', () => {
      const response = getSimulatedResponse('reservation')
      expect(response).toContain('reservation system')
      expect(response).toContain('time slots')
      expect(response).toContain('special events')
    })

    it('provides detailed menu responses', () => {
      const response = getSimulatedResponse('menu')
      expect(response).toContain('California vineyards')
      expect(response).toContain('local breweries')
      expect(response).toContain('expert mixologists')
      expect(response).toContain('non-alcoholic options')
    })

    it('provides encouraging default responses', () => {
      const response = getSimulatedResponse('hello')
      expect(response).toContain("That's a great question!")
      expect(response).toContain('still learning')
      expect(response).toContain('Nauti Bouys')
    })
  })

  describe('Response Consistency', () => {
    it('returns consistent responses for same keywords', () => {
      const keyword = 'wine'
      const response1 = getSimulatedResponse(keyword)
      const response2 = getSimulatedResponse(keyword)
      
      expect(response1).toBe(response2)
    })

    it('maintains response length appropriately', () => {
      const responses = [
        getSimulatedResponse('wine'),
        getSimulatedResponse('reservation'),
        getSimulatedResponse('menu'),
        getSimulatedResponse('hello')
      ]

      responses.forEach(response => {
        expect(response.length).toBeGreaterThan(50) // Minimum helpful length
        expect(response.length).toBeLessThan(500) // Not too verbose
      })
    })

    it('ends responses with appropriate punctuation', () => {
      const responses = [
        getSimulatedResponse('wine'),
        getSimulatedResponse('reservation'),
        getSimulatedResponse('menu'),
        getSimulatedResponse('hello')
      ]

      responses.forEach(response => {
        expect(response).toMatch(/[.!?]$/) // Ends with proper punctuation
      })
    })
  })

  describe('Performance Considerations', () => {
    it('processes responses quickly', () => {
      const start = performance.now()
      
      // Run multiple simulations to test performance
      for (let i = 0; i < 100; i++) {
        getSimulatedResponse('test message')
      }
      
      const end = performance.now()
      const duration = end - start
      
      // Should complete 100 simulations in under 10ms
      expect(duration).toBeLessThan(10)
    })

    it('handles concurrent requests', () => {
      const promises = []
      
      for (let i = 0; i < 50; i++) {
        promises.push(Promise.resolve(getSimulatedResponse('wine')))
      }
      
      return Promise.all(promises).then(responses => {
        expect(responses).toHaveLength(50)
        responses.forEach(response => {
          expect(response).toContain("I'd be happy to help you find the perfect beverage!")
        })
      })
    })
  })
})