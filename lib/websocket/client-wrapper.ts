// WebSocket wrapper that gracefully handles when WebSocket is disabled

export class WebSocketWrapper {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true';
  }

  connect(url: string) {
    if (!this.enabled) {
      console.log('WebSocket is disabled');
      return null;
    }
    
    try {
      if (typeof window !== 'undefined' && 'WebSocket' in window) {
        return new WebSocket(url);
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
    
    return null;
  }

  isEnabled() {
    return this.enabled;
  }
}

export const wsClient = new WebSocketWrapper();