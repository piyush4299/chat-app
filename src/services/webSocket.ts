import { TelepartyClient, SocketEventHandler, SocketMessageTypes, SessionChatMessage } from "teleparty-WebSocket-lib";

class WebSocketService {
  private client: TelepartyClient;
  private roomId: string | null = null;
  private isConnected: boolean = false;
  private connectionReadyPromise: Promise<void>;
  private connectionReadyResolver: (() => void) | null = null;

  constructor(onMessageReceived: (message: SessionChatMessage | any) => void) {
    // Create a promise that resolves when the connection is ready
    this.connectionReadyPromise = new Promise<void>((resolve) => {
      this.connectionReadyResolver = resolve;
    });

    const eventHandler: SocketEventHandler = {
      onConnectionReady: () => {
        console.log("✅ Connection Established");
        this.isConnected = true;
        // Resolve the connection ready promise
        if (this.connectionReadyResolver) {
          this.connectionReadyResolver();
        }
      },
      onClose: () => {
        console.warn("⚠️ WebSocket Disconnected");
        this.isConnected = false;
      },
      onMessage: (message) => {
        console.log("📩 Received message:", message);
        onMessageReceived(message);
      },
    };

    this.client = new TelepartyClient(eventHandler);
  }

  // Check if the connection is ready
  isConnectionReady(): boolean {
    return this.isConnected;
  }

  // Wait for the connection to be ready
  async waitForConnection(): Promise<void> {
    if (this.isConnected) {
      return;
    }
    return this.connectionReadyPromise;
  }

  async createChatRoom(nickname: string, userIcon?: string): Promise<string> {
    // Wait for the connection to be ready
    await this.waitForConnection();

    try {
      this.roomId = await this.client.createChatRoom(nickname, userIcon);
      console.log(`🎉 Chat room created with ID: ${this.roomId}`);
      return this.roomId;
    } catch (error) {
      console.error("Failed to create chat room:", error);
      throw error;
    }
  }

  async joinChatRoom(nickname: string, roomId: string, userIcon?: string): Promise<void> {
    // Wait for the connection to be ready
    await this.waitForConnection();

    try {
      this.roomId = roomId;
      this.client.joinChatRoom(nickname, roomId, userIcon);
      console.log(`🚀 Joined chat room: ${roomId}`);
    } catch (error) {
      console.error("Failed to join chat room:", error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<void> {
    // Wait for the connection to be ready
    await this.waitForConnection();

    if (!this.roomId) {
      console.error("⚠️ Cannot send message. No room joined!");
      return;
    }

    try {
      this.client.sendMessage(SocketMessageTypes.SEND_MESSAGE, { body: message });
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  async updateTypingPresence(isTyping: boolean): Promise<void> {
    // Wait for the connection to be ready
    await this.waitForConnection();
    
    if (!this.roomId) {
      return;
    }

    try {
      this.client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, { typing: isTyping });
    } catch (error) {
      console.error("Failed to update typing presence:", error);
      // Don't throw for typing presence updates
    }
  }
}

export default WebSocketService;