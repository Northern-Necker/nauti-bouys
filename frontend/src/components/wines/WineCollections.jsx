import { useState, useEffect } from 'react'
import { Star, Award, TrendingUp, Crown, MapPin, Calendar } from 'lucide-react'
import { beverageService } from '../../services/api/beverageService'
import { getImageUrl } from '../../utils/imageUtils'

const WineCollections = ({ onWineSelect }) => {
  const [featuredWines, setFeaturedWines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedWines = async () => {
      try {
        const result = await beverageService.getBeveragesByCategory('wines')
        if (result.success) {
          // Use the wines data from the API
          const wines = result.data.beverages || []
          setFeaturedWines(wines)
        }
      } catch (error) {
        console.error('Failed to fetch featured wines:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedWines()
  }, [])

  const wineCollections = [
    {
      id: 'sommelier-picks',
      title: "Sommelier's Selection",
      subtitle: 'Expertly curated by our wine director',
      icon: Award,
      color: 'from-amber-500 to-yellow-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      wines: featuredWines.filter(w => w.specialty || w.rating >= 4.5).slice(0, 3)
    },
    {
      id: 'rare-vintages',
      title: 'Rare & Vintage',
      subtitle: 'Exceptional wines from outstanding years',
      icon: Crown,
      color: 'from-purple-500 to-indigo-500',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
      wines: featuredWines.filter(w => {
        const vintage = parseInt(w.vintage)
        return vintage && (vintage <= 2010 || w.price >= 100)
      }).slice(0, 3)
    },
    {
      id: 'regional-highlights',
      title: 'Regional Highlights',
      subtitle: 'Showcase of terroir excellence',
      icon: MapPin,
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      wines: featuredWines.filter(w => 
        w.region && ['Napa Valley', 'Bordeaux', 'Burgundy', 'Tuscany'].some(region => 
          w.region.toLowerCase().includes(region.toLowerCase())
        )
      ).slice(0, 3)
    },
    {
      id: 'trending-now',
      title: 'Trending Now',
      subtitle: 'Popular selections this month',
      icon: TrendingUp,
      color: 'from-rose-500 to-pink-500',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      wines: featuredWines.slice(0, 3)
    }
  ]

  const WineQuickCard = ({ wine, collection }) => (
    <button
      onClick={() => onWineSelect && onWineSelect(wine)}
      className="group w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200 hover:border-gray-300"
    >
      <div className="flex items-center space-x-3">
        {/* Wine Image/Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
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
          <div className={`w-full h-full bg-gradient-to-br ${collection.bgColor} items-center justify-center ${wine.image ? 'hidden' : 'flex'}`}>
            <div className="w-6 h-8 bg-gradient-to-b from-red-600 to-red-800 rounded-sm flex items-end justify-center">
              <div className="w-4 h-1 bg-red-900 rounded-full mb-1"></div>
            </div>
          </div>
        </div>

        {/* Wine Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
            {wine.name}
          </h4>
          <div className="flex items-center space-x-2 mt-1">
            {wine.vintage && (
              <span className="text-xs text-gray-500">
                {wine.vintage}
              </span>
            )}
            {wine.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500 ml-1">{wine.rating}</span>
              </div>
            )}
          </div>
          {wine.region && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {wine.region}
            </div>
          )}
        </div>

        {/* Wine Type Badge */}
        {wine.wineType && (
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              wine.wineType?.toLowerCase().includes('red') ? 'bg-red-100 text-red-800' :
              wine.wineType?.toLowerCase().includes('white') ? 'bg-yellow-100 text-yellow-800' :
              wine.wineType?.toLowerCase().includes('rosé') ? 'bg-pink-100 text-pink-800' :
              wine.wineType?.toLowerCase().includes('sparkling') ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {wine.wineType}
            </span>
          </div>
        )}
      </div>
    </button>
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Wine Collections</h2>
        <p className="text-gray-600">Discover our curated wine selections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {wineCollections.map((collection) => {
          const Icon = collection.icon
          return (
            <div key={collection.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              {/* Collection Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 bg-gradient-to-r ${collection.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{collection.title}</h3>
                  <p className="text-sm text-gray-500">{collection.subtitle}</p>
                </div>
              </div>

              {/* Wine List */}
              <div className="space-y-3">
                {collection.wines.length > 0 ? (
                  collection.wines.map((wine) => (
                    <WineQuickCard 
                      key={wine._id} 
                      wine={wine} 
                      collection={collection}
                    />
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Coming soon...</p>
                  </div>
                )}
              </div>

              {/* View All Link */}
              {collection.wines.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => onWineSelect && onWineSelect({ category: collection.id })}
                    className={`text-sm font-medium ${collection.textColor} hover:underline`}
                  >
                    Explore {collection.title.toLowerCase()} →
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Wine Education Section */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Wine Pairing & Education</h3>
          <p className="text-gray-600 mb-4">
            Enhance your dining experience with our sommelier's pairing recommendations
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="text-sm font-medium text-gray-900">Food Pairings</div>
              <div className="text-xs text-gray-500">Expert recommendations</div>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="text-sm font-medium text-gray-900">Tasting Notes</div>
              <div className="text-xs text-gray-500">Detailed profiles</div>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="text-sm font-medium text-gray-900">Wine Education</div>
              <div className="text-xs text-gray-500">Learn about regions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WineCollections
