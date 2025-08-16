import { useState } from 'react'
import { ChevronDown, X, Filter, Star, Clock, DollarSign } from 'lucide-react'

const CocktailFilters = ({ onFiltersChange, totalCount, filteredCount }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    primarySpirit: '',
    flavorProfile: '',
    strength: '',
    priceRange: '',
    occasion: '',
    dietary: []
  })

  const filterOptions = {
    primarySpirit: [
      'Vodka', 'Gin', 'Rum', 'Whiskey', 'Tequila', 'Brandy', 'Mezcal', 'Absinthe'
    ],
    flavorProfile: [
      'Sweet', 'Sour', 'Bitter', 'Spicy', 'Fruity', 'Herbal', 'Citrus', 'Tropical'
    ],
    strength: [
      'Light (< 15% ABV)', 'Medium (15-25% ABV)', 'Strong (> 25% ABV)'
    ],
    priceRange: [
      'Under $10', '$10-15', '$15-20', 'Over $20'
    ],
    occasion: [
      'Brunch', 'Happy Hour', 'Dinner', 'Late Night', 'Date Night', 'Group Celebration'
    ],
    dietary: [
      'Vegan', 'Gluten-Free', 'Low Sugar', 'Dairy-Free'
    ]
  }

  const handleFilterChange = (category, value) => {
    const newFilters = { ...activeFilters }
    
    if (category === 'dietary') {
      if (newFilters.dietary.includes(value)) {
        newFilters.dietary = newFilters.dietary.filter(item => item !== value)
      } else {
        newFilters.dietary = [...newFilters.dietary, value]
      }
    } else {
      newFilters[category] = newFilters[category] === value ? '' : value
    }
    
    setActiveFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      primarySpirit: '',
      flavorProfile: '',
      strength: '',
      priceRange: '',
      occasion: '',
      dietary: []
    }
    setActiveFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).flat().filter(Boolean).length
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 text-gray-700 hover:text-teal-600 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span className="font-medium">Filters</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="text-sm text-gray-600">
              Showing {filteredCount} of {totalCount} cocktails
            </div>
          </div>

          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      {isOpen && (
        <div className="p-4 space-y-6">
          {/* Primary Spirit */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Primary Spirit</h3>
            <div className="flex flex-wrap gap-2">
              {filterOptions.primarySpirit.map((spirit) => (
                <button
                  key={spirit}
                  onClick={() => handleFilterChange('primarySpirit', spirit)}
                  className={`px-3 py-2 rounded-full text-sm transition-colors ${
                    activeFilters.primarySpirit === spirit
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {spirit}
                </button>
              ))}
            </div>
          </div>

          {/* Flavor Profile */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Flavor Profile</h3>
            <div className="flex flex-wrap gap-2">
              {filterOptions.flavorProfile.map((flavor) => (
                <button
                  key={flavor}
                  onClick={() => handleFilterChange('flavorProfile', flavor)}
                  className={`px-3 py-2 rounded-full text-sm transition-colors ${
                    activeFilters.flavorProfile === flavor
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {flavor}
                </button>
              ))}
            </div>
          </div>

          {/* Strength & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Strength</h3>
              <div className="space-y-2">
                {filterOptions.strength.map((strength) => (
                  <label key={strength} className="flex items-center">
                    <input
                      type="radio"
                      name="strength"
                      checked={activeFilters.strength === strength}
                      onChange={() => handleFilterChange('strength', strength)}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{strength}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
              <div className="space-y-2">
                {filterOptions.priceRange.map((range) => (
                  <label key={range} className="flex items-center">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={activeFilters.priceRange === range}
                      onChange={() => handleFilterChange('priceRange', range)}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{range}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Occasion */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Perfect For</h3>
            <div className="flex flex-wrap gap-2">
              {filterOptions.occasion.map((occasion) => (
                <button
                  key={occasion}
                  onClick={() => handleFilterChange('occasion', occasion)}
                  className={`px-3 py-2 rounded-full text-sm transition-colors ${
                    activeFilters.occasion === occasion
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {occasion}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Dietary Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {filterOptions.dietary.map((diet) => (
                <label key={diet} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.dietary.includes(diet)}
                    onChange={() => handleFilterChange('dietary', diet)}
                    className="text-teal-600 focus:ring-teal-500 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{diet}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CocktailFilters
