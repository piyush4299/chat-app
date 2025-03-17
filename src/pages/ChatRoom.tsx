import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WebSocketService from "../services/webSocket";
import { SessionChatMessage, SocketMessageTypes } from "teleparty-WebSocket-lib";
import '../App.css';

const ChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<SessionChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [nickname] = useState(localStorage.getItem("nickname") || "User");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState("");
  
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Create a ref for the WebSocketService to prevent recreating it on every render
  const wsServiceRef = useRef<WebSocketService | null>(null);
  
  useEffect(() => {
    const joinRoom = async () => {
      if (!wsServiceRef.current) {
        wsServiceRef.current = new WebSocketService((newMessage) => {
          if (newMessage.type === SocketMessageTypes.SEND_MESSAGE) {
            setMessages(prev => [...prev, newMessage.data]);
          } else if (newMessage.type === SocketMessageTypes.SET_TYPING_PRESENCE) {
            setTypingUsers(newMessage.data.usersTyping || []);
          }
        });
      }
      
      if (roomId) {
        try {
          setIsJoining(true);
          await wsServiceRef.current.joinChatRoom(nickname, roomId);
          setIsJoining(false);
        } catch (err) {
          console.error("Failed to join room:", err);
          setError("Failed to join chat room. Please try again.");
          setIsJoining(false);
        }
      }
    };
    
    joinRoom();
    
    return () => {
      // Clean up typing status when component unmounts
      if (wsServiceRef.current) {
        wsServiceRef.current.updateTypingPresence(false)
          .catch(err => console.error("Error updating typing presence on unmount:", err));
      }
    };
  }, [roomId, nickname]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (message.trim() && wsServiceRef.current) {
      try {
        await wsServiceRef.current.sendMessage(message);
        setMessage("");
        // Reset typing status
        wsServiceRef.current.updateTypingPresence(false)
          .catch(err => console.error("Error updating typing presence after sending:", err));
      } catch (err) {
        console.error("Failed to send message:", err);
      }
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Update typing status
    if (wsServiceRef.current) {
      const isTyping = e.target.value.length > 0;
      wsServiceRef.current.updateTypingPresence(isTyping)
        .catch(err => console.error("Error updating typing presence:", err));
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (error) {
    return (
      <div className="chat-room" style={{ padding: '20px', textAlign: 'center' }}>
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
          Back to Home
        </button>
      </div>
    );
  }

  if (isJoining) {
    return (
      <div className="chat-room" style={{ padding: '20px', textAlign: 'center' }}>
        <div>Joining chat room...</div>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <button className="back-button" onClick={() => navigate('/')}>Back</button>
        <h1>Chat Room: {roomId}</h1>
      </div>
      
      <div className="message-container" ref={messageContainerRef}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.isSystemMessage ? 'system-message' : 
              msg.userNickname === nickname ? 'my-message' : 'other-message'}`}
          >
            {!msg.isSystemMessage && (
              <div className="message-header">
                <span className="user-nickname">{msg.userNickname}</span>
                <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
              </div>
            )}
            <div className="message-body">{msg.body}</div>
          </div>
        ))}
      </div>
      
      {typingUsers.length > 0 && typingUsers.every(user => user !== nickname) && (
        <div className="typing-indicator">
          Someone is typing...
        </div>
      )}
      
      <div className="message-input-container">
        <input
          type="text"
          className="message-input"
          value={message}
          onChange={handleTyping}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;