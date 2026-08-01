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
    if (!email || !roomId) {
      alert("Please fill in both email and room code.");
      return;
    }

    socket.emit("join-room", { emailId: email, roomId });

    // ✅ Navigate directly to room
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="homepage-container">
      <form onSubmit={handleJoinRoom} className="input-container">
        <h1 style={{ color: "#fff", marginBottom: "20px" }}>WebRTC Video Call</h1>
        <input
          type="email"
          placeholder="Enter your email here"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Room Code"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button
          type="submit"
          disabled={!email || !roomId}
        >
          Enter Room
        </button>
      </form>
    </div>
  );
};

export default Homepage;
