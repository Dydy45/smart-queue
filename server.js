const http = require('http')
const { Server } = require('socket.io')
const { PrismaClient } = require('./app/generated/prisma/client.js')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')

// Initialize Prisma Client with BetterSqlite3 adapter
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})
const prismaClient = new PrismaClient({ adapter })

const server = http.createServer()
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Store active connections by email
const userConnections = new Map()

io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`)

  // Handle user login
  socket.on('login', (email) => {
    userConnections.set(email, socket.id)
    console.log(`[WebSocket] User ${email} logged in`)
  })

  // Handle logout
  socket.on('disconnect', () => {
    // Remove user from connections
    for (const [email, socketId] of userConnections.entries()) {
      if (socketId === socket.id) {
        userConnections.delete(email)
        console.log(`[WebSocket] User ${email} disconnected`)
        break
      }
    }
  })
})

// Poll database every 2 seconds for changes (much more efficient than client polling every 5s)
let lastTicketStates = new Map()

setInterval(async () => {
  try {
    // Fetch all pending tickets grouped by company email
    const pendingTickets = await prismaClient.ticket.findMany({
      where: {
        status: { in: ['PENDING', 'CALL', 'IN_PROGRESS'] },
      },
      include: {
        service: {
          include: {
            company: true,
          },
        },
        post: true,
      },
    })

    // Group by company email
    const ticketsByEmail = new Map()
    for (const ticket of pendingTickets) {
      const email = ticket.service.company.email
      if (!ticketsByEmail.has(email)) {
        ticketsByEmail.set(email, [])
      }
      ticketsByEmail.get(email).push(ticket)
    }

    // Send updates only if changed
    for (const [email, tickets] of ticketsByEmail) {
      const socketId = userConnections.get(email)
      if (socketId) {
        const ticketHash = JSON.stringify(tickets)
        const lastHash = lastTicketStates.get(email)

        if (ticketHash !== lastHash) {
          io.to(socketId).emit('ticketsUpdated', tickets)
          lastTicketStates.set(email, ticketHash)
        }
      }
    }

    // Clean up old states for disconnected users
    for (const email of lastTicketStates.keys()) {
      if (!ticketsByEmail.has(email)) {
        lastTicketStates.delete(email)
      }
    }
  } catch (error) {
    console.error('[WebSocket] Error polling tickets:', error)
  }
}, 2000) // Poll every 2 seconds server-side (much more efficient)

const PORT = process.env.SOCKET_PORT || 3001
server.listen(PORT, () => {
  console.log(`[WebSocket] Server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[WebSocket] Shutting down...')
  await prismaClient.$disconnect()
  process.exit(0)
})
