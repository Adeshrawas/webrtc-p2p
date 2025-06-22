import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Home";
import RoomPage from "./pages/Room";
import { SocketProvider } from "./Providers/Socket";
import { PeerProvider } from "./Providers/peer";
import "./App.css";

function App() {
  return (
    <div className="App">
      <SocketProvider>
        <PeerProvider>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="*" element={<h2>404 - Page Not Found</h2>} />
          </Routes>
        </PeerProvider>
      </SocketProvider>
    </div>
  );
}

export default App;
