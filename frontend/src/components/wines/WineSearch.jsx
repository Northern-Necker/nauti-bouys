import { useState, useEffect, useRef } from 'react'
import { Search, X, Clock, Star, MapPin, Calendar, Wine } from 'lucide-react'

const WineSearch = ({ onSearchChange, wines, recentSearches, onRecentSearchClick }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Generate wine-specific suggestions based on search term
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const newSuggestions = []

    // Search by wine name
    const nameMatches = wines
      .filter(wine => wine.name.toLowerCase().includes(searchLower))
      .slice(0, 3)
      .map(wine => ({
        type: 'wine',
        text: wine.name,
        subtitle: `${wine.vintage || 'NV'} • ${wine.region || 'Unknown Region'} • $${wine.price}`,
        icon: Wine,
        data: wine
      }))

    // Search by varietal
    const varietalMatches = []
    const varietals = ['cabernet sauvignon', 'merlot', 'pinot noir', 'chardonnay', 'sauvignon blanc', 'pinot grigio', 'riesling', 'syrah', 'malbec']
    varietals.forEach(varietal => {
      if (varietal.includes(searchLower)) {
        const varietalWines = wines.filter(w => 
          w.varietal?.toLowerCase().includes(varietal) ||
          w.name.toLowerCase().includes(varietal)
        )
        if (varietalWines.length > 0) {
          varietalMatches.push({
            type: 'varietal',
            text: `${varietal.charAt(0).toUpperCase() + varietal.slice(1)} wines`,
            subtitle: `${varietalWines.length} available`,
            icon: Wine,
            data: { varietal }
          })
        }
      }
    })

    // Search by region
    const regionMatches = []
    const regions = ['napa valley', 'sonoma', 'bordeaux', 'burgundy', 'tuscany', 'rioja', 'barossa valley', 'marlborough', 'champagne']
    regions.forEach(region => {
      if (region.includes(searchLower)) {
        const regionWines = wines.filter(w => 
          w.region?.toLowerCase().includes(region)
        )
        if (regionWines.length > 0) {
          regionMatches.push({
            type: 'region',
            text: `${region.charAt(0).toUpperCase() + region.slice(1)} wines`,
            subtitle: `${regionWines.length} available`,
            icon: MapPin,
            data: { region }
          })
        }
      }
    })

    // Search by vintage
    const vintageMatches = []
    if (/^\d{4}$/.test(searchTerm)) {
      const vintageWines = wines.filter(w => 
        w.vintage?.toString() === searchTerm
      )
      if (vintageWines.length > 0) {
        vintageMatches.push({
          type: 'vintage',
          text: `${searchTerm} vintage wines`,
          subtitle: `${vintageWines.length} available`,
          icon: Calendar,
          data: { vintage: searchTerm }
        })
      }
    }

    // Search by wine type
    const typeMatches = []
    const types = ['red wine', 'white wine', 'rosé', 'sparkling', 'dessert wine']
    types.forEach(type => {
      if (type.includes(searchLower)) {
        const typeWines = wines.filter(w => 
          w.wineType?.toLowerCase().includes(type) ||
          w.category?.toLowerCase().includes(type.replace(' wine', ''))
        )
        if (typeWines.length > 0) {
          typeMatches.push({
            type: 'wineType',
            text: `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
            subtitle: `${typeWines.length} available`,
            icon: Wine,
            data: { wineType: type }
          })
        }
      }
    })

    // Combine and prioritize suggestions
    newSuggestions.push(...nameMatches)
    newSuggestions.push(...varietalMatches.slice(0, 2))
    newSuggestions.push(...regionMatches.slice(0, 2))
    newSuggestions.push(...vintageMatches.slice(0, 1))
    newSuggestions.push(...typeMatches.slice(0, 1))

    setSuggestions(newSuggestions.slice(0, 6))
    setShowSuggestions(true)
  }, [searchTerm, wines])

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setSelectedIndex(-1)
    onSearchChange(value)
  }

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'wine') {
      setSearchTerm(suggestion.text)
      onSearchChange(suggestion.text)
    } else if (suggestion.type === 'varietal') {
      setSearchTerm(suggestion.data.varietal)
      onSearchChange(suggestion.data.varietal)
    } else if (suggestion.type === 'region') {
      setSearchTerm(suggestion.data.region)
      onSearchChange(suggestion.data.region)
    } else if (suggestion.type === 'vintage') {
      setSearchTerm(suggestion.data.vintage)
      onSearchChange(suggestion.data.vintage)
    } else if (suggestion.type === 'wineType') {
      setSearchTerm(suggestion.data.wineType)
      onSearchChange(suggestion.data.wineType)
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
          placeholder="Search wines by name, varietal, region, or vintage..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                Wine Suggestions
              </div>
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon
                return (
                  <button
                    key={`${suggestion.type}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors ${
                      selectedIndex === index ? 'bg-purple-50 text-purple-900' : 'text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{suggestion.text}</div>
                      <div className="text-sm text-gray-500 truncate">{suggestion.subtitle}</div>
                    </div>
                    {suggestion.type === 'wine' && suggestion.data.wsRating && (
                      <div className="flex items-center ml-2">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500 ml-1">{suggestion.data.wsRating}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && suggestions.length === 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                Recent Wine Searches
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

export default WineSearch
