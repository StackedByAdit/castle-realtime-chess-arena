type MessageHandler = (data: Record<string, unknown>) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private handlers: MessageHandler[] = [];
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  // Bug #9: Queue messages sent while the socket is reconnecting so they
  // are not silently dropped.
  private pendingMessages: object[] = [];

  connect(url: string) {
    // Bug #9: Guard against creating duplicate connections on hot-reload or
    // accidental double-calls.
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    this.url = url;
    this._connect();
  }

  private _connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        this.handlers.forEach((h) => h(data));
      } catch {
        console.error('Failed to parse message', event.data);
      }
    };

    this.ws.onclose = () => {
      console.warn('WebSocket closed, attempting reconnect...');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this._connect(), 2000 * this.reconnectAttempts);
      }
    };

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      // Flush any messages queued during the disconnected window.
      const pending = this.pendingMessages.splice(0);
      pending.forEach((msg) => this.ws!.send(JSON.stringify(msg)));
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error', err);
    };
  }

  send(message: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Bug #9: Queue instead of silently dropping.
      this.pendingMessages.push(message);
      console.warn('WebSocket not open — message queued', message);
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  disconnect() {
    this.ws?.close();
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const socketService = new SocketService();
