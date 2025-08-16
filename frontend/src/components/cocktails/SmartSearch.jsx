import { useState, useEffect, useRef } from 'react'
import { Search, X, Clock, Star, Zap } from 'lucide-react'

const SmartSearch = ({ onSearchChange, cocktails, recentSearches, onRecentSearchClick }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Generate suggestions based on search term
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const newSuggestions = []

    // Search by cocktail name
    const nameMatches = cocktails
      .filter(cocktail => cocktail.name.toLowerCase().includes(searchLower))
      .slice(0, 3)
      .map(cocktail => ({
        type: 'cocktail',
        text: cocktail.name,
        subtitle: `${cocktail.primarySpirit || 'Mixed'} • $${cocktail.price}`,
        icon: Star,
        data: cocktail
      }))

    // Search by ingredients
    const ingredientMatches = []
    cocktails.forEach(cocktail => {
      if (cocktail.ingredients) {
        const matchingIngredients = cocktail.ingredients.filter(ing => 
          ing.name.toLowerCase().includes(searchLower)
        )
        if (matchingIngredients.length > 0) {
          ingredientMatches.push({
            type: 'ingredient',
            text: `Drinks with ${matchingIngredients[0].name}`,
            subtitle: `${cocktail.name} and others`,
            icon: Zap,
            data: { ingredient: matchingIngredients[0].name }
          })
        }
      }
    })

    // Search by spirit type
    const spiritMatches = []
    const spirits = ['vodka', 'gin', 'rum', 'whiskey', 'tequila', 'brandy', 'mezcal']
    spirits.forEach(spirit => {
      if (spirit.includes(searchLower)) {
        const spiritCocktails = cocktails.filter(c => 
          c.primarySpirit?.toLowerCase().includes(spirit)
        )
        if (spiritCocktails.length > 0) {
          spiritMatches.push({
            type: 'spirit',
            text: `${spirit.charAt(0).toUpperCase() + spirit.slice(1)} cocktails`,
            subtitle: `${spiritCocktails.length} available`,
            icon: Search,
            data: { spirit }
          })
        }
      }
    })

    // Search by flavor profile
    const flavorMatches = []
    const flavors = ['sweet', 'sour', 'bitter', 'spicy', 'fruity', 'herbal', 'citrus', 'tropical']
    flavors.forEach(flavor => {
      if (flavor.includes(searchLower)) {
        flavorMatches.push({
          type: 'flavor',
          text: `${flavor.charAt(0).toUpperCase() + flavor.slice(1)} cocktails`,
          subtitle: 'Find by flavor profile',
          icon: Search,
          data: { flavor }
        })
      }
    })

    // Combine and prioritize suggestions
    newSuggestions.push(...nameMatches)
    newSuggestions.push(...ingredientMatches.slice(0, 2))
    newSuggestions.push(...spiritMatches.slice(0, 2))
    newSuggestions.push(...flavorMatches.slice(0, 1))

    setSuggestions(newSuggestions.slice(0, 6))
    setShowSuggestions(true)
  }, [searchTerm, cocktails])

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setSelectedIndex(-1)
    onSearchChange(value)
  }

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'cocktail') {
      setSearchTerm(suggestion.text)
      onSearchChange(suggestion.text)
    } else if (suggestion.type === 'ingredient') {
      setSearchTerm(suggestion.data.ingredient)
      onSearchChange(suggestion.data.ingredient)
    } else if (suggestion.type === 'spirit') {
      setSearchTerm(suggestion.data.spirit)
      onSearchChange(suggestion.data.spirit)
    } else if (suggestion.type === 'flavor') {
      setSearchTerm(suggestion.data.flavor)
      onSearchChange(suggestion.data.flavor)
    }
    setShowSuggestions(false)
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    onSearchChange('')
    setShowSuggestions(false)
    searchRef.current?.focus()
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={suggestionsRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search cocktails, ingredients, or spirits..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-500"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Current Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon
                return (
                  <button
                    key={`${suggestion.type}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors ${
                      selectedIndex === index ? 'bg-teal-50 text-teal-900' : 'text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{suggestion.text}</div>
                      <div className="text-sm text-gray-500 truncate">{suggestion.subtitle}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && suggestions.length === 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                Recent Searches
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => onRecentSearchClick(search)}
                  className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors text-gray-700"
                >
                  <Clock className="h-4 w-4 mr-3 text-gray-400" />
                  <span className="truncate">{search}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SmartSearch
