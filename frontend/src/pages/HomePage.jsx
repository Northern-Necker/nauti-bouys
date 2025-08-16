import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Calendar, MessageCircle, Wine, Sparkles, Anchor } from 'lucide-react'
import DrinkSlider from '../components/drinks/DrinkSlider'
import IAAvatar from '../components/common/IAAvatar'

const HomePage = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: 1,
      title: "Chesapeake Wine Tasting",
      date: "2024-08-09",
      time: "7:00 PM",
      description: "Explore premium wines paired with local Chesapeake Bay oysters"
    },
    {
      id: 2,
      title: "Crab Cake & Cocktail Night",
      date: "2024-08-12",
      time: "6:30 PM", 
      description: "Learn to craft signature bay-inspired cocktails with our mixologist"
    },
    {
      id: 3,
      title: "Sunset Pool Party",
      date: "2024-08-15",
      time: "5:00 PM",
      description: "Poolside gathering with local craft beers and live acoustic music"
    }
  ])

  return (
    <div className="min-h-screen">
      {/* Chesapeake Bay Hero Section */}
      <section className="hero-section text-white py-24 px-4 min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Welcome to <span className="text-white drop-shadow-lg animate-bay-pulse">Nauti Bouys</span>
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-sunset-300 to-sand-300 mx-auto mb-8 rounded-full animate-sunset-shift"></div>
            <p className="text-xl md:text-3xl mb-12 text-white/90 max-w-4xl mx-auto font-light leading-relaxed">
              Your Chesapeake Bay Waterfront Experience<br/>
              <span className="text-lg md:text-xl">Pool • Beach • Bay Views • Local Flavors</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up">
            <Link
              to="/beverages"
              className="btn-secondary text-bay-800 backdrop-blur-md bg-white/20 hover:bg-white/30 font-bold py-4 px-10 rounded-full transition-all duration-300 flex items-center shadow-2xl hover:shadow-white/25 transform hover:scale-110 animate-dock-float"
            >
              <Wine className="h-6 w-6 mr-3" />
              Bay Fresh Menu
              <ChevronRight className="h-6 w-6 ml-3" />
            </Link>
            <Link
              to="/calendar"
              className="btn-primary font-bold py-4 px-10 rounded-full flex items-center shadow-2xl hover:shadow-bay-500/50 transform hover:scale-110"
            >
              <Calendar className="h-6 w-6 mr-3" />
              Reserve Waterfront Table
            </Link>
          </div>

        </div>
        
        {/* Bay Water Parallax Effect */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/20 to-transparent bay-ripple"></div>
      </section>

      {/* Bay Fresh Selections Section */}
      <section className="waterfront-section py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bay-text-gradient">Bay Fresh Today</span>
            </h2>
            <p className="text-xl text-bay-700 max-w-3xl mx-auto leading-relaxed">
              Craft cocktails, local brews & Chesapeake Bay specialties<br/>
              <span className="text-base text-sunset-600">Made with local ingredients • Updated daily from our waterfront kitchen</span>
            </p>
          </div>
          <DrinkSlider />
        </div>
      </section>

      {/* Bay Concierge IA Section */}
      <section className="py-20 deck-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <Sparkles className="h-10 w-10 crab-icon mr-4" />
                <h2 className="text-4xl md:text-5xl font-bold">
                  <span className="bay-text-gradient">Your Bay Concierge</span>
                </h2>
              </div>
              <p className="text-xl text-bay-700 mb-8 leading-relaxed">
                Your AI-powered waterfront guide for discovering signature cocktails, securing poolside tables, 
                and creating unforgettable Chesapeake Bay experiences. Chat naturally about local favorites!
              </p>
              <div className="space-y-6 mb-10">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-sunset-400 to-sunset-500 rounded-full mr-4 animate-bay-pulse"></div>
                  <span className="text-bay-700 font-medium">Local Chesapeake Bay specialties & cocktails</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-bay-400 to-bay-500 rounded-full mr-4 animate-bay-pulse"></div>
                  <span className="text-bay-700 font-medium">Poolside & waterfront table reservations</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-marsh-400 to-marsh-500 rounded-full mr-4 animate-bay-pulse"></div>
                  <span className="text-bay-700 font-medium">Live availability & fresh daily catches</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-sand-400 to-sand-500 rounded-full mr-4 animate-bay-pulse"></div>
                  <span className="text-bay-700 font-medium">Natural voice & text conversations</span>
                </div>
              </div>
              <Link
                to="/ia"
                className="btn-primary inline-flex items-center text-lg font-bold py-4 px-8 shadow-2xl hover:shadow-bay-500/50 transform hover:scale-110"
              >
                <MessageCircle className="h-6 w-6 mr-3" />
                Chat with Bay AI
                <ChevronRight className="h-6 w-6 ml-3" />
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="animate-dock-float">
                <IAAvatar size="large" showControls={false} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waterfront Events Section */}
      <section className="py-20 bg-gradient-to-br from-bay-50 via-sand-50/50 to-oyster-50 bay-pattern">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bay-text-gradient">Waterfront Events</span>
            </h2>
            <p className="text-xl text-bay-700">
              Sunset gatherings • Crab feasts • Pool parties • Live music
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="card-bay hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] animate-fade-in">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-sunset-200 to-sunset-300 rounded-2xl flex items-center justify-center shadow-lg animate-dock-float">
                    <Calendar className="h-8 w-8 text-sunset-700" />
                  </div>
                  <div className="ml-6">
                    <p className="text-base text-bay-600 font-medium">{event.date}</p>
                    <p className="text-lg font-bold text-sunset-600">{event.time}</p>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-bay-800 mb-3">{event.title}</h3>
                <p className="text-bay-600 mb-6 leading-relaxed">{event.description}</p>
                <Link
                  to="/calendar"
                  className="inline-flex items-center text-sunset-600 hover:text-sunset-700 font-bold text-lg transition-all duration-300 transform hover:scale-105"
                >
                  Reserve Your Spot
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      <button className="btn-floating flex items-center justify-center group">
        <Anchor className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
      </button>
    </div>
  )
}

export default HomePage
