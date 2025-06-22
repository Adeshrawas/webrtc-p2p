const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const emailToSocketMap = new Map();
const socketToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log("🔌 New socket connected:", socket.id);

  socket.on("join-room", ({ roomId, emailId }) => {
    emailToSocketMap.set(emailId, socket.id);
    socketToEmailMap.set(socket.id, emailId);

    socket.join(roomId);
    socket.emit("joined-room", { roomId });

    socket.broadcast.to(roomId).emit("user-joined", {
      emailId,
      socketId: socket.id,
    });

    console.log(`✅ ${emailId} joined room ${roomId}`);
  });

  socket.on("call-user", ({ emailId, offer }) => {
    const fromEmail = socketToEmailMap.get(socket.id);
    const targetSocketId = emailToSocketMap.get(emailId);

    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", {
        from: fromEmail,
        offer,
        socketId: socket.id,
      });
      console.log(`📞 ${fromEmail} is calling ${emailId}`);
    } else {
      console.warn(`⚠️ No target found for ${emailId}`);
    }
  });

  socket.on("call-accepted", ({ emailId, ans }) => {
    const targetSocketId = emailToSocketMap.get(emailId);
    const fromEmail = socketToEmailMap.get(socket.id);

    if (targetSocketId) {
      io.to(targetSocketId).emit("call-accepted", {
        from: fromEmail,
        ans,
        socketId: socket.id,
      });
      console.log(`✅ Call accepted by ${fromEmail}`);
    }
  });

  socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
    if (targetSocketId && candidate) {
      io.to(targetSocketId).emit("ice-candidate", {
        from: socket.id,
        candidate,
      });
      console.log("📡 ICE candidate sent to:", targetSocketId);
    }
  });

  socket.on("disconnect", () => {
    const email = socketToEmailMap.get(socket.id);
    console.log(`❌ Disconnected: ${email || socket.id}`);

    if (email) emailToSocketMap.delete(email);
    socketToEmailMap.delete(socket.id);
  });
});

httpServer.listen(8000, () => {
  console.log("🚀 Signaling server running on http://localhost:8000");
});
