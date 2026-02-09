'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Space {
  id: string
  name: string
  type: string
  capacity: number
  status: string
  requiresApproval: boolean
  location: {
    id: string
    name: string
  }
}

export default function AdminSpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    fetchSpaces()
  }, [])

  const fetchSpaces = async () => {
    try {
      const res = await fetch('/api/spaces?status=')
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

  const locations = [...new Set(spaces.map((s) => s.location.name))]
  const types = [...new Set(spaces.map((s) => s.type))]

  const filteredSpaces = spaces.filter((space) => {
    if (locationFilter && space.location.name !== locationFilter) return false
    if (typeFilter && space.type !== typeFilter) return false
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
      case 'MAINTENANCE':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Maintenance</span>
      case 'INACTIVE':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Inactive</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Spaces</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage rooms and booking settings
            </p>
          </div>
          <Link
            href="/admin/spaces/new"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Add Space
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Spaces Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading spaces...</p>
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500">No spaces found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpaces.map((space) => (
              <div
                key={space.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{space.name}</h3>
                    <p className="text-sm text-gray-500">{space.location.name}</p>
                  </div>
                  {getStatusBadge(space.status)}
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>Type: {space.type.replace(/_/g, ' ')}</div>
                  <div>Capacity: {space.capacity}</div>
                  <div>
                    Approval: {space.requiresApproval ? (
                      <span className="text-yellow-600">Required</span>
                    ) : (
                      <span className="text-green-600">Auto-confirm</span>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/admin/spaces/${space.id}`}
                    className="text-sm text-green-600 hover:underline"
                  >
                    Edit Settings &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
