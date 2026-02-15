const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@bitcoinpark.com' }
    })
    
    if (!user) {
      console.log('❌ User not found!')
      return
    }
    
    console.log('✅ User found:')
    console.log('  Email:', user.email)
    console.log('  Name:', user.name)
    console.log('  Role:', user.role)
    console.log('  Active:', user.isActive)
    console.log('  Password hash:', user.passwordHash.substring(0, 20) + '...')
    
    // Test password
    const passwordMatch = await bcrypt.compare('admin123', user.passwordHash)
    console.log('  Password "admin123" matches:', passwordMatch)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
