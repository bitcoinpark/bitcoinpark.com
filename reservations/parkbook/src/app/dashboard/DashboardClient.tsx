'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Tab = 'home' | 'book' | 'my-bookings' | 'calendar'

interface Space {
  id: string
  name: string
  type: string
  capacity: number
  description: string | null
  location: {
    id: string
    name: string
    timezone: string
  }
}

interface Booking {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  status: string
  attendeeCount: number
  space: {
    id: string
    name: string
    location: {
      id: string
      name: string
    }
  }
  user?: {
    id: string
    name: string
  }
}

interface LocationWithSpaces {
  id: string
  name: string
  spaces: {
    id: string
    name: string
    type: string
    capacity: number
  }[]
}

interface DashboardClientProps {
  user: {
    id: string
    name: string
    role: string
  }
  initialUpcomingBookings: Booking[]
  initialLocations: LocationWithSpaces[]
  todayBookingsCount: number
  isAdmin: boolean
}

export default function DashboardClient({
  user,
  initialUpcomingBookings,
  initialLocations,
  todayBookingsCount,
  isAdmin,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  // Book form state
  const [spaces, setSpaces] = useState<Space[]>([])
  const [bookingFormData, setBookingFormData] = useState({
    spaceId: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    attendeeCount: 1,
  })
  const [bookingError, setBookingError] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // My bookings state
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsFilter, setBookingsFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'day' | 'week'>('week')
  const [calendarBookings, setCalendarBookings] = useState<Booking[]>([])
  const [calendarSpaces, setCalendarSpaces] = useState<Space[]>([])
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const [calendarLoading, setCalendarLoading] = useState(false)

  // Fetch spaces for booking form
  useEffect(() => {
    if (activeTab === 'book' && spaces.length === 0) {
      fetchSpaces()
    }
  }, [activeTab])

  // Fetch bookings when switching to my-bookings tab
  useEffect(() => {
    if (activeTab === 'my-bookings') {
      fetchMyBookings()
    }
  }, [activeTab])

  // Fetch calendar data when switching to calendar tab
  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchCalendarData()
    }
  }, [activeTab, currentDate, calendarView, selectedSpace])

  const fetchSpaces = async () => {
    try {
      const res = await fetch('/api/spaces')
      if (res.ok) {
        const data = await res.json()
        setSpaces(data)
      }
    } catch (err) {
      console.error('Failed to fetch spaces:', err)
    }
  }

  const fetchMyBookings = async () => {
    setBookingsLoading(true)
    try {
      const res = await fetch('/api/bookings')
      if (res.ok) {
        const data = await res.json()
        setMyBookings(data.bookings || [])
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    } finally {
      setBookingsLoading(false)
    }
  }

  const fetchCalendarData = async () => {
    setCalendarLoading(true)
    try {
      // Fetch spaces for filter
      if (calendarSpaces.length === 0) {
        const spacesRes = await fetch('/api/spaces')
        if (spacesRes.ok) {
          const spacesData = await spacesRes.json()
          setCalendarSpaces(spacesData)
        }
      }

      // Calculate date range
      const startDate = new Date(currentDate)
      const endDate = new Date(currentDate)

      if (calendarView === 'week') {
        const day = startDate.getDay()
        startDate.setDate(startDate.getDate() - day)
        endDate.setDate(startDate.getDate() + 6)
      }

      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
      if (selectedSpace) {
        params.set('spaceId', selectedSpace)
      }

      const bookingsRes = await fetch(`/api/bookings?${params}`)
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setCalendarBookings(data.bookings || [])
      }
    } catch (err) {
      console.error('Failed to fetch calendar data:', err)
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError('')
    setBookingSubmitting(true)

    try {
      const startTime = new Date(`${bookingFormData.date}T${bookingFormData.startTime}:00`)
      const endTime = new Date(`${bookingFormData.date}T${bookingFormData.endTime}:00`)

      if (endTime <= startTime) {
        setBookingError('End time must be after start time')
        setBookingSubmitting(false)
        return
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: bookingFormData.spaceId,
          title: bookingFormData.title,
          description: bookingFormData.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          attendeeCount: bookingFormData.attendeeCount,
        }),
      })

      if (res.ok) {
        setBookingSuccess(true)
        setBookingFormData({
          spaceId: '',
          title: '',
          description: '',
          date: '',
          startTime: '',
          endTime: '',
          attendeeCount: 1,
        })
        // Switch to my-bookings to show the new booking
        setTimeout(() => {
          setBookingSuccess(false)
          setActiveTab('my-bookings')
        }, 1500)
      } else {
        const data = await res.json()
        setBookingError(data.error || 'Failed to create booking')
      }
    } catch (err) {
      setBookingError('An error occurred. Please try again.')
    } finally {
      setBookingSubmitting(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    setCancellingId(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (res.ok) {
        setMyBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
        )
      } else {
        alert('Failed to cancel booking')
      }
    } catch (err) {
      alert('An error occurred')
    } finally {
      setCancellingId(null)
    }
  }

  const navigateCalendarDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getWeekDays = () => {
    const days = []
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }
    return days
  }

  const hours = Array.from({ length: 14 }, (_, i) => i + 7)

  const getBookingsForSlot = (date: Date, hour: number) => {
    return calendarBookings.filter((booking) => {
      const bookingStart = new Date(booking.startTime)
      const bookingEnd = new Date(booking.endTime)
      const slotStart = new Date(date)
      slotStart.setHours(hour, 0, 0, 0)
      const slotEnd = new Date(date)
      slotEnd.setHours(hour + 1, 0, 0, 0)

      return (
        bookingStart < slotEnd &&
        bookingEnd > slotStart &&
        booking.status !== 'CANCELLED'
      )
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const selectedBookingSpace = spaces.find((s) => s.id === bookingFormData.spaceId)
  const today = new Date().toISOString().split('T')[0]
  const weekDays = calendarView === 'week' ? getWeekDays() : [currentDate]

  // Filter and sort bookings for my-bookings tab
  const now = new Date()
  const filteredBookings = myBookings.filter((booking) => {
    const bookingEnd = new Date(booking.endTime)
    if (bookingsFilter === 'upcoming') {
      return bookingEnd >= now && booking.status !== 'CANCELLED'
    }
    if (bookingsFilter === 'past') {
      return bookingEnd < now || booking.status === 'CANCELLED'
    }
    return true
  })

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (bookingsFilter === 'past') {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    }
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Confirmed
          </span>
        )
      case 'PENDING_APPROVAL':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Pending
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      {/* Header */}
      <header className="bg-[#0e3c07] text-white">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => setActiveTab('home')} className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center p-1">
                <Image src="/bp-logo-bw.png" alt="Bitcoin Park" width={32} height={32} className="invert" />
              </div>
              <h1 className="text-xl font-semibold">ParkBook</h1>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white/80">{user.name}</span>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm text-white/80 hover:text-white font-medium"
              >
                Admin
              </Link>
            )}
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-white/60 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.name.split(' ')[0]}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {todayBookingsCount > 0
              ? `You have ${todayBookingsCount} booking${todayBookingsCount > 1 ? 's' : ''} today.`
              : 'You have no bookings today.'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setActiveTab('book')}
            className={`rounded-xl p-6 transition-all text-left ${
              activeTab === 'book'
                ? 'bg-[#0e3c07] text-white ring-2 ring-[#0e3c07] ring-offset-2'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-[#0e3c07] hover:text-white hover:border-[#0e3c07] text-gray-900 dark:text-white'
            }`}
          >
            <div className="text-lg font-semibold mb-2">Book a Space</div>
            <p className={`text-sm ${activeTab === 'book' ? 'opacity-90' : 'text-gray-600 dark:text-gray-400 group-hover:text-white/90'}`}>
              Reserve a room or desk
            </p>
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`rounded-xl p-6 transition-all text-left ${
              activeTab === 'my-bookings'
                ? 'bg-[#0e3c07] text-white ring-2 ring-[#0e3c07] ring-offset-2'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-[#0e3c07] hover:text-white hover:border-[#0e3c07] text-gray-900 dark:text-white'
            }`}
          >
            <div className="text-lg font-semibold mb-2">My Bookings</div>
            <p className={`text-sm ${activeTab === 'my-bookings' ? 'opacity-90' : 'text-gray-600 dark:text-gray-400'}`}>
              View and manage your reservations
            </p>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`rounded-xl p-6 transition-all text-left ${
              activeTab === 'calendar'
                ? 'bg-[#0e3c07] text-white ring-2 ring-[#0e3c07] ring-offset-2'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-[#0e3c07] hover:text-white hover:border-[#0e3c07] text-gray-900 dark:text-white'
            }`}
          >
            <div className="text-lg font-semibold mb-2">Calendar</div>
            <p className={`text-sm ${activeTab === 'calendar' ? 'opacity-90' : 'text-gray-600 dark:text-gray-400'}`}>
              View availability across all spaces
            </p>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'home' && (
          <>
            {/* Upcoming Bookings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Bookings</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {initialUpcomingBookings.length > 0 ? (
                  initialUpcomingBookings.map((booking) => (
                    <div key={booking.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{booking.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.space.name} &bull; {booking.space.location.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          {new Date(booking.startTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(booking.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No upcoming bookings.{' '}
                    <button onClick={() => setActiveTab('book')} className="text-[#0e3c07] hover:underline">
                      Book a space
                    </button>
                  </div>
                )}
              </div>
              {initialUpcomingBookings.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab('my-bookings')}
                    className="text-sm text-[#0e3c07] hover:underline"
                  >
                    View all bookings &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Spaces by Location */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Spaces</h3>
              </div>
              <div className="p-6">
                {initialLocations.map((location) => (
                  <div key={location.id} className="mb-6 last:mb-0">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      {location.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {location.spaces.map((space) => (
                        <button
                          key={space.id}
                          onClick={() => {
                            setBookingFormData((prev) => ({ ...prev, spaceId: space.id }))
                            setActiveTab('book')
                          }}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#0e3c07] hover:bg-[#0e3c07]/5 transition-colors text-left"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{space.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Capacity: {space.capacity} &bull; {space.type.replace('_', ' ')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'book' && (
          <div className="max-w-2xl mx-auto">
            {bookingSuccess && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
                Booking created successfully! Redirecting to your bookings...
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-6">
              {bookingError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {bookingError}
                </div>
              )}

              {/* Space Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select a Space
                </label>
                <select
                  value={bookingFormData.spaceId}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, spaceId: e.target.value })}
                  required
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e3c07] focus:border-transparent"
                >
                  <option value="">Choose a space...</option>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.location.name} - {space.name} (Capacity: {space.capacity})
                    </option>
                  ))}
                </select>

                {selectedBookingSpace && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white">{selectedBookingSpace.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {selectedBookingSpace.location.name} &bull; {selectedBookingSpace.type.replace('_', ' ')} &bull; Capacity: {selectedBookingSpace.capacity}
                    </p>
                    {selectedBookingSpace.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        {selectedBookingSpace.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Booking Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Booking Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={bookingFormData.title}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, title: e.target.value })}
                    required
                    placeholder="e.g., Team Meeting, Workshop, etc."
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e3c07] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={bookingFormData.description}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, description: e.target.value })}
                    rows={3}
                    placeholder="Brief description of your booking..."
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e3c07] focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Attendees
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedBookingSpace?.capacity || 100}
                    value={bookingFormData.attendeeCount}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, attendeeCount: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e3c07] focus:border-transparent"
                  />
                  {selectedBookingSpace && (
                    <p className="text-xs text-gray-500 mt-1">Maximum capacity: {selectedBookingSpace.capacity}</p>
                  )}
                </div>
              </div>

              {/* Date and Time */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Date & Time</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={bookingFormData.date}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, date: e.target.value })}
                    required
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e3c07] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={bookingFormData.startTime}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, startTime: e.target.value })}
                      required
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e3c07] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={bookingFormData.endTime}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, endTime: e.target.value })}
                      required
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e3c07] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full py-4 px-4 bg-[#0e3c07] hover:bg-[#0a2d05] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Booking...
                  </span>
                ) : (
                  'Create Booking'
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'my-bookings' && (
          <>
            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
              {(['upcoming', 'past', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBookingsFilter(tab)}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    bookingsFilter === tab
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Bookings List */}
            {bookingsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e3c07] mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading bookings...</p>
              </div>
            ) : sortedBookings.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {bookingsFilter === 'upcoming'
                    ? 'No upcoming bookings.'
                    : bookingsFilter === 'past'
                    ? 'No past bookings.'
                    : 'No bookings found.'}
                </p>
                <button
                  onClick={() => setActiveTab('book')}
                  className="text-[#0e3c07] hover:underline font-medium"
                >
                  Book a space &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedBookings.map((booking) => {
                  const isPast = new Date(booking.endTime) < now
                  const isCancelled = booking.status === 'CANCELLED'

                  return (
                    <div
                      key={booking.id}
                      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                        isPast || isCancelled ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {booking.title}
                            </h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p>
                              <span className="font-medium">{booking.space.name}</span> &bull;{' '}
                              {booking.space.location.name}
                            </p>
                            <p>
                              {new Date(booking.startTime).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p>
                              {new Date(booking.startTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(booking.endTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                            <p>{booking.attendeeCount} attendee{booking.attendeeCount > 1 ? 's' : ''}</p>
                          </div>
                          {booking.description && (
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                              {booking.description}
                            </p>
                          )}
                        </div>
                        {!isPast && !isCancelled && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            className="ml-4 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'calendar' && (
          <>
            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Date Navigation */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateCalendarDate('prev')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateCalendarDate('next')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {calendarView === 'week'
                      ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* View Toggle & Space Filter */}
                <div className="flex items-center space-x-4">
                  {/* View Toggle */}
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setCalendarView('day')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        calendarView === 'day'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Day
                    </button>
                    <button
                      onClick={() => setCalendarView('week')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        calendarView === 'week'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Week
                    </button>
                  </div>

                  {/* Space Filter */}
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0e3c07]"
                  >
                    <option value="">All Spaces</option>
                    {calendarSpaces.map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.location.name} - {space.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {calendarLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e3c07] mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading calendar...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="w-20 p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Time
                        </th>
                        {weekDays.map((day) => (
                          <th
                            key={day.toISOString()}
                            className={`p-3 text-center text-sm font-medium ${
                              isToday(day)
                                ? 'bg-[#0e3c07]/10 text-[#0e3c07]'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className="text-lg">{day.getDate()}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hours.map((hour) => (
                        <tr key={hour} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="p-2 text-xs text-gray-500 dark:text-gray-400 align-top">
                            {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                          </td>
                          {weekDays.map((day) => {
                            const slotBookings = getBookingsForSlot(day, hour)
                            return (
                              <td
                                key={`${day.toISOString()}-${hour}`}
                                className={`p-1 border-l border-gray-100 dark:border-gray-700/50 align-top h-16 ${
                                  isToday(day) ? 'bg-[#0e3c07]/5' : ''
                                }`}
                              >
                                {slotBookings.map((booking) => (
                                  <div
                                    key={booking.id}
                                    className="text-xs p-1.5 mb-1 rounded bg-[#0e3c07]/20 border-l-2 border-[#0e3c07] truncate"
                                    title={`${booking.title} - ${booking.space.name}`}
                                  >
                                    <div className="font-medium text-gray-900 dark:text-white truncate">
                                      {booking.title}
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 truncate">
                                      {booking.space.name}
                                    </div>
                                  </div>
                                ))}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-[#0e3c07]/20 border-l-2 border-[#0e3c07] rounded"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-[#0e3c07]/10 rounded"></div>
                <span>Today</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
