import { useState, useEffect } from 'react'
import { Star, Zap, Clock, TrendingUp, Award, Heart } from 'lucide-react'
import { beverageService } from '../../services/api/beverageService'
import { getImageUrl } from '../../utils/imageUtils'

const QuickAccess = ({ onCocktailSelect }) => {
  const [featuredCocktails, setFeaturedCocktails] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedCocktails = async () => {
      try {
        const result = await beverageService.getBeveragesByCategory('cocktails')
        if (result.success) {
          // Use the cocktails data from the API
          const cocktails = result.data.beverages || []
          setFeaturedCocktails(cocktails)
        }
      } catch (error) {
        console.error('Failed to fetch featured cocktails:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedCocktails()
  }, [])

  const quickAccessSections = [
    {
      id: 'bartender-picks',
      title: "Bartender's Picks",
      subtitle: 'Our mixologists\' favorites',
      icon: Award,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      cocktails: featuredCocktails.filter(c => c.specialty || c.rating >= 4.5).slice(0, 3)
    },
    {
      id: 'patron-favorites',
      title: 'Patron Favorites',
      subtitle: 'Most loved by our guests',
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      cocktails: featuredCocktails.filter(c => c.favorites >= 10).slice(0, 3)
    },
    {
      id: 'trending',
      title: 'Trending Now',
      subtitle: 'Popular this week',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      cocktails: featuredCocktails.slice(0, 3)
    },
    {
      id: 'quick-classics',
      title: 'Quick Classics',
      subtitle: 'Ready in under 2 minutes',
      icon: Clock,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      cocktails: featuredCocktails.filter(c => 
        ['Old Fashioned', 'Martini', 'Manhattan', 'Negroni'].some(classic => 
          c.name.toLowerCase().includes(classic.toLowerCase())
        )
      ).slice(0, 3)
    }
  ]

  const CocktailQuickCard = ({ cocktail, section }) => (
    <button
      onClick={() => onCocktailSelect && onCocktailSelect(cocktail)}
      className="group w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200 hover:border-gray-300"
    >
      <div className="flex items-center space-x-3">
        {/* Image */}
        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
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
          <div className={`w-full h-full bg-gradient-to-br ${section.bgColor} items-center justify-center ${cocktail.image ? 'hidden' : 'flex'}`}>
            <Zap className={`h-6 w-6 ${section.textColor}`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate group-hover:text-teal-600 transition-colors">
            {cocktail.name}
          </h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm font-semibold text-teal-600">
              ${cocktail.price || 15}
            </span>
            {cocktail.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500 ml-1">{cocktail.rating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Badge */}
        {cocktail.specialty && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Signature
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Access</h2>
        <p className="text-gray-600">Jump to our most popular selections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickAccessSections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              {/* Section Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 bg-gradient-to-r ${section.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.subtitle}</p>
                </div>
              </div>

              {/* Cocktail List */}
              <div className="space-y-3">
                {section.cocktails.length > 0 ? (
                  section.cocktails.map((cocktail) => (
                    <CocktailQuickCard 
                      key={cocktail._id} 
                      cocktail={cocktail} 
                      section={section}
                    />
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Coming soon...</p>
                  </div>
                )}
              </div>

              {/* View All Link */}
              {section.cocktails.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => onCocktailSelect && onCocktailSelect({ category: section.id })}
                    className={`text-sm font-medium ${section.textColor} hover:underline`}
                  >
                    View all {section.title.toLowerCase()} →
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default QuickAccess
