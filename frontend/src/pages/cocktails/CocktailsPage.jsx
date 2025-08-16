import { useState, useEffect, useMemo } from 'react'
import { Grid, List, SortAsc, SortDesc, Star, Clock, DollarSign, Wine, Zap, Heart } from 'lucide-react'
import { beverageService } from '../../services/api/beverageService'
import { getImageUrl } from '../../utils/imageUtils'
import CocktailFilters from '../../components/cocktails/CocktailFilters'
import SmartSearch from '../../components/cocktails/SmartSearch'
import QuickAccess from '../../components/cocktails/QuickAccess'

const CocktailsPage = () => {
  const [cocktails, setCocktails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('popularity')
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('grid')
  const [recentSearches, setRecentSearches] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Load cocktails on component mount
  useEffect(() => {
    const fetchCocktails = async () => {
      try {
        setLoading(true)
        const result = await beverageService.getBeveragesByCategory('cocktails')
        if (result.success) {
          setCocktails(result.data.beverages || [])
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to load cocktails')
      } finally {
        setLoading(false)
      }
    }

    fetchCocktails()
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cocktail-recent-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Save search term to recent searches
  const saveRecentSearch = (term) => {
    if (!term.trim() || recentSearches.includes(term)) return
    
    const updated = [term, ...recentSearches.slice(0, 9)]
    setRecentSearches(updated)
    localStorage.setItem('cocktail-recent-searches', JSON.stringify(updated))
  }

  // Filter and sort cocktails
  const filteredAndSortedCocktails = useMemo(() => {
    let filtered = [...cocktails]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(cocktail => 
        cocktail.name.toLowerCase().includes(searchLower) ||
        cocktail.description?.toLowerCase().includes(searchLower) ||
        cocktail.primarySpirit?.toLowerCase().includes(searchLower) ||
        cocktail.ingredients?.some(ing => ing.name.toLowerCase().includes(searchLower)) ||
        cocktail.tastingNotes?.some(note => note.toLowerCase().includes(searchLower))
      )
    }

    // Apply advanced filters
    if (filters.primarySpirit) {
      filtered = filtered.filter(c => 
        c.primarySpirit?.toLowerCase().includes(filters.primarySpirit.toLowerCase())
      )
    }

    if (filters.flavorProfile) {
      filtered = filtered.filter(c => 
        c.tastingNotes?.some(note => 
          note.toLowerCase().includes(filters.flavorProfile.toLowerCase())
        )
      )
    }

    if (filters.strength) {
      const strengthMap = {
        'Light (< 15% ABV)': (abv) => abv < 15,
        'Medium (15-25% ABV)': (abv) => abv >= 15 && abv <= 25,
        'Strong (> 25% ABV)': (abv) => abv > 25
      }
      const strengthCheck = strengthMap[filters.strength]
      if (strengthCheck) {
        filtered = filtered.filter(c => strengthCheck(c.abv || 20))
      }
    }

    if (filters.priceRange) {
      const priceMap = {
        'Under $10': (price) => price < 10,
        '$10-15': (price) => price >= 10 && price <= 15,
        '$15-20': (price) => price >= 15 && price <= 20,
        'Over $20': (price) => price > 20
      }
      const priceCheck = priceMap[filters.priceRange]
      if (priceCheck) {
        filtered = filtered.filter(c => priceCheck(c.price || 15))
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'price':
          aValue = a.price || 15
          bValue = b.price || 15
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        case 'popularity':
          aValue = a.favorites || 0
          bValue = b.favorites || 0
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [cocktails, searchTerm, filters, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCocktails.length / itemsPerPage)
  const paginatedCocktails = filteredAndSortedCocktails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSearchChange = (term) => {
    setSearchTerm(term)
    setCurrentPage(1)
    if (term.trim()) {
      saveRecentSearch(term.trim())
    }
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleRecentSearchClick = (term) => {
    setSearchTerm(term)
    handleSearchChange(term)
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const CocktailCard = ({ cocktail }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="aspect-square bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center">
        {cocktail.image ? (
          <img 
            src={getImageUrl(cocktail.image)}
            alt={cocktail.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-teal-100 to-orange-100 items-center justify-center ${cocktail.image ? 'hidden' : 'flex'}`}>
          <Wine className="h-16 w-16 text-teal-500" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 text-lg">{cocktail.name}</h3>
          <div className="text-right">
            {cocktail.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{cocktail.rating}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {cocktail.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {cocktail.primarySpirit && (
            <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
              {cocktail.primarySpirit}
            </span>
          )}
          {cocktail.specialty && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              Signature
            </span>
          )}
          {cocktail.glassType && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              {cocktail.glassType}
            </span>
          )}
        </div>

        {/* Ingredients Preview */}
        {cocktail.ingredients && cocktail.ingredients.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">Key Ingredients:</div>
            <div className="flex flex-wrap gap-1">
              {cocktail.ingredients.slice(0, 3).map((ingredient, index) => (
                <span key={index} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                  {ingredient.name}
                </span>
              ))}
              {cocktail.ingredients.length > 3 && (
                <span className="text-xs text-gray-400">+{cocktail.ingredients.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>3 min</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="h-4 w-4" />
            </button>
            <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
              Add to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const CocktailListItem = ({ cocktail }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
        {cocktail.image ? (
          <img 
            src={getImageUrl(cocktail.image)}
            alt={cocktail.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-teal-100 to-orange-100 rounded-lg items-center justify-center ${cocktail.image ? 'hidden' : 'flex'}`}>
          <Wine className="h-8 w-8 text-teal-500" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg truncate">{cocktail.name}</h3>
            <p className="text-gray-600 text-sm mt-1 line-clamp-1">{cocktail.description}</p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {cocktail.primarySpirit && (
                <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
                  {cocktail.primarySpirit}
                </span>
              )}
              {cocktail.specialty && (
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                  Signature
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="text-right ml-4">
            {cocktail.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{cocktail.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 ml-4">
        <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
          <Heart className="h-4 w-4" />
        </button>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          Add to Order
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Wine className="h-12 w-12 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Cocktail Menu...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wine className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Cocktails</h2>
            <p className="text-gray-600 max-w-md mx-auto">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cocktail Menu</h1>
          <p className="text-lg text-gray-600">
            Discover our extensive collection of handcrafted cocktails
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <SmartSearch
            onSearchChange={handleSearchChange}
            cocktails={cocktails}
            recentSearches={recentSearches}
            onRecentSearchClick={handleRecentSearchClick}
          />
        </div>

        {/* Quick Access - Only show when no search/filters are active */}
        {!searchTerm && Object.keys(filters).length === 0 && (
          <QuickAccess
            onCocktailSelect={(cocktail) => {
              if (cocktail.name) {
                setSearchTerm(cocktail.name)
                handleSearchChange(cocktail.name)
              }
            }}
          />
        )}

        {/* Filters */}
        <CocktailFilters
          onFiltersChange={handleFiltersChange}
          totalCount={cocktails.length}
          filteredCount={filteredAndSortedCocktails.length}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <button
                onClick={() => toggleSort('popularity')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'popularity' ? 'bg-teal-100 text-teal-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Popularity</span>
                {sortBy === 'popularity' && (
                  sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => toggleSort('price')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'price' ? 'bg-teal-100 text-teal-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Price</span>
                {sortBy === 'price' && (
                  sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => toggleSort('rating')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'rating' ? 'bg-teal-100 text-teal-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Rating</span>
                {sortBy === 'rating' && (
                  sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-teal-100 text-teal-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-teal-100 text-teal-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        {filteredAndSortedCocktails.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Cocktails Found</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search or filter criteria to find the perfect cocktail.
            </p>
          </div>
        ) : (
          <>
            {/* Cocktail Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {paginatedCocktails.map((cocktail) => (
                  <CocktailCard key={cocktail._id} cocktail={cocktail} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {paginatedCocktails.map((cocktail) => (
                  <CocktailListItem key={cocktail._id} cocktail={cocktail} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CocktailsPage
