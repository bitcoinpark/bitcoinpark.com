const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_WRyGBZp78Sju@ep-shiny-tooth-aiz634u7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function verifyLogin() {
  try {
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@bitcoinpark.com' }
    })
    
    if (!user) {
      console.log('❌ ERROR: User not found in database!')
      return
    }
    
    console.log('✅ User exists in database:')
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Role:', user.role)
    console.log('   Active:', user.isActive)
    console.log('   Password hash starts with:', user.passwordHash.substring(0, 30) + '...')
    
    // Test the password (from seed.ts line 20)
    const match = await bcrypt.compare('BitcoinPark2026!', user.passwordHash)
    console.log('\n   Testing password "BitcoinPark2026!":', match ? '✅ MATCHES' : '❌ DOES NOT MATCH')
    
    if (!match) {
      console.log('\n⚠️  PASSWORD MISMATCH - This is the problem!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
    pool.end()
  }
}

verifyLogin()
