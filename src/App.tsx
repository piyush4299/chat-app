import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import ChatRoom from "./pages/ChatRoom";

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/chat-app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
