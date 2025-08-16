import { Star, Wine, Beer, Coffee, Plus } from 'lucide-react'

const DrinkCard = ({ drink, onAddToCart, className = '' }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'wine':
        return <Wine className="h-4 w-4" />
      case 'beer':
        return <Beer className="h-4 w-4" />
      case 'cocktail':
      case 'mocktail':
        return <Coffee className="h-4 w-4" />
      default:
        return <Wine className="h-4 w-4" />
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      wine: 'bg-purple-100 text-purple-800',
      beer: 'bg-amber-100 text-amber-800',
      cocktail: 'bg-rose-100 text-rose-800',
      mocktail: 'bg-green-100 text-green-800',
      spirit: 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`card hover:shadow-lg transition-all duration-300 ${className}`}>
      {/* Image */}
      <div className="relative mb-4">
        <div className="aspect-square bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
          <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center">
            {getTypeIcon(drink.type)}
          </div>
        </div>
        {drink.available && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Available
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(drink.type)}`}>
            {getTypeIcon(drink.type)}
            {drink.type.charAt(0).toUpperCase() + drink.type.slice(1)}
          </span>
          <span className="text-gray-500 text-xs">{drink.alcohol}</span>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {drink.name}
        </h3>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(drink.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-1 text-xs text-gray-600">
            {drink.rating}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {drink.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-teal-600">
            ${drink.price}
          </span>
          <button 
            onClick={() => onAddToCart && onAddToCart(drink)}
            className="btn-primary py-1 px-3 text-sm flex items-center"
            disabled={!drink.available}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default DrinkCard