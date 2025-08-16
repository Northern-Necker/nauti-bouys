import { useState, useEffect, useMemo } from 'react'
import { Grid, List, SortAsc, SortDesc, Star, Calendar, MapPin, Wine, Award, Heart } from 'lucide-react'
import { beverageService } from '../../services/api/beverageService'
import { getImageUrl } from '../../utils/imageUtils'
import WineFilters from '../../components/wines/WineFilters'
import WineSearch from '../../components/wines/WineSearch'
import WineCollections from '../../components/wines/WineCollections'

const WinesPage = () => {
  const [wines, setWines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('rating')
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('grid')
  const [recentSearches, setRecentSearches] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Load wines on component mount
  useEffect(() => {
    const fetchWines = async () => {
      try {
        setLoading(true)
        const result = await beverageService.getBeveragesByCategory('wines')
        if (result.success) {
          setWines(result.data.beverages || [])
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to load wines')
      } finally {
        setLoading(false)
      }
    }

    fetchWines()
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wine-recent-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Save search term to recent searches
  const saveRecentSearch = (term) => {
    if (!term.trim() || recentSearches.includes(term)) return
    
    const updated = [term, ...recentSearches.slice(0, 9)]
    setRecentSearches(updated)
    localStorage.setItem('wine-recent-searches', JSON.stringify(updated))
  }

  // Filter and sort wines
  const filteredAndSortedWines = useMemo(() => {
    let filtered = [...wines]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(wine => 
        wine.name.toLowerCase().includes(searchLower) ||
        wine.description?.toLowerCase().includes(searchLower) ||
        wine.varietal?.toLowerCase().includes(searchLower) ||
        wine.region?.toLowerCase().includes(searchLower) ||
        wine.vintage?.toString().includes(searchTerm) ||
        wine.wineType?.toLowerCase().includes(searchLower)
      )
    }

    // Apply advanced filters
    if (filters.wineType) {
      filtered = filtered.filter(w => 
        w.wineType?.toLowerCase().includes(filters.wineType.toLowerCase()) ||
        w.category?.toLowerCase().includes(filters.wineType.toLowerCase().replace(' wine', ''))
      )
    }

    if (filters.varietal) {
      filtered = filtered.filter(w => 
        w.varietal?.toLowerCase().includes(filters.varietal.toLowerCase()) ||
        w.name.toLowerCase().includes(filters.varietal.toLowerCase())
      )
    }

    if (filters.region) {
      filtered = filtered.filter(w => 
        w.region?.toLowerCase().includes(filters.region.toLowerCase())
      )
    }

    if (filters.vintage) {
      if (filters.vintage.includes('-')) {
        const [start, end] = filters.vintage.split('-').map(y => parseInt(y))
        filtered = filtered.filter(w => {
          const vintage = parseInt(w.vintage)
          return vintage >= start && vintage <= end
        })
      } else if (filters.vintage === 'Pre-2005') {
        filtered = filtered.filter(w => parseInt(w.vintage) < 2005)
      } else {
        filtered = filtered.filter(w => w.vintage?.toString() === filters.vintage)
      }
    }

    if (filters.priceRange) {
      const priceMap = {
        'Under $25': (price) => price < 25,
        '$25-50': (price) => price >= 25 && price <= 50,
        '$50-100': (price) => price >= 50 && price <= 100,
        '$100-200': (price) => price >= 100 && price <= 200,
        'Over $200': (price) => price > 200
      }
      const priceCheck = priceMap[filters.priceRange]
      if (priceCheck) {
        filtered = filtered.filter(w => priceCheck(w.price || 45))
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
          aValue = a.price || 45
          bValue = b.price || 45
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        case 'vintage':
          aValue = parseInt(a.vintage) || 0
          bValue = parseInt(b.vintage) || 0
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
  }, [wines, searchTerm, filters, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedWines.length / itemsPerPage)
  const paginatedWines = filteredAndSortedWines.slice(
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

  const WineCard = ({ wine }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="aspect-[3/4] bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center">
        {wine.image ? (
          <img 
            src={getImageUrl(wine.image)}
            alt={wine.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-purple-100 to-red-100 items-center justify-center ${wine.image ? 'hidden' : 'flex'}`}>
          <div className="w-16 h-20 bg-gradient-to-b from-red-600 to-red-800 rounded-lg flex items-end justify-center">
            <div className="w-12 h-3 bg-red-900 rounded-full mb-2"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg truncate">{wine.name}</h3>
            {wine.vintage && (
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{wine.vintage}</span>
              </div>
            )}
          </div>
          <div className="text-right ml-2">
            {wine.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{wine.rating}</span>
              </div>
            )}
          </div>
        </div>

        {wine.region && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="truncate">{wine.region}</span>
          </div>
        )}

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {wine.description}
        </p>

        {/* Wine Details */}
        <div className="flex flex-wrap gap-1 mb-3">
          {wine.wineType && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              wine.wineType?.toLowerCase().includes('red') ? 'bg-red-100 text-red-800' :
              wine.wineType?.toLowerCase().includes('white') ? 'bg-yellow-100 text-yellow-800' :
              wine.wineType?.toLowerCase().includes('rosé') ? 'bg-pink-100 text-pink-800' :
              wine.wineType?.toLowerCase().includes('sparkling') ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {wine.wineType}
            </span>
          )}
          {wine.varietal && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              {wine.varietal}
            </span>
          )}
          {wine.specialty && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
              <Award className="h-3 w-3 inline mr-1" />
              Sommelier's Pick
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {wine.body && <span>{wine.body}</span>}
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="h-4 w-4" />
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              Add to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const WineListItem = ({ wine }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="w-20 h-24 bg-gradient-to-br from-purple-50 to-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
        {wine.image ? (
          <img 
            src={getImageUrl(wine.image)}
            alt={wine.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-purple-100 to-red-100 rounded-lg items-center justify-center ${wine.image ? 'hidden' : 'flex'}`}>
          <div className="w-8 h-10 bg-gradient-to-b from-red-600 to-red-800 rounded flex items-end justify-center">
            <div className="w-6 h-1 bg-red-900 rounded-full mb-1"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg truncate">{wine.name}</h3>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
              {wine.vintage && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{wine.vintage}</span>
                </div>
              )}
              {wine.region && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="truncate">{wine.region}</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-1 line-clamp-1">{wine.description}</p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {wine.wineType && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  wine.wineType?.toLowerCase().includes('red') ? 'bg-red-100 text-red-800' :
                  wine.wineType?.toLowerCase().includes('white') ? 'bg-yellow-100 text-yellow-800' :
                  wine.wineType?.toLowerCase().includes('rosé') ? 'bg-pink-100 text-pink-800' :
                  wine.wineType?.toLowerCase().includes('sparkling') ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {wine.wineType}
                </span>
              )}
              {wine.specialty && (
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                  Sommelier's Pick
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="text-right ml-4">
            {wine.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{wine.rating}</span>
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
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
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
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Wine className="h-12 w-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Wine Collection...</h2>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Wine Collection</h2>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Wine Collection</h1>
          <p className="text-lg text-gray-600">
            Discover our extensive selection of fine wines from around the world
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <WineSearch
            onSearchChange={handleSearchChange}
            wines={wines}
            recentSearches={recentSearches}
            onRecentSearchClick={handleRecentSearchClick}
          />
        </div>

        {/* Wine Collections - Only show when no search/filters are active */}
        {!searchTerm && Object.keys(filters).length === 0 && (
          <WineCollections
            onWineSelect={(wine) => {
              if (wine.name) {
                setSearchTerm(wine.name)
                handleSearchChange(wine.name)
              }
            }}
          />
        )}

        {/* Filters */}
        <WineFilters
          onFiltersChange={handleFiltersChange}
          totalCount={wines.length}
          filteredCount={filteredAndSortedWines.length}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <button
                onClick={() => toggleSort('rating')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'rating' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Rating</span>
                {sortBy === 'rating' && (
                  sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => toggleSort('price')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'price' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Price</span>
                {sortBy === 'price' && (
                  sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => toggleSort('vintage')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'vintage' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Vintage</span>
                {sortBy === 'vintage' && (
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
                viewMode === 'grid' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        {filteredAndSortedWines.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wine className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Wines Found</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search or filter criteria to find the perfect wine.
            </p>
          </div>
        ) : (
          <>
            {/* Wine Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {paginatedWines.map((wine) => (
                  <WineCard key={wine._id} wine={wine} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {paginatedWines.map((wine) => (
                  <WineListItem key={wine._id} wine={wine} />
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
                        ? 'bg-purple-600 text-white border-purple-600'
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

export default WinesPage
