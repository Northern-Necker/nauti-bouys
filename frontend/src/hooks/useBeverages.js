import { useState, useEffect } from 'react'
import { beverageService } from '../services/api/beverageService'

export const useBeverages = (filters = {}) => {
  const [beverages, setBeverages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBeverages = async () => {
      setIsLoading(true)
      setError(null)
      
      const result = await beverageService.getAllBeverages(filters)
      
      if (result.success) {
        setBeverages(result.data)
      } else {
        setError(result.error)
      }
      
      setIsLoading(false)
    }

    fetchBeverages()
  }, [JSON.stringify(filters)])

  const searchBeverages = async (query) => {
    setIsLoading(true)
    setError(null)
    
    const result = await beverageService.searchBeverages(query)
    
    if (result.success) {
      setBeverages(result.data)
    } else {
      setError(result.error)
    }
    
    setIsLoading(false)
    return result
  }

  const getBeveragesByCategory = async (category) => {
    setIsLoading(true)
    setError(null)
    
    const result = await beverageService.getBeveragesByCategory(category)
    
    if (result.success) {
      setBeverages(result.data)
    } else {
      setError(result.error)
    }
    
    setIsLoading(false)
    return result
  }

  const refreshBeverages = async () => {
    const result = await beverageService.getAllBeverages(filters)
    
    if (result.success) {
      setBeverages(result.data)
    }
    
    return result
  }

  return {
    beverages,
    isLoading,
    error,
    searchBeverages,
    getBeveragesByCategory,
    refreshBeverages
  }
}

export const useFeaturedBeverages = () => {
  const [featuredBeverages, setFeaturedBeverages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFeaturedBeverages = async () => {
      setIsLoading(true)
      setError(null)
      
      const result = await beverageService.getFeaturedBeverages()
      
      if (result.success) {
        setFeaturedBeverages(result.data)
      } else {
        setError(result.error)
      }
      
      setIsLoading(false)
    }

    fetchFeaturedBeverages()
  }, [])

  return {
    featuredBeverages,
    isLoading,
    error
  }
}

export const useAvailableBeverages = () => {
  const [availableBeverages, setAvailableBeverages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAvailableBeverages = async () => {
      setIsLoading(true)
      setError(null)
      
      const result = await beverageService.getAvailableBeverages()
      
      if (result.success) {
        setAvailableBeverages(result.data)
      } else {
        setError(result.error)
        // Fallback to mock data if API fails
        setAvailableBeverages([
          {
            id: 1,
            name: "Coastal Pinot Noir",
            type: "wine",
            price: 45,
            rating: 4.8,
            image: "/api/placeholder/300/300",
            description: "Rich and smooth red wine from California coast",
            alcohol: "13.5%",
            available: true
          },
          {
            id: 2,
            name: "Harbor IPA",
            type: "beer",
            price: 8,
            rating: 4.6,
            image: "/api/placeholder/300/300",
            description: "Hoppy craft beer with citrus notes",
            alcohol: "6.2%",
            available: true
          },
          {
            id: 3,
            name: "Tropical Sunset",
            type: "cocktail",
            price: 12,
            rating: 4.9,
            image: "/api/placeholder/300/300",
            description: "Refreshing rum cocktail with tropical fruits",
            alcohol: "14%",
            available: true
          }
        ])
      }
      
      setIsLoading(false)
    }

    fetchAvailableBeverages()
  }, [])

  return {
    availableBeverages,
    isLoading,
    error
  }
}