import { auth, hasMinimumRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Get user's upcoming bookings
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      startTime: { gte: new Date() },
      status: { in: ['CONFIRMED', 'PENDING_APPROVAL'] },
    },
    include: {
      space: {
        include: { location: true },
      },
    },
    orderBy: { startTime: 'asc' },
    take: 5,
  })

  // Get all locations for the quick book section
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    include: {
      spaces: {
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Get today's date stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayBookingsCount = await prisma.booking.count({
    where: {
      userId: session.user.id,
      startTime: { gte: today, lt: tomorrow },
      status: 'CONFIRMED',
    },
  })

  const isAdmin = hasMinimumRole(session.user.role, 'BOOKING_ADMIN')

  // Serialize dates for client component
  const serializedBookings = upcomingBookings.map((booking) => ({
    id: booking.id,
    title: booking.title,
    description: booking.description,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    status: booking.status,
    attendeeCount: booking.attendeeCount,
    space: {
      id: booking.space.id,
      name: booking.space.name,
      location: {
        id: booking.space.location.id,
        name: booking.space.location.name,
      },
    },
  }))

  const serializedLocations = locations.map((location) => ({
    id: location.id,
    name: location.name,
    spaces: location.spaces.map((space) => ({
      id: space.id,
      name: space.name,
      type: space.type,
      capacity: space.capacity,
    })),
  }))

  return (
    <DashboardClient
      user={{
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      }}
      initialUpcomingBookings={serializedBookings}
      initialLocations={serializedLocations}
      todayBookingsCount={todayBookingsCount}
      isAdmin={isAdmin}
    />
  )
}
