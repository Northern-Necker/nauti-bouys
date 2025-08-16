import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, User, Calendar, Wine, Coffee, Flame } from 'lucide-react'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/', icon: null },
    { name: 'Beverages', href: '/beverages', icon: Wine },
    { name: 'Cocktails', href: '/cocktails', icon: Coffee },
    { name: 'Wines', href: '/wines', icon: Wine },
    { name: 'Spirits', href: '/spirits', icon: Flame },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'IA Assistant', href: '/ia', icon: User },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white shadow-lg border-b-2 border-teal-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                <Wine className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-teal-900">Nauti Bouys</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-600'
                      : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {item.name}
                </Link>
              )
            })}
            <div className="flex items-center space-x-2 ml-6">
              <Link
                to="/login"
                className="text-gray-600 hover:text-teal-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary text-sm"
              >
                Sign Up
              </Link>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-teal-700 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-teal-100">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-teal-700 bg-teal-50'
                      : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5 mr-3" />}
                  {item.name}
                </Link>
              )
            })}
            <div className="pt-4 pb-3 border-t border-teal-100">
              <div className="flex items-center px-3 space-x-3">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-600 hover:text-teal-700 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
