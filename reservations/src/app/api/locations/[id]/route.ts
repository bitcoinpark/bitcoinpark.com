import { NextRequest, NextResponse } from 'next/server'
import { auth, hasMinimumRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateLocationSchema } from '@/lib/validations'

// GET /api/locations/[id] - Get a single location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        spaces: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { spaces: true },
        },
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('GET /api/locations/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/locations/[id] - Update a location
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update locations
    if (!hasMinimumRole(session.user.role, 'LOCATION_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateLocationSchema.parse(body)

    const existingLocation = await prisma.location.findUnique({
      where: { id },
    })

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check for duplicate name if changing
    if (data.name && data.name !== existingLocation.name) {
      const duplicate = await prisma.location.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'A location with this name already exists' },
          { status: 409 }
        )
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        timezone: data.timezone,
        hoursOfOperation: data.hoursOfOperation as any,
        description: data.description,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'LOCATION_UPDATED',
        entityType: 'Location',
        entityId: id,
        details: data as any,
      },
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('PATCH /api/locations/[id] error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/locations/[id] - Delete a location (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admins can delete locations
    if (!hasMinimumRole(session.user.role, 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: { select: { spaces: true } },
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Prevent deletion if there are spaces
    if (location._count.spaces > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with existing spaces. Delete or move spaces first.' },
        { status: 400 }
      )
    }

    await prisma.location.delete({
      where: { id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'LOCATION_DELETED',
        entityType: 'Location',
        entityId: id,
        details: { name: location.name },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/locations/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
