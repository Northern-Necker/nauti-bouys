import { useState, useEffect } from 'react'
import { Star, Award, Crown, Flame, Shield, Zap, MapPin, Calendar } from 'lucide-react'
import { beverageService } from '../../services/api/beverageService'
import { getImageUrl } from '../../utils/imageUtils'

const SpiritCollections = ({ onSpiritSelect }) => {
  const [featuredSpirits, setFeaturedSpirits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedSpirits = async () => {
      try {
        const result = await beverageService.getBeveragesByCategory('spirits')
        if (result.success) {
          // Use the spirits data from the API
          const spirits = result.data.beverages || []
          setFeaturedSpirits(spirits)
        }
      } catch (error) {
        console.error('Failed to fetch featured spirits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedSpirits()
  }, [])

  const spiritCollections = [
    {
      id: 'rare-allocated',
      title: "Rare & Allocated",
      subtitle: 'Hard-to-find bottles and limited releases',
      icon: Crown,
      color: 'from-yellow-500 to-amber-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      spirits: featuredSpirits.filter(s => 
        // Filter for rare/allocated spirits based on name patterns and age
        s.name.toLowerCase().includes('pappy') ||
        s.name.toLowerCase().includes('macallan') ||
        s.name.toLowerCase().includes('blanton') ||
        s.name.toLowerCase().includes('weller') ||
        s.name.toLowerCase().includes('yamazaki') ||
        s.name.toLowerCase().includes('hibiki') ||
        s.name.toLowerCase().includes('limited') ||
        s.name.toLowerCase().includes('reserve') ||
        s.name.toLowerCase().includes('special') ||
        (s.age && s.age >= 18) // 18+ year spirits are typically rare
      ).slice(0, 3)
    },
    {
      id: 'whiskey-bourbon',
      title: 'Whiskey & Bourbon',
      subtitle: 'Premium American and international whiskeys',
      icon: Flame,
      color: 'from-amber-600 to-orange-600',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      spirits: featuredSpirits.filter(s => 
        ['whiskey', 'bourbon', 'scotch', 'rye', 'pappy', 'weller', 'blanton', 'macallan', 'yamazaki', 'hibiki'].some(type =>
          s.name.toLowerCase().includes(type)
        )
      ).slice(0, 3)
    },
    {
      id: 'agave-spirits',
      title: 'Agave Spirits',
      subtitle: 'Premium tequilas and mezcals',
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      spirits: featuredSpirits.filter(s => 
        ['tequila', 'mezcal', 'agave', 'patron', 'don julio', 'clase azul'].some(type =>
          s.name.toLowerCase().includes(type)
        )
      ).slice(0, 3)
    },
    {
      id: 'gin-vodka',
      title: 'Gin & Vodka',
      subtitle: 'Craft distilled clear spirits',
      icon: Shield,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      spirits: featuredSpirits.filter(s => 
        ['gin', 'vodka', 'hendrick', 'botanist', 'monkey 47', 'grey goose', 'beluga'].some(type =>
          s.name.toLowerCase().includes(type)
        )
      ).slice(0, 3)
    }
  ]

  const SpiritQuickCard = ({ spirit, collection }) => (
    <button
      onClick={() => onSpiritSelect && onSpiritSelect(spirit)}
      className="group w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200 hover:border-gray-300"
    >
      <div className="flex items-center space-x-3">
        {/* Spirit Image/Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
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
          <div className={`w-full h-full bg-gradient-to-br ${collection.bgColor} items-center justify-center ${spirit.image ? 'hidden' : 'flex'}`}>
            <div className="w-6 h-8 bg-gradient-to-b from-amber-600 to-amber-800 rounded-sm flex items-center justify-center">
              <div className="w-4 h-1 bg-amber-900 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Spirit Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate group-hover:text-amber-600 transition-colors">
            {spirit.name}
          </h4>
          <div className="flex items-center space-x-2 mt-1">
            {spirit.age && (
              <span className="text-xs text-gray-500">
                {spirit.age}yr
              </span>
            )}
            {spirit.proof && (
              <span className="text-xs text-gray-500">
                {spirit.proof}°
              </span>
            )}
            {spirit.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500 ml-1">{spirit.rating}</span>
              </div>
            )}
          </div>
          {spirit.distillery && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {spirit.distillery}
            </div>
          )}
        </div>

        {/* Spirit Type Badge */}
        {spirit.spiritType && (
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              spirit.spiritType?.toLowerCase().includes('whiskey') || spirit.spiritType?.toLowerCase().includes('bourbon') ? 'bg-amber-100 text-amber-800' :
              spirit.spiritType?.toLowerCase().includes('tequila') || spirit.spiritType?.toLowerCase().includes('mezcal') ? 'bg-green-100 text-green-800' :
              spirit.spiritType?.toLowerCase().includes('gin') || spirit.spiritType?.toLowerCase().includes('vodka') ? 'bg-blue-100 text-blue-800' :
              spirit.spiritType?.toLowerCase().includes('rum') ? 'bg-yellow-100 text-yellow-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {spirit.spiritType}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Spirit Collections</h2>
        <p className="text-gray-600">Explore our curated selection of premium spirits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {spiritCollections.map((collection) => {
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

              {/* Spirit List */}
              <div className="space-y-3">
                {collection.spirits.length > 0 ? (
                  collection.spirits.map((spirit) => (
                    <SpiritQuickCard 
                      key={spirit._id} 
                      spirit={spirit} 
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
              {collection.spirits.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      if (onSpiritSelect) {
                        // Apply appropriate filter based on collection type
                        switch (collection.id) {
                          case 'rare-allocated':
                            onSpiritSelect({ filterType: 'rarity', filterValue: 'rare' })
                            break
                          case 'whiskey-bourbon':
                            onSpiritSelect({ filterType: 'spiritType', filterValue: 'whiskey' })
                            break
                          case 'agave-spirits':
                            onSpiritSelect({ filterType: 'spiritType', filterValue: 'tequila' })
                            break
                          case 'gin-vodka':
                            onSpiritSelect({ filterType: 'spiritType', filterValue: 'gin' })
                            break
                          default:
                            onSpiritSelect({ category: collection.id })
                        }
                      }
                    }}
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

      {/* Spirit Education Section */}
      <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Spirit Knowledge & Tasting</h3>
          <p className="text-gray-600 mb-4">
            Discover the art of spirit appreciation with our expert guidance
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="text-sm font-medium text-gray-900">Tasting Notes</div>
              <div className="text-xs text-gray-500">Flavor profiles & aromas</div>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="text-sm font-medium text-gray-900">Production Methods</div>
              <div className="text-xs text-gray-500">Distillation & aging</div>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="text-sm font-medium text-gray-900">Regional Styles</div>
              <div className="text-xs text-gray-500">Terroir & tradition</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpiritCollections
