import { NextRequest, NextResponse } from 'next/server'
import { auth, hasMinimumRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateBookingSchema } from '@/lib/validations'
import { sendEmail, bookingCancellationEmail } from '@/lib/email'
import { BookingStatus } from '@prisma/client'

// GET /api/bookings/[id] - Get a single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        space: {
          include: { location: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Only allow users to see their own bookings unless admin
    if (
      booking.userId !== session.user.id &&
      !hasMinimumRole(session.user.role, 'BOOKING_ADMIN')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('GET /api/bookings/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/bookings/[id] - Update a booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateBookingSchema.parse(body)

    // Get the existing booking
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        space: {
          include: { location: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = existingBooking.userId === session.user.id
    const isAdmin = hasMinimumRole(session.user.role, 'BOOKING_ADMIN')

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If cancelling, only allow if booking is in the future
    if (data.status === 'CANCELLED') {
      if (new Date(existingBooking.startTime) < new Date()) {
        return NextResponse.json(
          { error: 'Cannot cancel a booking that has already started' },
          { status: 400 }
        )
      }
    }

    // If changing times, check for conflicts
    if (data.startTime || data.endTime) {
      const startTime = data.startTime ? new Date(data.startTime) : existingBooking.startTime
      const endTime = data.endTime ? new Date(data.endTime) : existingBooking.endTime

      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          id: { not: id },
          spaceId: existingBooking.spaceId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_APPROVAL] },
          OR: [
            {
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
            {
              startTime: { gte: startTime },
              endTime: { lte: endTime },
            },
          ],
        },
      })

      if (conflictingBooking) {
        return NextResponse.json(
          { error: 'Time slot is already booked' },
          { status: 409 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    if (data.title) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.startTime) updateData.startTime = new Date(data.startTime)
    if (data.endTime) updateData.endTime = new Date(data.endTime)
    if (data.attendeeCount) updateData.attendeeCount = data.attendeeCount
    if (data.status) updateData.status = data.status

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
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
        action: data.status === 'CANCELLED' ? 'BOOKING_CANCELLED' : 'BOOKING_UPDATED',
        entityType: 'Booking',
        entityId: id,
        details: updateData,
      },
    })

    // Send cancellation email if cancelled
    if (data.status === 'CANCELLED') {
      const emailContent = bookingCancellationEmail({
        title: updatedBooking.title,
        spaceName: updatedBooking.space.name,
        locationName: updatedBooking.space.location.name,
        startTime: updatedBooking.startTime,
        userName: updatedBooking.user.name,
      })

      await sendEmail({
        to: updatedBooking.user.email,
        ...emailContent,
      })
    }

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error('PATCH /api/bookings/[id] error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/bookings/[id] - Delete a booking (admin only, hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can hard delete
    if (!hasMinimumRole(session.user.role, 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    await prisma.booking.delete({
      where: { id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BOOKING_DELETED',
        entityType: 'Booking',
        entityId: id,
        details: { deletedBooking: booking },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/bookings/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
