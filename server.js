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

// Store active connections by email (for admins)
const userConnections = new Map()

// Store active connections by pageName (for public clients)
// Structure: Map<pageName, Map<socketId, ticketNums[]>>
const publicConnections = new Map()

io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`)

  // Handle admin login (by email)
  socket.on('login', (email) => {
    userConnections.set(email, socket.id)
    console.log(`[WebSocket] Admin ${email} logged in`)
  })

  // Handle public client join (by pageName + ticketNums)
  socket.on('joinPage', ({ pageName, ticketNums }) => {
    if (!publicConnections.has(pageName)) {
      publicConnections.set(pageName, new Map())
    }
    publicConnections.get(pageName).set(socket.id, ticketNums || [])
    console.log(`[WebSocket] Public client joined page: ${pageName} with ${ticketNums?.length || 0} tickets`)
  })

  // Handle ticket numbers update for public clients
  socket.on('updateTicketNums', ({ pageName, ticketNums }) => {
    if (publicConnections.has(pageName)) {
      const pageClients = publicConnections.get(pageName)
      if (pageClients.has(socket.id)) {
        pageClients.set(socket.id, ticketNums || [])
        console.log(`[WebSocket] Updated ticket nums for client on page: ${pageName}`)
      }
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove from admin connections
    for (const [email, socketId] of userConnections.entries()) {
      if (socketId === socket.id) {
        userConnections.delete(email)
        console.log(`[WebSocket] Admin ${email} disconnected`)
        return
      }
    }

    // Remove from public connections
    for (const [pageName, clients] of publicConnections.entries()) {
      if (clients.has(socket.id)) {
        clients.delete(socket.id)
        console.log(`[WebSocket] Public client disconnected from page: ${pageName}`)
        // Clean up empty page maps
        if (clients.size === 0) {
          publicConnections.delete(pageName)
        }
        return
      }
    }
  })
})

// Poll database every 2 seconds for changes (much more efficient than client polling every 5s)
let lastTicketStates = new Map()
let lastPublicTicketStates = new Map()

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

    // Group by company email (for admins)
    const ticketsByEmail = new Map()
    // Group by company pageName (for public clients)
    const ticketsByPageName = new Map()

    for (const ticket of pendingTickets) {
      const email = ticket.service.company.email
      const pageName = ticket.service.company.pageName

      // Group by email for admins
      if (!ticketsByEmail.has(email)) {
        ticketsByEmail.set(email, [])
      }
      ticketsByEmail.get(email).push(ticket)

      // Group by pageName for public clients
      if (pageName) {
        if (!ticketsByPageName.has(pageName)) {
          ticketsByPageName.set(pageName, [])
        }
        ticketsByPageName.get(pageName).push(ticket)
      }
    }

    // Send updates to admins (by email) - only if changed
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

    // Send updates to public clients (by pageName) - only if changed
    for (const [pageName, allTickets] of ticketsByPageName) {
      const pageClients = publicConnections.get(pageName)
      if (pageClients && pageClients.size > 0) {
        // For each connected client on this page
        for (const [socketId, ticketNums] of pageClients) {
          // Filter tickets to only those the client owns + all pending tickets for context
          const clientTickets = allTickets.filter(t => ticketNums.includes(t.num) && t.status !== 'FINISHED')
          
          const updateData = {
            clientTickets: clientTickets.map(t => ({
              ...t,
              serviceName: t.service.name,
              avgTime: t.service.avgTime
            })),
            allTickets: allTickets.map(t => ({
              ...t,
              serviceName: t.service.name,
              avgTime: t.service.avgTime
            }))
          }

          const stateKey = `${pageName}:${socketId}`
          const ticketHash = JSON.stringify(updateData)
          const lastHash = lastPublicTicketStates.get(stateKey)

          if (ticketHash !== lastHash) {
            io.to(socketId).emit('publicTicketsUpdated', updateData)
            lastPublicTicketStates.set(stateKey, ticketHash)
          }
        }
      }
    }

    // Clean up old states for disconnected admin users
    for (const email of lastTicketStates.keys()) {
      if (!ticketsByEmail.has(email)) {
        lastTicketStates.delete(email)
      }
    }

    // Clean up old states for disconnected public clients
    for (const stateKey of lastPublicTicketStates.keys()) {
      const [pageName, socketId] = stateKey.split(':')
      const pageClients = publicConnections.get(pageName)
      if (!pageClients || !pageClients.has(socketId)) {
        lastPublicTicketStates.delete(stateKey)
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
