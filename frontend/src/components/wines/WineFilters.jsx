import { useState } from 'react'
import { ChevronDown, X, Filter, Star, Calendar, MapPin } from 'lucide-react'

const WineFilters = ({ onFiltersChange, totalCount, filteredCount }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    wineType: '',
    varietal: '',
    region: '',
    vintage: '',
    priceRange: '',
    body: '',
    sweetness: '',
    wsRank: ''
  })

  const filterOptions = {
    wineType: [
      'Red Wine', 'White Wine', 'Rosé', 'Sparkling', 'Dessert Wine', 'Fortified'
    ],
    varietal: [
      'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah/Shiraz', 'Malbec', 'Sangiovese',
      'Chardonnay', 'Sauvignon Blanc', 'Pinot Grigio', 'Riesling', 'Gewürztraminer', 'Viognier'
    ],
    region: [
      'Napa Valley', 'Sonoma', 'Bordeaux', 'Burgundy', 'Tuscany', 'Rioja', 
      'Barossa Valley', 'Marlborough', 'Champagne', 'Loire Valley', 'Piedmont', 'Douro'
    ],
    vintage: [
      '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', 
      '2010-2014', '2005-2009', 'Pre-2005'
    ],
    priceRange: [
      'Under $25', '$25-50', '$50-100', '$100-200', 'Over $200'
    ],
    body: [
      'Light-bodied', 'Medium-bodied', 'Full-bodied'
    ],
    sweetness: [
      'Bone Dry', 'Dry', 'Off-Dry', 'Medium Sweet', 'Sweet', 'Dessert'
    ],
    wsRank: [
      '95-100 (Outstanding)', '90-94 (Excellent)', '85-89 (Very Good)', '80-84 (Good)'
    ]
  }

  const handleFilterChange = (category, value) => {
    const newFilters = { ...activeFilters }
    newFilters[category] = newFilters[category] === value ? '' : value
    setActiveFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      wineType: '',
      varietal: '',
      region: '',
      vintage: '',
      priceRange: '',
      body: '',
      sweetness: '',
      wsRank: ''
    }
    setActiveFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(Boolean).length
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span className="font-medium">Wine Filters</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="text-sm text-gray-600">
              Showing {filteredCount} of {totalCount} wines
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
          {/* Wine Type */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Wine Type</h3>
            <div className="flex flex-wrap gap-2">
              {filterOptions.wineType.map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange('wineType', type)}
                  className={`px-3 py-2 rounded-full text-sm transition-colors ${
                    activeFilters.wineType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Varietal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Grape Varietal</h3>
            <div className="flex flex-wrap gap-2">
              {filterOptions.varietal.map((varietal) => (
                <button
                  key={varietal}
                  onClick={() => handleFilterChange('varietal', varietal)}
                  className={`px-3 py-2 rounded-full text-sm transition-colors ${
                    activeFilters.varietal === varietal
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {varietal}
                </button>
              ))}
            </div>
          </div>

          {/* Region & Vintage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Region
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.region.map((region) => (
                  <label key={region} className="flex items-center">
                    <input
                      type="radio"
                      name="region"
                      checked={activeFilters.region === region}
                      onChange={() => handleFilterChange('region', region)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{region}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Vintage
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.vintage.map((vintage) => (
                  <label key={vintage} className="flex items-center">
                    <input
                      type="radio"
                      name="vintage"
                      checked={activeFilters.vintage === vintage}
                      onChange={() => handleFilterChange('vintage', vintage)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{vintage}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
            <div className="flex flex-wrap gap-2">
              {filterOptions.priceRange.map((range) => (
                <button
                  key={range}
                  onClick={() => handleFilterChange('priceRange', range)}
                  className={`px-3 py-2 rounded-full text-sm transition-colors ${
                    activeFilters.priceRange === range
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Body & Sweetness */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Body</h3>
              <div className="space-y-2">
                {filterOptions.body.map((body) => (
                  <label key={body} className="flex items-center">
                    <input
                      type="radio"
                      name="body"
                      checked={activeFilters.body === body}
                      onChange={() => handleFilterChange('body', body)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{body}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Sweetness</h3>
              <div className="space-y-2">
                {filterOptions.sweetness.map((sweetness) => (
                  <label key={sweetness} className="flex items-center">
                    <input
                      type="radio"
                      name="sweetness"
                      checked={activeFilters.sweetness === sweetness}
                      onChange={() => handleFilterChange('sweetness', sweetness)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{sweetness}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Wine Spectator Rating */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Star className="h-4 w-4 mr-1" />
              Wine Spectator Rating
            </h3>
            <div className="space-y-2">
              {filterOptions.wsRank.map((rank) => (
                <label key={rank} className="flex items-center">
                  <input
                    type="radio"
                    name="wsRank"
                    checked={activeFilters.wsRank === rank}
                    onChange={() => handleFilterChange('wsRank', rank)}
                    className="text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{rank}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WineFilters
