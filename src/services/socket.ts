import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  public connect(token?: string) {
    if (this.socket && this.socket.connected) return;

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to Eventler Realtime Engine:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection warning:', err.message);
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public joinProgramRoom(programId: string) {
    if (this.socket) {
      this.socket.emit('join:program', programId);
      console.log(`[Socket] Joined program channel: program:${programId}`);
    }
  }

  public leaveProgramRoom(programId: string) {
    if (this.socket) {
      this.socket.emit('leave:program', programId);
    }
  }

  public onTimelineUpdated(callback: (payload: any) => void) {
    if (this.socket) {
      this.socket.on('TIMELINE_UPDATED', callback);
    }
  }

  public offTimelineUpdated(callback: (payload: any) => void) {
    if (this.socket) {
      this.socket.off('TIMELINE_UPDATED', callback);
    }
  }
}

export const socketService = new SocketService();
