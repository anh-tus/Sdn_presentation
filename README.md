# Demo chat theo phòng cho bài Real-time Communication

Bản demo dùng **Node.js + Express + Socket.IO** và HTML/CSS/JavaScript. Một laptop chạy server trên `localhost`; ba cửa sổ trình duyệt đóng vai ba người dùng. Không cần tài khoản, database hay Internet sau khi cài gói.

## Chạy trước buổi thuyết trình

1. Cài Node.js (khuyến nghị bản LTS). Trong thư mục này, chạy `npm install` một lần khi có Internet.
2. Chạy `npm start` và giữ cửa sổ terminal mở.
3. Mở ba cửa sổ trình duyệt:
   - [Tú ở SE](http://localhost:3000/?name=T%C3%BA&room=SE)
   - [Lộc ở SE](http://localhost:3000/?name=L%E1%BB%99c&room=SE)
   - [Tuấn ở Other](http://localhost:3000/?name=Tu%E1%BA%A5n&room=Other)
4. Ở **mỗi cửa sổ**, bấm **Vào phòng**. Sau đó mới gửi tin.

Nếu cổng 3000 đang được dùng, trong PowerShell chạy `$env:PORT=3001; npm start`, rồi đổi `3000` thành `3001` trong các URL.

## Kịch bản nói và thao tác trong 5 phút

| Thời gian | Thao tác | Câu giải thích ngắn |
| --- | --- | --- |
| 0:00–0:40 | Đặt ba cửa sổ cạnh nhau. Chỉ tên, phòng và trạng thái **Đã kết nối**. | “Tú và Lộc cùng phòng SE, Tuấn ở phòng Other.” |
| 0:40–1:20 | Tú gửi “Chào mọi người”. | “Tin xuất hiện ở Tú và Lộc mà không tải lại trang. Đây là cập nhật gần thời gian thực.” |
| 1:20–2:00 | Lộc trả lời “Mình đã nhận”. Chỉ ra Tuấn không nhận cả hai tin. | “Hai chiều đều gửi được; server chỉ phát đến đúng room.” |
| 2:00–3:00 | Mở `server.js`, chỉ hai dòng `socket.on("send-message", ...)` và `io.to(socket.data.room).emit("receive-message", ...)`. | “Client gửi sự kiện, server kiểm tra rồi phát cho thành viên phòng. Tên và phòng lấy từ dữ liệu server đã lưu khi join.” |
| 3:00–4:00 | Trong DevTools của một cửa sổ: **Network → WS**, chọn kết nối `socket.io`, mở **Messages/Frames**, rồi gửi một tin mới. | “Socket.IO có thể bắt đầu bằng polling rồi nâng cấp lên WebSocket; ở đây tab WS cho thấy kết nối và frame thực tế.” |
| 4:00–5:00 | Dừng server bằng `Ctrl+C`, quan sát trạng thái mất kết nối. Chạy lại `npm start`, chờ **Đã kết nối**, gửi **một tin mới**. | “Client tự kết nối lại và tự vào phòng. Tin nhắn trong thời gian server tắt không được khôi phục ở bản này.” |

Nếu tab **WS** không có kết nối, đừng khẳng định lần chạy đó đang dùng WebSocket: hãy xem dòng **Transport** trên giao diện. Việc nâng cấp có thể bị chặn ở một số môi trường. Trong DevTools, nội dung frame của Socket.IO có thêm ký hiệu giao thức, không phải text thuần của WebSocket.

## Đường đi của tin nhắn

```text
Tú (phòng SE) ── send-message ──> server
                                   │ kiểm tra text, lấy tên và phòng từ socket.data
                                   └── io.to("SE").emit("receive-message")
                                            ├── Tú nhận
                                            └── Lộc nhận
Tuấn (phòng Other) không nhận sự kiện của SE.
```

Sự kiện dùng trong code: `join-room` gửi `{ name, room }`; `send-message` gửi `{ text }`; `receive-message` trả `{ name, text, sentAt }`. Server kiểm tra tên, phòng và nội dung. Nút gửi chỉ bật sau khi `join-room` được xác nhận. Sau reconnect, client gửi lại `join-room`.

## Giới hạn cần nói rõ khi hỏi đáp

- Chưa có đăng nhập hoặc kiểm tra quyền vào phòng; tên hiển thị chỉ là tên do người dùng nhập.
- Chưa lưu lịch sử. Tải lại trang hoặc bỏ lỡ tin khi mất kết nối sẽ không được đồng bộ lại.
- Bản demo chạy một server và chỉ dùng hai phòng định sẵn: `SE`, `Other`.
- Socket.IO là thư viện giao tiếp sự kiện với giao thức riêng; nó có thể dùng WebSocket làm transport, không tương đương WebSocket thuần.

Để kiểm tra logic server trước khi lên lớp: `npm test`.

Tài liệu: [Socket.IO Introduction](https://socket.io/docs/v4/), [Rooms](https://socket.io/docs/v4/rooms/), [How it works](https://socket.io/docs/v4/how-it-works/), [Delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/).
