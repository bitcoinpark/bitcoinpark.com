import { NextRequest, NextResponse } from 'next/server'
import { auth, hasMinimumRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateSpaceSchema } from '@/lib/validations'

// GET /api/spaces/[id] - Get a single space
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        location: true,
      },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    return NextResponse.json(space)
  } catch (error) {
    console.error('GET /api/spaces/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/spaces/[id] - Update a space
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update spaces
    if (!hasMinimumRole(session.user.role, 'LOCATION_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateSpaceSchema.parse(body)

    const existingSpace = await prisma.space.findUnique({
      where: { id },
    })

    if (!existingSpace) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    // Check for duplicate name at location if changing
    if (data.name && data.name !== existingSpace.name) {
      const duplicate = await prisma.space.findFirst({
        where: {
          locationId: existingSpace.locationId,
          name: data.name,
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'A space with this name already exists at this location' },
          { status: 409 }
        )
      }
    }

    const space = await prisma.space.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        capacity: data.capacity,
        minCapacity: data.minCapacity,
        amenities: data.amenities,
        photos: data.photos,
        bookableHours: data.bookableHours,
        bufferMinutes: data.bufferMinutes,
        requiresApproval: data.requiresApproval,
        bookingRules: data.bookingRules,
        status: body.status, // Allow status updates
      },
      include: {
        location: true,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SPACE_UPDATED',
        entityType: 'Space',
        entityId: id,
        details: data,
      },
    })

    return NextResponse.json(space)
  } catch (error) {
    console.error('PATCH /api/spaces/[id] error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/spaces/[id] - Delete a space (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admins can delete spaces
    if (!hasMinimumRole(session.user.role, 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true } },
      },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    // Prevent deletion if there are bookings
    if (space._count.bookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete space with existing bookings. Cancel or archive bookings first.' },
        { status: 400 }
      )
    }

    await prisma.space.delete({
      where: { id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SPACE_DELETED',
        entityType: 'Space',
        entityId: id,
        details: { name: space.name },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/spaces/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
