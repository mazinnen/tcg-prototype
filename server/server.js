import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  socket.on("move_card", (data) => {
    socket.broadcast.emit("move_card", data);
  });
});

server.listen(process.env.PORT || 10000);
