import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../app/generated/prisma/client'

const prismaClientSingleton = () => {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./dev.db',
  })

  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
}

const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaGlobal = prisma
}

export default prisma