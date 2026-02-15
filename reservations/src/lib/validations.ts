import { z } from 'zod'

// User validations
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'LOCATION_ADMIN', 'BOOKING_ADMIN', 'MEMBER', 'GUEST']).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
})

// Location validations
export const createLocationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  timezone: z.string().default('America/Chicago'),
  hoursOfOperation: z.record(
    z.string(),
    z.object({
      open: z.string().nullable(),
      close: z.string().nullable(),
    })
  ),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
})

export const updateLocationSchema = createLocationSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// Space validations
export const createSpaceSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum([
    'MEETING_ROOM',
    'EVENT_HALL',
    'PODCAST_STUDIO',
    'COWORKING_DESK',
    'HOT_DESK',
    'PRIVATE_OFFICE',
    'OUTDOOR_AREA',
    'LOUNGE',
  ]),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  minCapacity: z.number().int().positive().default(1),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).default([]),
  bookableHours: z
    .record(
      z.object({
        open: z.string().nullable(),
        close: z.string().nullable(),
      })
    )
    .optional(),
  bufferMinutes: z.number().int().min(0).default(15),
  requiresApproval: z.boolean().default(false),
  bookingRules: z
    .object({
      minDuration: z.number().int().positive().optional(),
      maxDuration: z.number().int().positive().optional(),
      maxAdvanceDays: z.number().int().positive().optional(),
      maxBookingsPerWeek: z.number().int().positive().optional(),
    })
    .optional(),
})

export const updateSpaceSchema = createSpaceSchema.partial().omit({ locationId: true })

// Booking validations
export const createBookingSchema = z.object({
  spaceId: z.string().min(1, 'Space is required'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  attendeeCount: z.number().int().positive().default(1),
  recurrenceRule: z.string().optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
)

export const updateBookingSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  attendeeCount: z.number().int().positive().optional(),
  status: z.enum(['CONFIRMED', 'PENDING_APPROVAL', 'CANCELLED', 'DECLINED', 'NO_SHOW']).optional(),
  cancellationReason: z.string().optional(),
})

export const bookingQuerySchema = z.object({
  spaceId: z.string().optional(),
  locationId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['CONFIRMED', 'PENDING_APPROVAL', 'CANCELLED', 'DECLINED', 'NO_SHOW']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateLocationInput = z.infer<typeof createLocationSchema>
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>
