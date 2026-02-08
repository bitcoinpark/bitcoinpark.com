import { NextRequest, NextResponse } from 'next/server'
import { auth, hasMinimumRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createLocationSchema } from '@/lib/validations'

// GET /api/locations - List all locations
export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: {
        _count: {
          select: { spaces: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('GET /api/locations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/locations - Create a new location (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admins can create locations
    if (!hasMinimumRole(session.user.role, 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createLocationSchema.parse(body)

    // Check for duplicate name
    const existing = await prisma.location.findFirst({
      where: { name: data.name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A location with this name already exists' },
        { status: 409 }
      )
    }

    const location = await prisma.location.create({
      data: {
        name: data.name,
        address: data.address,
        timezone: data.timezone,
        hoursOfOperation: data.hoursOfOperation,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'LOCATION_CREATED',
        entityType: 'Location',
        entityId: location.id,
        details: { name: location.name },
      },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('POST /api/locations error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
