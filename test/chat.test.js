const { test } = require("node:test");
const assert = require("node:assert/strict");
const { io: createClient } = require("socket.io-client");
const { createChatServer } = require("../server");

function waitForEvent(socket, event, timeout = 1500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${event}`)), timeout);
    socket.once(event, (value) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
}

function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(1500).emit(event, payload, (error, result) =>
      error ? reject(error) : resolve(result)
    );
  });
}

test("tin nhắn chỉ đến những người trong đúng phòng và lấy tên từ server", async () => {
  const { httpServer, io } = createChatServer();
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${httpServer.address().port}`;
  const clients = [0, 1, 2].map(() => createClient(url, { forceNew: true }));

  try {
    await Promise.all(clients.map((client) => waitForEvent(client, "connect")));
    assert.equal((await emitAck(clients[0], "join-room", { name: "Tú", room: "SE" })).ok, true);
    assert.equal((await emitAck(clients[1], "join-room", { name: "Lộc", room: "SE" })).ok, true);
    assert.equal((await emitAck(clients[2], "join-room", { name: "Tuấn", room: "Other" })).ok, true);

    const receivedA = waitForEvent(clients[0], "receive-message");
    const receivedB = waitForEvent(clients[1], "receive-message");
    let leaked = false;
    clients[2].on("receive-message", () => { leaked = true; });
    assert.equal((await emitAck(clients[0], "send-message", { text: "Xin chào", room: "Other", name: "Giả mạo" })).ok, true);
    const [a, b] = await Promise.all([receivedA, receivedB]);
    assert.equal(a.name, "Tú");
    assert.equal(b.text, "Xin chào");
    assert.equal(a.room, undefined);
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(leaked, false);
  } finally {
    clients.forEach((client) => client.disconnect());
    await new Promise((resolve) => io.close(resolve));
    await new Promise((resolve) => httpServer.close(resolve));
  }
});

test("từ chối dữ liệu không hợp lệ và gửi tin khi chưa vào phòng", async () => {
  const { httpServer, io } = createChatServer();
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const client = createClient(`http://127.0.0.1:${httpServer.address().port}`);
  try {
    await waitForEvent(client, "connect");
    assert.equal((await emitAck(client, "send-message", { text: "Chưa vào" })).ok, false);
    assert.equal((await emitAck(client, "join-room", { name: " ", room: "SE" })).ok, false);
    assert.equal((await emitAck(client, "join-room", { name: "Tú", room: "SE" })).ok, true);
    assert.equal((await emitAck(client, "send-message", { text: "   " })).ok, false);
  } finally {
    client.disconnect();
    await new Promise((resolve) => io.close(resolve));
    await new Promise((resolve) => httpServer.close(resolve));
  }
});
