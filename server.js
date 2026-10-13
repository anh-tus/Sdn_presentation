const http = require("node:http");
const path = require("node:path");
const express = require("express");
const { Server } = require("socket.io");

const ROOMS = new Set(["SE", "Other"]);

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function createChatServer() {
  const app = express();
  app.use(express.static(path.join(__dirname, "public")));
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    socket.on("join-room", (data, reply) => {
      const name = clean(data?.name, 24);
      const room = clean(data?.room, 24);
      if (!name || !ROOMS.has(room)) {
        return reply?.({ ok: false, error: "Hãy nhập tên và chọn phòng hợp lệ." });
      }

      if (socket.data.room) socket.leave(socket.data.room);
      socket.data.name = name;
      socket.data.room = room;
      socket.join(room);
      reply?.({ ok: true, room, name });
    });

    socket.on("send-message", (data, reply) => {
      if (!socket.data.room || !socket.data.name) {
        return reply?.({ ok: false, error: "Bạn cần vào phòng trước khi gửi." });
      }
      const text = clean(data?.text, 300);
      if (!text) return reply?.({ ok: false, error: "Tin nhắn không được để trống." });

      io.to(socket.data.room).emit("receive-message", {
        name: socket.data.name,
        text,
        sentAt: new Date().toISOString()
      });
      reply?.({ ok: true });
    });
  });

  return { app, httpServer, io };
}

if (require.main === module) {
  const { httpServer } = createChatServer();
  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, () => {
    console.log(`Demo đang chạy tại http://localhost:${port}`);
  });
}

module.exports = { createChatServer };
