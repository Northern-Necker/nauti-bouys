import { useState } from 'react'
import { Calendar, Clock, Users, MapPin } from 'lucide-react'

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Reservations</h1>
          <p className="text-lg text-gray-600">
            Book your table and join our exclusive events
          </p>
        </div>

        <div className="text-center py-16">
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-12 w-12 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Reservation System Coming Soon
          </h2>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            We're building an advanced reservation system with calendar integration. Soon you'll be able to book tables and events seamlessly!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-2 text-teal-600" />
              Flexible time slots
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="h-5 w-5 mr-2 text-teal-600" />
              Group bookings
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2 text-teal-600" />
              Premium locations
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage