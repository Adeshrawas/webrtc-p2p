import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../Providers/Socket";

const Homepage = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleJoinRoom = (e) => {
    if (e) e.preventDefault();
    if (!email || !roomId) return;
    socket.emit("join-room", { emailId: email, roomId });
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="homepage-container">
      <form onSubmit={handleJoinRoom} className="input-container glass-card">
        {/* Brand icon */}
        <div className="home-logo">📹</div>

        <h1 className="home-title">WebRTC Video Call</h1>
        <p className="home-subtitle">Connect instantly — no downloads, no sign-ups.</p>

        {/* Email field */}
        <div className="input-group">
          <label htmlFor="email-input">Your Email</label>
          <span className="input-icon">✉️</span>
          <input
            id="email-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {/* Room code field */}
        <div className="input-group">
          <label htmlFor="room-input">Room Code</label>
          <span className="input-icon">🔑</span>
          <input
            id="room-input"
            type="text"
            placeholder="Enter room code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn-join"
          disabled={!email || !roomId}
        >
          Join Room →
        </button>

        <div className="home-divider">end-to-end encrypted</div>
      </form>
    </div>
  );
};

export default Homepage;
