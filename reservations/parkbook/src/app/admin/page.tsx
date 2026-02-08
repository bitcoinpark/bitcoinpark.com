import { auth, hasMinimumRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!hasMinimumRole(session.user.role, 'BOOKING_ADMIN')) {
    redirect('/dashboard')
  }

  // Get stats
  const [
    totalUsers,
    activeUsers,
    totalLocations,
    totalSpaces,
    totalBookings,
    pendingBookings,
    todayBookings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.location.count(),
    prisma.space.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.booking.count({
      where: {
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: 'CONFIRMED',
      },
    }),
  ])

  // Get recent audit logs
  const recentLogs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  })

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
              <h1 className="text-xl font-semibold">ParkBook Admin</h1>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage users, spaces, and bookings
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-[#0e3c07]">{totalUsers}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            <div className="text-xs text-gray-500 mt-1">{activeUsers} active</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-[#0e3c07]">{totalSpaces}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Spaces</div>
            <div className="text-xs text-gray-500 mt-1">{totalLocations} locations</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-[#0e3c07]">{totalBookings}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</div>
            <div className="text-xs text-gray-500 mt-1">{todayBookings} today</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-yellow-500">{pendingBookings}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</div>
            {pendingBookings > 0 && (
              <Link href="/admin/bookings?status=PENDING_APPROVAL" className="text-xs text-[#0e3c07] hover:underline mt-1 block">
                Review now &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/users"
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Manage Users</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add, edit, or deactivate users</p>
          </Link>
          <Link
            href="/admin/spaces"
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Manage Spaces</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configure rooms and booking rules</p>
          </Link>
          <Link
            href="/admin/locations"
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Manage Locations</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configure buildings and hours</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {log.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        by {log.user?.name || 'Unknown'} &bull; {log.entityType}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">No recent activity</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
