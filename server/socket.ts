import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { storage } from './storage';
import { verifyAccessToken } from './auth';

export function setupSocketIO(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const user = verifyAccessToken(token);
    if (!user) {
      return next(new Error('Invalid token'));
    }

    (socket as any).user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.email} (${user.role})`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email}`);
    });

    socket.on('request-metrics', async () => {
      try {
        const metrics = await storage.getDashboardMetrics();
        socket.emit('metrics-update', metrics);
      } catch (error) {
        socket.emit('error', { message: 'Failed to fetch metrics' });
      }
    });

    socket.on('request-activity', async () => {
      try {
        const activity = await storage.getRecentActivity();
        socket.emit('activity-update', activity);
      } catch (error) {
        socket.emit('error', { message: 'Failed to fetch activity' });
      }
    });

    if (user.role === 'admin' || user.role === 'superadmin') {
      socket.join('admin');
    }
  });

  setInterval(async () => {
    try {
      const metrics = await storage.getDashboardMetrics();
      io.to('admin').emit('metrics-update', metrics);
    } catch (error) {
      console.error('Failed to broadcast metrics:', error);
    }
  }, 30000);

  return io;
}

export async function broadcastNotification(io: SocketServer, notification: any) {
  io.emit('notification', notification);
}

export async function broadcastMetricsUpdate(io: SocketServer) {
  try {
    const metrics = await storage.getDashboardMetrics();
    io.to('admin').emit('metrics-update', metrics);
  } catch (error) {
    console.error('Failed to broadcast metrics update:', error);
  }
}
