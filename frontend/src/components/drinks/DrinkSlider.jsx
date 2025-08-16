import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Star, Wine, Beer, Coffee } from 'lucide-react'
import { useAvailableBeverages } from '../../hooks/useBeverages'

const DrinkSlider = () => {
  const { availableBeverages, isLoading, error } = useAvailableBeverages()
  const [drinks, setDrinks] = useState([])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const sliderRef = useRef(null)

  useEffect(() => {
    if (availableBeverages && availableBeverages.length > 0) {
      setDrinks(availableBeverages)
    }
  }, [availableBeverages])

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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % drinks.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + drinks.length) % drinks.length)
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  useEffect(() => {
    if (isAutoPlaying && drinks.length > 0) {
      const interval = setInterval(nextSlide, 4000)
      return () => clearInterval(interval)
    }
  }, [isAutoPlaying, drinks.length])

  const handleMouseEnter = () => setIsAutoPlaying(false)
  const handleMouseLeave = () => setIsAutoPlaying(true)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">Error loading beverages: {error}</p>
        <p className="text-gray-600">Please try again later</p>
      </div>
    )
  }

  if (!drinks || drinks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">No beverages available at the moment</p>
      </div>
    )
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Slider */}
      <div className="relative overflow-hidden rounded-xl bg-white shadow-lg">
        <div 
          ref={sliderRef}
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {drinks.map((drink, index) => (
            <div key={drink.id} className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                {/* Drink Image */}
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {drink.image ? (
                      <img 
                        src={drink.image}
                        alt={drink.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-teal-100 to-teal-200 items-center justify-center ${drink.image ? 'hidden' : 'flex'}`}>
                      <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center">
                        {getTypeIcon(drink.type)}
                        <span className="sr-only">{drink.name}</span>
                      </div>
                    </div>
                  </div>
                  {(drink.available || drink.isAvailable) && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Available
                    </div>
                  )}
                </div>

                {/* Drink Details */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(drink.type)}`}>
                      {getTypeIcon(drink.type)}
                      {drink.type.charAt(0).toUpperCase() + drink.type.slice(1)}
                    </span>
                    <span className="text-gray-500 text-sm">{drink.alcohol}</span>
                  </div>
                  
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                    {drink.name}
                  </h3>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(drink.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {drink.rating} / 5.0
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-6 text-lg">
                    {drink.description}
                  </p>
                  
                  <div className="flex items-center justify-end">
                    <button className="btn-primary">
                      Add to Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {drinks.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-teal-600 scale-110'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`text-sm px-3 py-1 rounded-full transition-colors duration-200 ${
            isAutoPlaying
              ? 'bg-teal-100 text-teal-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isAutoPlaying ? 'Auto-playing' : 'Paused'}
        </button>
      </div>
    </div>
  )
}

export default DrinkSlider
