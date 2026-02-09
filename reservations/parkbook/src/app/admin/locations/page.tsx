'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Location {
  id: string
  name: string
  address: string
  timezone: string
  isActive: boolean
  _count?: {
    spaces: number
  }
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations')
      if (res.ok) {
        const data = await res.json()
        setLocations(data)
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleLocationStatus = async (locationId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (res.ok) {
        setLocations((prev) =>
          prev.map((l) => (l.id === locationId ? { ...l, isActive: !currentStatus } : l))
        )
      }
    } catch (err) {
      console.error('Failed to update location:', err)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="bg-green-600 text-white">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center p-1">
                <Image src="/bp-logo-bw.png" alt="Bitcoin Park" width={32} height={32} className="invert" />
              </div>
              <h1 className="text-xl font-semibold">Park Reservations Admin</h1>
            </Link>
          </div>
          <Link
            href="/admin"
            className="text-sm text-white/80 hover:text-white"
          >
            &larr; Back to Admin
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Locations</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage buildings and operating hours
            </p>
          </div>
          <Link
            href="/admin/locations/new"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Add Location
          </Link>
        </div>

        {/* Locations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading locations...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500">No locations configured</p>
            <Link
              href="/admin/locations/new"
              className="mt-4 inline-block text-green-600 hover:underline"
            >
              Add your first location &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                  !location.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {location.name}
                      </h3>
                      {location.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 space-y-1">
                      <p>{location.address}</p>
                      <p className="text-sm">Timezone: {location.timezone}</p>
                      {location._count && (
                        <p className="text-sm">{location._count.spaces} spaces configured</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link
                      href={`/admin/locations/${location.id}`}
                      className="px-3 py-1.5 text-sm text-green-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleLocationStatus(location.id, location.isActive)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        location.isActive
                          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      {location.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
