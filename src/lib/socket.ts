import { Server as HttpServer } from 'http'
import type { Server as NetServer } from 'net'
import type { NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import { nextAuthOptions } from './auth'

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: NextApiResponse['socket'] & {
    server: NetServer & { io?: SocketIOServer }
  }
}

export const getOrCreateSocketServer = async (
  res: NextApiResponseWithSocket,
) => {
  if (!res.socket.server.io) {
    const httpServer: HttpServer = res.socket.server as any
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket/io',
      cors: { origin: process.env.NEXT_PUBLIC_APP_URL ?? '*', credentials: true },
    })

    io.use(async (socket, next) => {
      const req = socket.request as any
      const res = { getHeader() {}, setHeader() {}, end() {} } as any
      const session: Session | null = await getServerSession(req, res, nextAuthOptions)
      if (!session) {
        return next(new Error('Unauthorized'))
      }
      socket.data.user = session.user
      next()
    })

    res.socket.server.io = io
  }

  return res.socket.server.io
}
