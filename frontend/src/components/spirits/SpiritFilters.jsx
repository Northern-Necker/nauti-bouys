import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

const SpiritFilters = ({ onFiltersChange, totalCount, filteredCount }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({})

  const filterOptions = {
    spiritType: {
      label: 'Spirit Type',
      options: [
        'Whiskey',
        'Bourbon',
        'Scotch',
        'Rye',
        'Irish Whiskey',
        'Tequila',
        'Mezcal',
        'Gin',
        'Rum',
        'Vodka',
        'Brandy',
        'Cognac',
        'Armagnac'
      ]
    },
    age: {
      label: 'Age Statement',
      options: [
        'No Age Statement',
        '3-5 Years',
        '6-10 Years',
        '12 Years',
        '15 Years',
        '18 Years',
        '21+ Years',
        'Vintage'
      ]
    },
    region: {
      label: 'Region/Origin',
      options: [
        'Scotland',
        'Ireland',
        'Kentucky',
        'Tennessee',
        'Japan',
        'Canada',
        'Mexico',
        'Jamaica',
        'Barbados',
        'France',
        'England',
        'Other'
      ]
    },
    proof: {
      label: 'Proof Range',
      options: [
        'Under 80 Proof',
        '80-90 Proof',
        '90-100 Proof',
        '100-110 Proof',
        '110+ Proof (Cask Strength)'
      ]
    },
    rarity: {
      label: 'Rarity',
      options: [
        'Standard',
        'Small Batch',
        'Single Barrel',
        'Limited Edition',
        'Rare/Allocated',
        'Vintage'
      ]
    }
  }

  const handleFilterChange = (category, value) => {
    const newFilters = {
      ...filters,
      [category]: filters[category] === value ? '' : value
    }
    
    // Remove empty filters
    Object.keys(newFilters).forEach(key => {
      if (!newFilters[key]) {
        delete newFilters[key]
      }
    })
    
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    setFilters({})
    onFiltersChange({})
  }

  const activeFilterCount = Object.keys(filters).length

  return (
    <div className="mb-6">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:w-auto px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center">
          <Filter className="h-5 w-5 mr-2 text-amber-600" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Spirits</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center text-sm text-amber-600 hover:text-amber-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Object.entries(filterOptions).map(([category, { label, options }]) => (
              <div key={category}>
                <h4 className="font-medium text-gray-900 mb-3">{label}</h4>
                <div className="space-y-2">
                  {options.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters[category] === option}
                        onChange={() => handleFilterChange(category, option)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Results Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-amber-600">{filteredCount}</span> of{' '}
              <span className="font-semibold">{totalCount}</span> spirits
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpiritFilters
