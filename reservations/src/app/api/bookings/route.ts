import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createBookingSchema, bookingQuerySchema } from '@/lib/validations'
import { sendEmail, bookingConfirmationEmail } from '@/lib/email'
import { BookingStatus } from '@prisma/client'

// GET /api/bookings - List bookings with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = bookingQuerySchema.parse({
      spaceId: searchParams.get('spaceId') ?? undefined,
      locationId: searchParams.get('locationId') ?? undefined,
      userId: searchParams.get('userId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    // Build where clause
    const where: any = {}

    if (query.spaceId) {
      where.spaceId = query.spaceId
    }

    if (query.locationId) {
      where.space = { locationId: query.locationId }
    }

    // Non-admins can only see their own bookings
    if (session.user.role === 'MEMBER' || session.user.role === 'GUEST') {
      where.userId = session.user.id
    } else if (query.userId) {
      where.userId = query.userId
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.startDate) {
      where.startTime = { gte: new Date(query.startDate) }
    }

    if (query.endDate) {
      where.endTime = { ...where.endTime, lte: new Date(query.endDate) }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          space: {
            include: {
              location: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error('GET /api/bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createBookingSchema.parse(body)

    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)

    // Get the space with its location and booking rules
    const space = await prisma.space.findUnique({
      where: { id: data.spaceId },
      include: { location: true },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    if (space.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Space is not available for booking' }, { status: 400 })
    }

    // Check capacity
    if (data.attendeeCount > space.capacity) {
      return NextResponse.json(
        { error: `Space capacity is ${space.capacity}, requested ${data.attendeeCount}` },
        { status: 400 }
      )
    }

    // Check for booking conflicts (critical!)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        spaceId: data.spaceId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_APPROVAL] },
        OR: [
          {
            // New booking starts during existing booking
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            // New booking ends during existing booking
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            // New booking completely contains existing booking
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Time slot is already booked', conflictingBooking: { id: conflictingBooking.id, startTime: conflictingBooking.startTime, endTime: conflictingBooking.endTime } },
        { status: 409 }
      )
    }

    // Determine initial status based on approval requirement
    const status = space.requiresApproval ? BookingStatus.PENDING_APPROVAL : BookingStatus.CONFIRMED

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        spaceId: data.spaceId,
        userId: session.user.id,
        title: data.title,
        description: data.description,
        startTime,
        endTime,
        status,
        attendeeCount: data.attendeeCount,
        recurrenceRule: data.recurrenceRule,
      },
      include: {
        space: {
          include: { location: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BOOKING_CREATED',
        entityType: 'Booking',
        entityId: booking.id,
        details: {
          spaceId: data.spaceId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          status,
        },
      },
    })

    // Send confirmation email if booking is confirmed
    if (status === BookingStatus.CONFIRMED) {
      const emailContent = bookingConfirmationEmail({
        title: booking.title,
        spaceName: booking.space.name,
        locationName: booking.space.location.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        userName: booking.user.name,
      })

      await sendEmail({
        to: booking.user.email,
        ...emailContent,
      })
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('POST /api/bookings error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
