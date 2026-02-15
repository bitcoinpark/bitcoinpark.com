import { NextRequest, NextResponse } from 'next/server'
import { auth, hasMinimumRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createSpaceSchema } from '@/lib/validations'

// GET /api/spaces - List all spaces
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const type = searchParams.get('type')
    const status = searchParams.get('status') || 'ACTIVE'

    const where: any = {}

    if (locationId) {
      where.locationId = locationId
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    const spaces = await prisma.space.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            timezone: true,
          },
        },
      },
      orderBy: [{ locationId: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(spaces)
  } catch (error) {
    console.error('GET /api/spaces error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/spaces - Create a new space (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    if (!hasMinimumRole(session.user.role, 'LOCATION_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createSpaceSchema.parse(body)

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check for duplicate name at location
    const existing = await prisma.space.findFirst({
      where: {
        locationId: data.locationId,
        name: data.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A space with this name already exists at this location' },
        { status: 409 }
      )
    }

    const space = await prisma.space.create({
      data: {
        locationId: data.locationId,
        name: data.name,
        description: data.description,
        type: data.type,
        capacity: data.capacity,
        minCapacity: data.minCapacity,
        amenities: data.amenities as any,
        photos: data.photos as any,
        bookableHours: data.bookableHours,
        bufferMinutes: data.bufferMinutes,
        requiresApproval: data.requiresApproval,
        bookingRules: data.bookingRules as any,
      },
      include: {
        location: true,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SPACE_CREATED',
        entityType: 'Space',
        entityId: space.id,
        details: { name: space.name, locationId: space.locationId },
      },
    })

    return NextResponse.json(space, { status: 201 })
  } catch (error) {
    console.error('POST /api/spaces error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
