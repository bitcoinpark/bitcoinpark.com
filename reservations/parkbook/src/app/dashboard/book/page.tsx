'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Location {
  id: string
  name: string
  timezone: string
}

interface Space {
  id: string
  name: string
  type: string
  capacity: number
  description: string | null
  location: Location
}

export default function BookSpacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSpaceId = searchParams.get('spaceId')

  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    spaceId: preselectedSpaceId || '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    attendeeCount: 1,
  })

  useEffect(() => {
    fetchSpaces()
  }, [])

  useEffect(() => {
    if (preselectedSpaceId && spaces.length > 0) {
      setFormData((prev) => ({ ...prev, spaceId: preselectedSpaceId }))
    }
  }, [preselectedSpaceId, spaces])

  const fetchSpaces = async () => {
    try {
      const res = await fetch('/api/spaces')
      if (res.ok) {
        const data = await res.json()
        setSpaces(data)
      }
    } catch (err) {
      console.error('Failed to fetch spaces:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Combine date and time into ISO strings
      const startTime = new Date(`${formData.date}T${formData.startTime}:00`)
      const endTime = new Date(`${formData.date}T${formData.endTime}:00`)

      // Validate times
      if (endTime <= startTime) {
        setError('End time must be after start time')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: formData.spaceId,
          title: formData.title,
          description: formData.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          attendeeCount: formData.attendeeCount,
        }),
      })

      if (res.ok) {
        router.push('/dashboard/my-bookings?success=true')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create booking')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedSpace = spaces.find((s) => s.id === formData.spaceId)

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0]

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
        <div className="max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Book a Space</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Reserve a room or desk at Bitcoin Park
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e3c07] mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading spaces...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Space Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select a Space
              </label>
              <select
                value={formData.spaceId}
                onChange={(e) => setFormData({ ...formData, spaceId: e.target.value })}
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

              {selectedSpace && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white">{selectedSpace.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedSpace.location.name} &bull; {selectedSpace.type.replace('_', ' ')} &bull; Capacity: {selectedSpace.capacity}
                  </p>
                  {selectedSpace.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {selectedSpace.description}
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  max={selectedSpace?.capacity || 100}
                  value={formData.attendeeCount}
                  onChange={(e) => setFormData({ ...formData, attendeeCount: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e3c07] focus:border-transparent"
                />
                {selectedSpace && (
                  <p className="text-xs text-gray-500 mt-1">Maximum capacity: {selectedSpace.capacity}</p>
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
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0e3c07] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-4 bg-[#0e3c07] hover:bg-[#0a2d05] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
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
        )}
      </main>
    </div>
  )
}
