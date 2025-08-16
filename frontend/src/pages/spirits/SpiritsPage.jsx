import { useState, useEffect, useMemo } from 'react'
import { Grid, List, SortAsc, SortDesc, Star, Calendar, MapPin, Zap, Award, Heart, Flame } from 'lucide-react'
import { beverageService } from '../../services/api/beverageService'
import { getImageUrl } from '../../utils/imageUtils'
import SpiritFilters from '../../components/spirits/SpiritFilters'
import SpiritSearch from '../../components/spirits/SpiritSearch'
import SpiritCollections from '../../components/spirits/SpiritCollections'

const SpiritsPage = () => {
  const [spirits, setSpirits] = useState([])
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

  // Load spirits on component mount
  useEffect(() => {
    const fetchSpirits = async () => {
      try {
        setLoading(true)
        const result = await beverageService.getBeveragesByCategory('spirits')
        if (result.success) {
          setSpirits(result.data.beverages || [])
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to load spirits')
      } finally {
        setLoading(false)
      }
    }

    fetchSpirits()
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('spirit-recent-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Save search term to recent searches
  const saveRecentSearch = (term) => {
    if (!term.trim() || recentSearches.includes(term)) return
    
    const updated = [term, ...recentSearches.slice(0, 9)]
    setRecentSearches(updated)
    localStorage.setItem('spirit-recent-searches', JSON.stringify(updated))
  }

  // Filter and sort spirits
  const filteredAndSortedSpirits = useMemo(() => {
    let filtered = [...spirits]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(spirit => 
        spirit.name.toLowerCase().includes(searchLower) ||
        spirit.description?.toLowerCase().includes(searchLower) ||
        spirit.type?.toLowerCase().includes(searchLower) ||
        spirit.subType?.toLowerCase().includes(searchLower) ||
        spirit.distillery?.toLowerCase().includes(searchLower) ||
        spirit.region?.toLowerCase().includes(searchLower) ||
        spirit.age?.toString().includes(searchTerm) ||
        spirit.proof?.toString().includes(searchTerm)
      )
    }

    // Apply advanced filters
    if (filters.spiritType) {
      const filterValue = filters.spiritType.toLowerCase()
      filtered = filtered.filter(s => {
        const name = s.name.toLowerCase()
        // Match based on spirit type patterns in the name
        if (filterValue === 'whiskey') {
          return name.includes('whiskey') || name.includes('bourbon') || name.includes('scotch') || 
                 name.includes('rye') || name.includes('pappy') || name.includes('weller') || 
                 name.includes('blanton') || name.includes('macallan') || name.includes('yamazaki') || 
                 name.includes('hibiki') || name.includes('michter')
        } else if (filterValue === 'tequila') {
          return name.includes('tequila') || name.includes('mezcal') || name.includes('agave') || 
                 name.includes('patron') || name.includes('don julio') || name.includes('clase azul')
        } else if (filterValue === 'gin') {
          return name.includes('gin') || name.includes('hendrick') || name.includes('botanist') || 
                 name.includes('monkey 47')
        } else if (filterValue === 'vodka') {
          return name.includes('vodka') || name.includes('grey goose') || name.includes('beluga')
        } else {
          return name.includes(filterValue)
        }
      })
    }

    if (filters.age) {
      if (filters.age === 'No Age Statement') {
        filtered = filtered.filter(s => !s.age || s.age === 0)
      } else if (filters.age === '3-5 Years') {
        filtered = filtered.filter(s => s.age >= 3 && s.age <= 5)
      } else if (filters.age === '6-10 Years') {
        filtered = filtered.filter(s => s.age >= 6 && s.age <= 10)
      } else if (filters.age === '12 Years') {
        filtered = filtered.filter(s => s.age === 12)
      } else if (filters.age === '15 Years') {
        filtered = filtered.filter(s => s.age === 15)
      } else if (filters.age === '18 Years') {
        filtered = filtered.filter(s => s.age === 18)
      } else if (filters.age === '21+ Years') {
        filtered = filtered.filter(s => s.age >= 21)
      } else if (filters.age === 'Vintage') {
        filtered = filtered.filter(s => s.vintage || s.name.toLowerCase().includes('vintage'))
      }
    }

    if (filters.region) {
      filtered = filtered.filter(s => 
        s.region?.toLowerCase().includes(filters.region.toLowerCase())
      )
    }

    if (filters.proof) {
      if (filters.proof === 'Under 80 Proof') {
        filtered = filtered.filter(s => (s.proof || 80) < 80)
      } else if (filters.proof === '80-90 Proof') {
        filtered = filtered.filter(s => {
          const proof = s.proof || 80
          return proof >= 80 && proof <= 90
        })
      } else if (filters.proof === '90-100 Proof') {
        filtered = filtered.filter(s => {
          const proof = s.proof || 80
          return proof >= 90 && proof <= 100
        })
      } else if (filters.proof === '100-110 Proof') {
        filtered = filtered.filter(s => {
          const proof = s.proof || 80
          return proof >= 100 && proof <= 110
        })
      } else if (filters.proof === '110+ Proof (Cask Strength)') {
        filtered = filtered.filter(s => (s.proof || 80) > 110)
      }
    }

    if (filters.rarity) {
      if (filters.rarity === 'Standard') {
        filtered = filtered.filter(s => !s.rarity || s.rarity === 'standard')
      } else {
        filtered = filtered.filter(s => 
          s.rarity?.toLowerCase().includes(filters.rarity.toLowerCase()) ||
          s.name.toLowerCase().includes(filters.rarity.toLowerCase()) ||
          (filters.rarity === 'Limited Edition' && s.name.toLowerCase().includes('limited')) ||
          (filters.rarity === 'Single Barrel' && s.name.toLowerCase().includes('single barrel')) ||
          (filters.rarity === 'Small Batch' && s.name.toLowerCase().includes('small batch'))
        )
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
        case 'rating':
          aValue = a.averageRating || 0
          bValue = b.averageRating || 0
          break
        case 'age':
          aValue = a.age || 0
          bValue = b.age || 0
          break
        case 'proof':
          aValue = a.proof || 80
          bValue = b.proof || 80
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
  }, [spirits, searchTerm, filters, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSpirits.length / itemsPerPage)
  const paginatedSpirits = filteredAndSortedSpirits.slice(
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

  const SpiritCard = ({ spirit }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="aspect-[3/4] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        {spirit.image ? (
          <img 
            src={getImageUrl(spirit.image)}
            alt={spirit.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 items-center justify-center ${spirit.image ? 'hidden' : 'flex'}`}>
          <div className="w-16 h-20 bg-gradient-to-b from-amber-600 to-amber-800 rounded-lg flex items-end justify-center">
            <div className="w-12 h-3 bg-amber-900 rounded-full mb-2"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg truncate">{spirit.name}</h3>
            <div className="flex items-center text-sm text-gray-600 mt-1 space-x-2">
              {spirit.distillery && (
                <span className="truncate">{spirit.distillery}</span>
              )}
              {spirit.age && (
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {spirit.age}yr
                </span>
              )}
            </div>
          </div>
          <div className="text-right ml-2">
            {spirit.averageRating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{spirit.averageRating}</span>
              </div>
            )}
          </div>
        </div>

        {spirit.region && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="truncate">{spirit.region}</span>
          </div>
        )}

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {spirit.description}
        </p>

        {/* Spirit Details */}
        <div className="flex flex-wrap gap-1 mb-3">
          {(spirit.type || spirit.subType) && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              spirit.type?.toLowerCase().includes('whiskey') || spirit.subType?.toLowerCase().includes('bourbon') || spirit.subType?.toLowerCase().includes('scotch') ? 'bg-amber-100 text-amber-800' :
              spirit.type?.toLowerCase().includes('tequila') || spirit.type?.toLowerCase().includes('mezcal') ? 'bg-green-100 text-green-800' :
              spirit.type?.toLowerCase().includes('gin') || spirit.type?.toLowerCase().includes('vodka') ? 'bg-blue-100 text-blue-800' :
              spirit.type?.toLowerCase().includes('rum') ? 'bg-yellow-100 text-yellow-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {spirit.subType || spirit.type}
            </span>
          )}
          {spirit.proof && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              {spirit.proof}°
            </span>
          )}
          {spirit.rarity && spirit.rarity !== 'standard' && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              <Award className="h-3 w-3 inline mr-1" />
              {spirit.rarity}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {spirit.abv && <span>{spirit.abv}% ABV</span>}
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="h-4 w-4" />
            </button>
            <button className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
              Add to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const SpiritListItem = ({ spirit }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="w-20 h-24 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
        {spirit.image ? (
          <img 
            src={getImageUrl(spirit.image)}
            alt={spirit.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg items-center justify-center ${spirit.image ? 'hidden' : 'flex'}`}>
          <div className="w-8 h-10 bg-gradient-to-b from-amber-600 to-amber-800 rounded flex items-end justify-center">
            <div className="w-6 h-1 bg-amber-900 rounded-full mb-1"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg truncate">{spirit.name}</h3>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
              {spirit.distillery && (
                <span className="truncate">{spirit.distillery}</span>
              )}
              {spirit.age && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{spirit.age}yr</span>
                </div>
              )}
              {spirit.region && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="truncate">{spirit.region}</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-1 line-clamp-1">{spirit.description}</p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {(spirit.type || spirit.subType) && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  spirit.type?.toLowerCase().includes('whiskey') || spirit.subType?.toLowerCase().includes('bourbon') || spirit.subType?.toLowerCase().includes('scotch') ? 'bg-amber-100 text-amber-800' :
                  spirit.type?.toLowerCase().includes('tequila') || spirit.type?.toLowerCase().includes('mezcal') ? 'bg-green-100 text-green-800' :
                  spirit.type?.toLowerCase().includes('gin') || spirit.type?.toLowerCase().includes('vodka') ? 'bg-blue-100 text-blue-800' :
                  spirit.type?.toLowerCase().includes('rum') ? 'bg-yellow-100 text-yellow-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {spirit.subType || spirit.type}
                </span>
              )}
              {spirit.proof && (
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {spirit.proof}°
                </span>
              )}
              {spirit.rarity && spirit.rarity !== 'standard' && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {spirit.rarity}
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="text-right ml-4">
            {spirit.averageRating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{spirit.averageRating}</span>
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
        <button className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
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
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Flame className="h-12 w-12 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Spirit Collection...</h2>
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
              <Flame className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Spirit Collection</h2>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Premium Spirits Collection</h1>
          <p className="text-lg text-gray-600">
            Discover our extensive selection of rare whiskeys, premium tequilas, craft gins, and exceptional spirits
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <SpiritSearch
            onSearchChange={handleSearchChange}
            spirits={spirits}
            recentSearches={recentSearches}
            onRecentSearchClick={handleRecentSearchClick}
          />
        </div>

        {/* Spirit Collections - Only show when no search/filters are active */}
        {!searchTerm && Object.keys(filters).length === 0 && (
          <SpiritCollections
            onSpiritSelect={(selection) => {
              if (selection.name) {
                // Individual spirit selected - search for it
                setSearchTerm(selection.name)
                handleSearchChange(selection.name)
              } else if (selection.filterType && selection.filterValue) {
                // Filter category selected - apply the filter
                const newFilters = { ...filters, [selection.filterType]: selection.filterValue }
                setFilters(newFilters)
                setCurrentPage(1)
              }
            }}
          />
        )}

        {/* Filters */}
        <SpiritFilters
          onFiltersChange={handleFiltersChange}
          totalCount={spirits.length}
          filteredCount={filteredAndSortedSpirits.length}
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
                  sortBy === 'rating' ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Rating</span>
                {sortBy === 'rating' && (
                  sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => toggleSort('age')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'age' ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Age</span>
                {sortBy === 'age' && (
                  sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => toggleSort('proof')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === 'proof' ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Proof</span>
                {sortBy === 'proof' && (
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
                viewMode === 'grid' ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        {filteredAndSortedSpirits.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Spirits Found</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search or filter criteria to find the perfect spirit.
            </p>
          </div>
        ) : (
          <>
            {/* Spirit Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {paginatedSpirits.map((spirit) => (
                  <SpiritCard key={spirit._id} spirit={spirit} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {paginatedSpirits.map((spirit) => (
                  <SpiritListItem key={spirit._id} spirit={spirit} />
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
                        ? 'bg-amber-600 text-white border-amber-600'
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

export default SpiritsPage
