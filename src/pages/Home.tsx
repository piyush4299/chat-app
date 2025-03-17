import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import WebSocketService from "../services/webSocket";
import '../App.css';

const Home: React.FC = () => {
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "");
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  const navigate = useNavigate();
  const wsServiceRef = useRef<WebSocketService | null>(null);
  
  useEffect(() => {
    // Initialize WebSocketService only once
    if (!wsServiceRef.current) {
      wsServiceRef.current = new WebSocketService(() => {});
      
      // Check connection status periodically
      const checkConnection = setInterval(() => {
        if (wsServiceRef.current && wsServiceRef.current.isConnectionReady()) {
          setIsConnected(true);
          clearInterval(checkConnection);
        }
      }, 500);
      
      // Clean up interval
      return () => clearInterval(checkConnection);
    }
  }, []);

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      localStorage.setItem("nickname", nickname);
      
      if (wsServiceRef.current) {
        const newRoomId = await wsServiceRef.current.createChatRoom(nickname);
        navigate(`/chat/${newRoomId}`);
      }
    } catch (err) {
      console.error("Error creating room:", err);
      setError("Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }

    if (!roomId.trim()) {
      setError("Please enter a room ID");
      return;
    }

    try {
      setIsJoining(true);
      setError("");
      localStorage.setItem("nickname", nickname);
      
      if (wsServiceRef.current) {
        await wsServiceRef.current.joinChatRoom(nickname, roomId);
        navigate(`/chat/${roomId}`);
      }
    } catch (err) {
      console.error("Error joining room:", err);
      setError("Failed to join room. Please check the room ID and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="home-container">
      <h1>Teleparty Chat</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div>
        <label htmlFor="nickname">Nickname:</label>
        <input
          id="nickname"
          type="text"
          placeholder="Enter your nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>
      
      <button 
        onClick={handleCreateRoom} 
        disabled={isCreating}
      >
        {isCreating ? 'Creating...' : 'Create Chat Room'}
      </button>
      
      <div style={{ margin: '20px 0', textAlign: 'center' }}>OR</div>
      
      <div>
        <label htmlFor="roomId">Room ID:</label>
        <input
          id="roomId"
          type="text"
          placeholder="Enter Room ID to join"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
      </div>
      
      <button 
        onClick={handleJoinRoom} 
        disabled={isJoining}
      >
        {isJoining ? 'Joining...' : 'Join Room'}
      </button>
      
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        Please refresh the page if you are not able to create chat room after entering username
      </div>
    </div>
  );
};

export default Home;