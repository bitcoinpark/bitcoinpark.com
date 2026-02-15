import { PrismaClient, UserRole, SpaceType, SpaceStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

// Use DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:51214/template1?sslmode=disable'
const pool = new Pool({
  connectionString,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const defaultHours = {
  monday: { open: '09:00', close: '21:00' },
  tuesday: { open: '09:00', close: '21:00' },
  wednesday: { open: '09:00', close: '21:00' },
  thursday: { open: '09:00', close: '21:00' },
  friday: { open: '09:00', close: '21:00' },
  saturday: { open: '10:00', close: '18:00' },
  sunday: { open: null, close: null }, // Closed
}

async function main() {
  console.log('Seeding database...')

  // Create super admin user
  const passwordHash = await bcrypt.hash('BitcoinPark2026!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bitcoinpark.com' },
    update: {},
    create: {
      email: 'admin@bitcoinpark.com',
      passwordHash,
      name: 'Bitcoin Park Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  })
  console.log('Created admin user:', admin.email)

  // Create Nashville location
  const nashville = await prisma.location.upsert({
    where: { id: 'nashville' },
    update: {},
    create: {
      id: 'nashville',
      name: 'Bitcoin Park Nashville',
      address: '1910 & 1912 21st Ave S, Nashville, TN 37212',
      timezone: 'America/Chicago',
      hoursOfOperation: defaultHours,
      description: 'The original Bitcoin Park location in Nashville, TN. Features two connected buildings (1910 & 1912) with meeting rooms, event spaces, and a podcast studio.',
      isActive: true,
    },
  })
  console.log('Created location:', nashville.name)

  // Create Austin location
  const austin = await prisma.location.upsert({
    where: { id: 'austin' },
    update: {},
    create: {
      id: 'austin',
      name: 'Bitcoin Park Austin',
      address: 'Austin, TX',
      timezone: 'America/Chicago',
      hoursOfOperation: defaultHours,
      description: 'Bitcoin Park Austin (The Commons) - A Bitcoin community space in Austin, Texas.',
      isActive: true,
    },
  })
  console.log('Created location:', austin.name)

  // Nashville 1912 Building Spaces
  const nashville1912Spaces = [
    {
      name: '1912 - Glass Room',
      description: 'A bright, modern meeting room with glass walls. Perfect for small team meetings and video calls.',
      type: SpaceType.MEETING_ROOM,
      capacity: 8,
      amenities: ['TV/Monitor', 'Whiteboard', 'Video Conferencing', 'WiFi'],
    },
    {
      name: '1912 - Magnolia Room',
      description: 'A comfortable meeting space with classic decor. Ideal for workshops and collaborative sessions.',
      type: SpaceType.MEETING_ROOM,
      capacity: 12,
      amenities: ['Projector', 'Whiteboard', 'WiFi'],
    },
    {
      name: '1912 - Writing Room',
      description: 'A quiet, focused space for writing, reading, or individual work.',
      type: SpaceType.PRIVATE_OFFICE,
      capacity: 4,
      amenities: ['Desk Space', 'WiFi', 'Quiet Zone'],
    },
    {
      name: '1912 - Nakamoto Room',
      description: 'Named after the legendary creator of Bitcoin. A premium meeting room for important discussions.',
      type: SpaceType.MEETING_ROOM,
      capacity: 10,
      amenities: ['TV/Monitor', 'Whiteboard', 'Video Conferencing', 'WiFi'],
    },
    {
      name: '1912 - Ten31 Office',
      description: 'Private office space. Reserved for Ten31 team and sponsored events.',
      type: SpaceType.PRIVATE_OFFICE,
      capacity: 6,
      amenities: ['Dedicated Desks', 'WiFi', 'Private'],
      requiresApproval: true,
    },
    {
      name: '1912 - Podcast Studio',
      description: 'Professional podcast recording studio with acoustic treatment and recording equipment.',
      type: SpaceType.PODCAST_STUDIO,
      capacity: 4,
      amenities: ['Microphones', 'Mixer', 'Acoustic Panels', 'Recording Equipment', 'Webcams'],
      requiresApproval: true,
    },
  ]

  // Nashville 1910 Building Spaces
  const nashville1910Spaces = [
    {
      name: '1910 - Front of House',
      description: 'The main entrance and reception area. Great for small gatherings and informal meetings.',
      type: SpaceType.LOUNGE,
      capacity: 20,
      amenities: ['Seating Area', 'WiFi', 'Coffee'],
    },
    {
      name: '1910 - Member Lounge',
      description: 'Comfortable lounge space for Bitcoin Park members. Relax, network, and collaborate.',
      type: SpaceType.LOUNGE,
      capacity: 15,
      amenities: ['Comfortable Seating', 'WiFi', 'Coffee', 'Snacks'],
    },
    {
      name: '1910 - The Mezz',
      description: 'The mezzanine level event space. Perfect for larger gatherings, presentations, and community events.',
      type: SpaceType.EVENT_HALL,
      capacity: 50,
      amenities: ['Stage', 'Projector', 'Sound System', 'Seating', 'WiFi'],
      requiresApproval: true,
    },
  ]

  // Austin Spaces
  const austinSpaces = [
    {
      name: 'Austin - Crockett',
      description: 'Meeting room named after Davy Crockett. A versatile space for team meetings and workshops.',
      type: SpaceType.MEETING_ROOM,
      capacity: 8,
      amenities: ['TV/Monitor', 'Whiteboard', 'WiFi'],
    },
    {
      name: 'Austin - Jackson',
      description: 'Meeting room for focused discussions and collaborative work.',
      type: SpaceType.MEETING_ROOM,
      capacity: 8,
      amenities: ['TV/Monitor', 'Whiteboard', 'WiFi'],
    },
    {
      name: 'Austin - Houston',
      description: 'Named after Sam Houston. A comfortable meeting space for Bitcoin builders.',
      type: SpaceType.MEETING_ROOM,
      capacity: 10,
      amenities: ['TV/Monitor', 'Whiteboard', 'WiFi', 'Video Conferencing'],
    },
    {
      name: 'Austin - Bowie',
      description: 'Named after Jim Bowie. Ideal for small team standups and quick meetings.',
      type: SpaceType.MEETING_ROOM,
      capacity: 6,
      amenities: ['TV/Monitor', 'Whiteboard', 'WiFi'],
    },
  ]

  // Create all Nashville spaces
  for (const space of [...nashville1912Spaces, ...nashville1910Spaces]) {
    await prisma.space.upsert({
      where: {
        locationId_name: {
          locationId: nashville.id,
          name: space.name,
        },
      },
      update: {},
      create: {
        locationId: nashville.id,
        name: space.name,
        description: space.description,
        type: space.type,
        capacity: space.capacity,
        amenities: space.amenities,
        status: SpaceStatus.ACTIVE,
        requiresApproval: space.requiresApproval || false,
        bufferMinutes: 15,
        bookingRules: {
          minDuration: 30,
          maxDuration: 480,
          maxAdvanceDays: 30,
        },
      },
    })
    console.log('Created space:', space.name)
  }

  // Create all Austin spaces
  for (const space of austinSpaces) {
    await prisma.space.upsert({
      where: {
        locationId_name: {
          locationId: austin.id,
          name: space.name,
        },
      },
      update: {},
      create: {
        locationId: austin.id,
        name: space.name,
        description: space.description,
        type: space.type,
        capacity: space.capacity,
        amenities: space.amenities,
        status: SpaceStatus.ACTIVE,
        requiresApproval: false,
        bufferMinutes: 15,
        bookingRules: {
          minDuration: 30,
          maxDuration: 480,
          maxAdvanceDays: 30,
        },
      },
    })
    console.log('Created space:', space.name)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
