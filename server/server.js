import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("move_card", (data) => {
    socket.broadcast.emit("move_card", data);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("server running on " + PORT));
