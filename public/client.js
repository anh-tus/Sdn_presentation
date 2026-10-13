const socket = io();
const joinForm = document.querySelector("#join-form");
const messageForm = document.querySelector("#message-form");
const nameInput = document.querySelector("#name");
const roomInput = document.querySelector("#room");
const messageInput = document.querySelector("#message");
const sendButton = document.querySelector("#send");
const messages = document.querySelector("#messages");
const status = document.querySelector("#status");
const transport = document.querySelector("#transport");
const notice = document.querySelector("#notice");
const roomTitle = document.querySelector("#room-title");

let selected = null;
let joined = false;

const params = new URLSearchParams(location.search);
if (params.has("name")) nameInput.value = params.get("name").slice(0, 24);
if (["SE", "Other"].includes(params.get("room"))) roomInput.value = params.get("room");

function setStatus(label, connected) {
  status.textContent = label;
  status.className = `status ${connected ? "connected" : "disconnected"}`;
}

function setReady(value) {
  joined = value;
  messageInput.disabled = !value;
  sendButton.disabled = !value;
}

function updateTransport() {
  transport.textContent = `Transport: ${socket.io.engine?.transport?.name || "—"}`;
}

function joinSelected() {
  if (!selected || !socket.connected) return;
  setReady(false);
  socket.timeout(3000).emit("join-room", selected, (error, result) => {
    if (error || !result?.ok) {
      notice.textContent = result?.error || "Không thể vào phòng. Hãy thử lại.";
      return;
    }
    setReady(true);
    roomTitle.textContent = `Phòng ${result.room}`;
    notice.textContent = `${result.name} đã vào phòng ${result.room}.`;
    messageInput.focus();
  });
}

socket.on("connect", () => {
  setStatus("Đã kết nối", true);
  updateTransport();
  socket.io.engine.on("upgrade", updateTransport);
  joinSelected();
});

socket.on("disconnect", () => {
  setStatus("Mất kết nối · đang thử lại", false);
  transport.textContent = "Transport: —";
  setReady(false);
  notice.textContent = "Đang chờ server. Khi kết nối lại, ứng dụng sẽ tự vào phòng.";
});

socket.on("connect_error", () => {
  setStatus("Chưa kết nối · đang thử lại", false);
  setReady(false);
});

socket.on("receive-message", ({ name, text, sentAt }) => {
  const item = document.createElement("li");
  const meta = document.createElement("div");
  const body = document.createElement("p");
  meta.className = "message-meta";
  meta.textContent = `${name} · ${new Date(sentAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  body.textContent = text;
  item.append(meta, body);
  messages.append(item);
  messages.scrollTop = messages.scrollHeight;
});

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  selected = { name: nameInput.value.trim(), room: roomInput.value };
  messages.replaceChildren();
  setReady(false);
  if (!socket.connected) {
    notice.textContent = "Đang chờ kết nối tới server...";
    return;
  }
  joinSelected();
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!joined) return;
  const text = messageInput.value.trim();
  if (!text) return;
  socket.timeout(3000).emit("send-message", { text }, (error, result) => {
    if (error || !result?.ok) {
      notice.textContent = result?.error || "Gửi thất bại. Hãy thử lại.";
      return;
    }
    messageInput.value = "";
    messageInput.focus();
  });
});
