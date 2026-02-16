# ParkBook - Bitcoin Park Space Booking System

A self-hosted space booking system for Bitcoin Park, built with Next.js 14+, Prisma, and PostgreSQL.

## Features

- **User Authentication**: Email/password login with NextAuth.js
- **Role-Based Access**: Super Admin, Location Admin, Booking Admin, Member, Guest
- **Space Management**: Configure rooms with capacity, amenities, and booking rules
- **Booking Engine**: Conflict detection, approval workflows, recurring bookings
- **Calendar Views**: Day/week views with availability overview
- **Email Notifications**: Booking confirmations and cancellation notices
- **Audit Logging**: Track all actions for compliance

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js v5
- **Email**: Resend
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or Docker)
- npm/pnpm/yarn

### 1. Install Dependencies

```bash
cd reservations/parkbook
npm install
```

### 2. Set Up Database

Using Docker:
```bash
docker run --name parkbook-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=parkbook \
  -p 5432:5432 \
  -d postgres:16
```

Or use an existing PostgreSQL installation.

### 3. Configure Environment

Copy the example environment file and update values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Generate with `openssl rand -base64 32` (NextAuth v5 uses AUTH_SECRET, not NEXTAUTH_SECRET)
- `NEXTAUTH_URL` - Your app URL (e.g., `http://localhost:3000`)
- `RESEND_API_KEY` - Your Resend API key for emails

### 4. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed with Bitcoin Park locations and spaces
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Admin Login

After seeding:
- Email: `admin@bitcoinpark.com`
- Password: `BitcoinPark2026!`

**Important**: Change this password immediately after first login!

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, password reset
│   ├── admin/            # Admin dashboard
│   ├── api/              # API routes
│   └── dashboard/        # Member dashboard
├── components/           # React components
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Prisma client
│   ├── email.ts         # Email service
│   └── validations.ts   # Zod schemas
└── types/               # TypeScript types

prisma/
├── schema.prisma        # Database schema
└── seed.ts             # Seed data
```

## Bitcoin Park Spaces

The system is pre-configured with all Bitcoin Park spaces:

**Nashville - 1912 Building:**
- Glass Room (60 capacity)
- Magnolia Room (20 capacity)
- Writing Room (8 capacity)
- Nakamoto Room (12 capacity)
- Ten31 Office (6 capacity)
- Podcast Studio (4 capacity)

**Nashville - 1910 Building:**
- Front of House (100 capacity)
- Member Lounge (30 capacity)
- The Mezz (40 capacity)

**Austin:**
- Crockett (25 capacity)
- Jackson (15 capacity)
- Houston (10 capacity)
- Bowie (8 capacity)

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Users
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `GET /api/users/[id]` - Get user
- `PATCH /api/users/[id]` - Update user

### Locations
- `GET /api/locations` - List locations
- `POST /api/locations` - Create location (admin)
- `GET /api/locations/[id]` - Get location
- `PATCH /api/locations/[id]` - Update location

### Spaces
- `GET /api/spaces` - List spaces
- `POST /api/spaces` - Create space (admin)
- `GET /api/spaces/[id]` - Get space
- `PATCH /api/spaces/[id]` - Update space

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking
- `PATCH /api/bookings/[id]` - Update/cancel booking

## Deployment

### Vercel
```bash
npm run build
vercel deploy
```

### Self-Hosted VPS
1. Set up PostgreSQL
2. Clone repository
3. Configure environment variables
4. Build: `npm run build`
5. Start: `npm start`
6. Configure reverse proxy (nginx/caddy)

## License

Private - Bitcoin Park
