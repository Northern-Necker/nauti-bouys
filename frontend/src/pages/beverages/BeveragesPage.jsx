import { useState, useEffect } from 'react'
import { Search, Filter, Wine, Beer, Coffee, Sparkles, Star, Clock, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { beverageService } from '../../services/api/beverageService'
import { getImageUrl } from '../../utils/imageUtils'

const BeveragesPage = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [beverages, setBeverages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const categories = [
    { id: 'all', name: 'All Beverages', icon: Wine },
    { id: 'cocktails', name: 'Cocktails', icon: Coffee },
    { id: 'wines', name: 'Wines', icon: Wine },
    { id: 'beers', name: 'Beers', icon: Beer },
    { id: 'spirits', name: 'Spirits', icon: Wine },
    { id: 'mocktails', name: 'Mocktails', icon: Sparkles },
    { id: 'non-alcoholic', name: 'Non-Alcoholic', icon: Sparkles }
  ]

  // Fetch beverages on component mount
  useEffect(() => {
    const fetchBeverages = async () => {
      try {
        setLoading(true)
        const result = await beverageService.getAllBeverages()
        if (result.success) {
          setBeverages(result.data.beverages || [])
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to load beverages')
      } finally {
        setLoading(false)
      }
    }

    fetchBeverages()
  }, [])

  // Filter beverages based on search and category
  const filteredBeverages = beverages.filter(beverage => {
    const matchesSearch = beverage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         beverage.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
                           beverage.category?.toLowerCase() === selectedCategory ||
                           beverage.type?.toLowerCase() === selectedCategory
    return matchesSearch && matchesCategory
  })

  const BeverageCard = ({ beverage }) => (
    <div className="card-bay hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] overflow-hidden">
      {/* Image Section */}
      {beverage.image && (
        <div className="w-full h-48 bg-gradient-to-br from-bay-50 to-sand-50 flex items-center justify-center mb-4 rounded-lg overflow-hidden">
          <img 
            src={getImageUrl(beverage.image)}
            alt={beverage.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden w-full h-full bg-gradient-to-br from-bay-100 to-sand-100 items-center justify-center">
            <Wine className="h-16 w-16 text-bay-400" />
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-bay-800 mb-2">{beverage.name}</h3>
          <p className="text-bay-600 text-sm leading-relaxed">{beverage.description}</p>
        </div>
        <div className="ml-4 text-right">
          {beverage.averageRating > 0 && (
            <div className="flex items-center mt-1">
              <Star className="h-4 w-4 text-sunset-400 fill-current" />
              <span className="text-sm text-bay-600 ml-1">{beverage.averageRating}</span>
            </div>
          )}
        </div>
      </div>
      
      {beverage.ingredients && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-bay-700 mb-2">Ingredients:</h4>
          <div className="flex flex-wrap gap-1">
            {beverage.ingredients.slice(0, 4).map((ingredient, index) => (
              <span key={index} className="text-xs bg-sand-100 text-bay-700 px-2 py-1 rounded-full">
                {ingredient.name}
              </span>
            ))}
            {beverage.ingredients.length > 4 && (
              <span className="text-xs text-bay-500">+{beverage.ingredients.length - 4} more</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-bay-600">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{beverage.preparationTime || 3} min</span>
        </div>
        {beverage.category && (
          <span className="bg-bay-100 text-bay-700 px-2 py-1 rounded-full text-xs font-medium">
            {beverage.category}
          </span>
        )}
        {beverage.isSignature && (
          <span className="bg-sunset-100 text-sunset-700 px-2 py-1 rounded-full text-xs font-medium">
            Signature
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Beverages</h1>
          <p className="text-lg text-gray-600">
            Discover our curated selection of premium drinks
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search beverages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => {
                  if (category.id === 'cocktails') {
                    navigate('/cocktails')
                  } else if (category.id === 'wines') {
                    navigate('/wines')
                  } else {
                    setSelectedCategory(category.id)
                  }
                }}
                className={`flex items-center px-4 py-2 rounded-full transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-teal-50 border border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.name}
                {(category.id === 'cocktails' || category.id === 'wines') && (
                  <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    Enhanced
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Beverages Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-bay-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bay-pulse">
              <Wine className="h-12 w-12 text-bay-600" />
            </div>
            <h2 className="text-2xl font-bold text-bay-900 mb-4">Loading Bay Fresh Selections...</h2>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-sunset-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wine className="h-12 w-12 text-sunset-600" />
            </div>
            <h2 className="text-2xl font-bold text-bay-900 mb-4">Unable to Load Beverages</h2>
            <p className="text-bay-600 max-w-md mx-auto">{error}</p>
          </div>
        ) : filteredBeverages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-bay-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-bay-600" />
            </div>
            <h2 className="text-2xl font-bold text-bay-900 mb-4">No Beverages Found</h2>
            <p className="text-bay-600 max-w-md mx-auto">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-bay-600">
                Showing {filteredBeverages.length} of {beverages.length} beverages
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBeverages.map((beverage) => (
                <BeverageCard key={beverage._id} beverage={beverage} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BeveragesPage
