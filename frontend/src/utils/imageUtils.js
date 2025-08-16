// Utility function to get the full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // Get the backend base URL (remove /api from the end)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '')
  
  // For spirit/beverage images, construct the proper /images/ path
  let cleanPath = imagePath
  
  // If it's just a filename (no path), add /images/ prefix
  if (!imagePath.startsWith('/') && !imagePath.includes('/')) {
    cleanPath = `/images/${imagePath}`
  } else if (!imagePath.startsWith('/')) {
    cleanPath = `/${imagePath}`
  }
  
  return `${BACKEND_BASE_URL}${cleanPath}`
}

// Utility function to get a fallback image for beverages
export const getBeverageFallbackImage = (beverage) => {
  // You can customize this based on beverage type
  if (beverage.category === 'wine' || beverage.type === 'wine') {
    return '/images/fallback/wine-bottle.svg'
  }
  if (beverage.category === 'cocktail') {
    return '/images/fallback/cocktail-glass.svg'
  }
  if (beverage.category === 'beer') {
    return '/images/fallback/beer-mug.svg'
  }
  return '/images/fallback/beverage-default.svg'
}
