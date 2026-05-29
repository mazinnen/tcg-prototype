import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());

// ★★★ ここが重要：docs/ を静的配信する ★★★
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ../docs を静的ファイルとして配信
app.use(express.static(path.join(__dirname, "../docs")));

const server = createServer(app);

// Socket.io（Render でもローカルでも動く）
const io = new Server(server, {
  cors: {
    origin: [
      "https://mazinnen.github.io", // GitHub Pages
      "*"                           // ローカル開発用
    ]
  }
});

// Socket.io イベント
io.on("connection", (socket) => {
  console.log("client connected");

  socket.on("move_card", (data) => {
    socket.broadcast.emit("move_card", data);
  });

  socket.on("shuffle_deck", (data) => {
    socket.broadcast.emit("shuffle_deck", data);
  });
});

// ポート設定（Render もローカルも対応）
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
