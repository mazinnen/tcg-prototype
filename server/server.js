import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = createServer(app);

// ===============================
// io はここで 1 回だけ宣言する
// ===============================
const io = new Server(server, {
  cors: {
    origin: [
      "https://mazinnen.github.io"
    ]
  }
});

// ===============================
// Socket.io イベント
// ===============================
io.on("connection", (socket) => {
  console.log("client connected");

  socket.on("move_card", (data) => {
    socket.broadcast.emit("move_card", data);
  });

  socket.on("shuffle_deck", (data) => {
    socket.broadcast.emit("shuffle_deck", data);
  });
});

// ===============================
// Render のポートで起動
// ===============================
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
