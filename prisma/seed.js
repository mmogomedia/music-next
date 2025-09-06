/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminName = 'admin'
  const adminPassword = 'admin'
  const adminEmail = 'admin@example.com'

  const existing = await prisma.user.findFirst({
    where: { OR: [{ name: adminName }, { email: adminEmail }] },
  })

  if (existing) {
    console.log('Admin user already exists:', existing.email)
    return
  }

  const hash = await bcrypt.hash(adminPassword, 10)
  const user = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hash,
      role: 'ADMIN',
      isPremium: true,
    },
  })

  console.log('Seeded admin user:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

