'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Booking {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  space: {
    id: string
    name: string
    location: {
      id: string
      name: string
    }
  }
  user: {
    id: string
    name: string
  }
}

interface Space {
  id: string
  name: string
  location: {
    id: string
    name: string
  }
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'day' | 'week'>('week')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [currentDate, view, selectedSpace])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch spaces
      const spacesRes = await fetch('/api/spaces')
      if (spacesRes.ok) {
        const spacesData = await spacesRes.json()
        setSpaces(spacesData)
      }

      // Calculate date range
      const startDate = new Date(currentDate)
      const endDate = new Date(currentDate)

      if (view === 'week') {
        // Start from Sunday
        const day = startDate.getDay()
        startDate.setDate(startDate.getDate() - day)
        endDate.setDate(startDate.getDate() + 6)
      }

      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)

      // Fetch bookings
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
        setBookings(data.bookings || [])
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
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

  const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM to 8 PM

  const getBookingsForSlot = (date: Date, hour: number) => {
    return bookings.filter((booking) => {
      const bookingStart = new Date(booking.startTime)
      const bookingEnd = new Date(booking.endTime)
      const slotStart = new Date(date)
      slotStart.setHours(hour, 0, 0, 0)
      const slotEnd = new Date(date)
      slotEnd.setHours(hour + 1, 0, 0, 0)

      // Check if booking overlaps with this hour slot
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

  const weekDays = view === 'week' ? getWeekDays() : [currentDate]

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      {/* Header */}
      <header className="bg-[#0e3c07] text-white">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center p-1">
                <Image src="/bp-logo-bw.png" alt="Bitcoin Park" width={32} height={32} className="invert" />
              </div>
              <h1 className="text-xl font-semibold">ParkBook</h1>
            </Link>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-white/80 hover:text-white"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View availability across all spaces
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Date Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
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
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {view === 'week'
                  ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* View Toggle & Space Filter */}
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setView('day')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    view === 'day'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    view === 'week'
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
                {spaces.map((space) => (
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
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e3c07] mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading calendar...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                {/* Header */}
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
                {/* Body */}
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
      </main>
    </div>
  )
}
