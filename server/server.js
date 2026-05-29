import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      // あなたの GitHub Pages の URL に変える
      "https://mazinnen.github.io"
    ]
  }
});

io.on("connection", (socket) => {
  console.log("client connected");

  socket.on("move_card", (data) => {
    socket.broadcast.emit("move_card", data);
  });

  socket.on("shuffle_deck", (data) => {
    socket.broadcast.emit("shuffle_deck", data);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
