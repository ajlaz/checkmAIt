const ENGINE_HOST = import.meta.env.VITE_ENGINE_HOST || 'localhost';

class GameSocket {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.messageHandlers = {
      connection: null,
      move: null,
      board_state: null,
      game_over: null,
      error: null,
    };
    this.onDisconnect = null;
  }

  connect(wsPort, gameId, playerId, color) {
    return new Promise((resolve, reject) => {
      const url = `ws://${ENGINE_HOST}:${wsPort}?gameId=${gameId}&playerId=${playerId}&color=${color}`;

      console.log('Connecting to game WebSocket:', url);
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          const handler = this.messageHandlers[message.type];
          if (handler) {
            handler(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.handleDisconnect(wsPort, gameId, playerId, color);
      };
    });
  }

  handleDisconnect(wsPort, gameId, playerId, color) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

      setTimeout(() => {
        this.connect(wsPort, gameId, playerId, color)
          .catch((error) => {
            console.error('Reconnection failed:', error);
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
              if (this.onDisconnect) {
                this.onDisconnect('Connection lost. Unable to reconnect.');
              }
            }
          });
      }, this.reconnectDelay);
    } else {
      if (this.onDisconnect) {
        this.onDisconnect('Connection lost. Maximum reconnection attempts reached.');
      }
    }
  }

  on(event, handler) {
    if (this.messageHandlers.hasOwnProperty(event)) {
      this.messageHandlers[event] = handler;
    }
  }

  setDisconnectHandler(handler) {
    this.onDisconnect = handler;
  }

  sendMove(from, to, promotion) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'move',
        data: {
          from,
          to,
          promotion: promotion || 'q',
        },
      };
      console.log('Sending move:', message);
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export default new GameSocket();
