type MessageHandler = (data: Record<string, unknown>) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private handlers: MessageHandler[] = [];
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(url: string) {
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
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error', err);
    };
  }

  send(message: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not open, cannot send', message);
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
