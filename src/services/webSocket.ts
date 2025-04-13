import { TelepartyClient, SocketEventHandler, SocketMessageTypes, SessionChatMessage, MessageList } from "teleparty-WebSocket-lib";

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

    this.client = new TelepartyClient(this.getEventHandler(onMessageReceived));
  }

  private getEventHandler(onMessageReceived: (message: SessionChatMessage | any) => void): SocketEventHandler {
    return {
      onConnectionReady: () => {
        console.log("✅ Connection Established");
        this.isConnected = true;
        if (this.connectionReadyResolver) {
          this.connectionReadyResolver();
        }
      },
      onClose: () => {
        console.warn("⚠️ WebSocket Disconnected");
        this.isConnected = false;
  
        setTimeout(() => {
          console.log("🔁 Attempting to reconnect...");
          this.client = new TelepartyClient(this.getEventHandler(onMessageReceived));
        }, 3000);
      },
      onMessage: (message) => {
        console.log("📩 Received message:", message);
        onMessageReceived(message);
      }
    };
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

  async joinChatRoom(nickname: string, roomId: string, userIcon?: string): Promise<MessageList[]> {
    // Wait for the connection to be ready
    await this.waitForConnection();

    this.roomId = roomId;

    try {
      const messageList: any = await this.client.joinChatRoom(nickname, roomId, userIcon);
      console.log(`🚀 Joined chat room: ${roomId}`);
      return messageList;
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