import { useState, useRef, useEffect } from 'react'
import { Search, Clock, TrendingUp, Zap } from 'lucide-react'

const SpiritSearch = ({ onSearchChange, spirits, recentSearches, onRecentSearchClick }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const searchRef = useRef(null)

  // Generate search suggestions based on spirits data
  useEffect(() => {
    if (searchTerm.length > 1 && spirits.length > 0) {
      const searchLower = searchTerm.toLowerCase()
      const matches = []

      // Search in spirit names
      spirits.forEach(spirit => {
        if (spirit.name.toLowerCase().includes(searchLower)) {
          matches.push({
            type: 'spirit',
            text: spirit.name,
            category: spirit.spiritType || 'Spirit',
            icon: Zap
          })
        }
      })

      // Search in spirit types
      const spiritTypes = [...new Set(spirits.map(s => s.spiritType).filter(Boolean))]
      spiritTypes.forEach(type => {
        if (type.toLowerCase().includes(searchLower)) {
          matches.push({
            type: 'category',
            text: type,
            category: 'Spirit Type',
            icon: TrendingUp
          })
        }
      })

      // Search in distilleries/brands
      const distilleries = [...new Set(spirits.map(s => s.distillery || s.brand).filter(Boolean))]
      distilleries.forEach(distillery => {
        if (distillery.toLowerCase().includes(searchLower)) {
          matches.push({
            type: 'distillery',
            text: distillery,
            category: 'Distillery',
            icon: TrendingUp
          })
        }
      })

      // Search in regions
      const regions = [...new Set(spirits.map(s => s.region).filter(Boolean))]
      regions.forEach(region => {
        if (region.toLowerCase().includes(searchLower)) {
          matches.push({
            type: 'region',
            text: region,
            category: 'Region',
            icon: TrendingUp
          })
        }
      })

      setSuggestions(matches.slice(0, 8))
      setShowSuggestions(matches.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm, spirits])

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    onSearchChange(value)
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.text)
    onSearchChange(suggestion.text)
    setShowSuggestions(false)
  }

  const handleRecentClick = (term) => {
    setSearchTerm(term)
    onRecentSearchClick(term)
    setShowSuggestions(false)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search spirits by name, type, distillery, or region..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 || recentSearches.length > 0) {
              setShowSuggestions(true)
            }
          }}
          className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white shadow-sm"
        />
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Live Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center px-3 py-2 text-left hover:bg-amber-50 rounded-lg transition-colors duration-150"
                  >
                    <Icon className="h-4 w-4 text-amber-600 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {suggestion.text}
                      </div>
                      <div className="text-sm text-gray-500">
                        {suggestion.category}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Recent Searches
              </div>
              {recentSearches.slice(0, 5).map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentClick(term)}
                  className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors duration-150"
                >
                  <Clock className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 truncate">{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* No suggestions */}
          {suggestions.length === 0 && recentSearches.length === 0 && searchTerm.length > 1 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No suggestions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SpiritSearch
