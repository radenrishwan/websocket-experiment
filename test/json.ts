import ws from "k6/ws";
import http from "k6/http";
import { check, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  stages: [
    { duration: "30s", target: 100 }, // Ramp up to 100 users
    { duration: "1m", target: 300 }, // Ramp up to 300 users
    { duration: "1m", target: 500 }, // Ramp up to 500 users
    { duration: "1m", target: 750 }, // Ramp up to 750 users
    { duration: "1m", target: 1000 }, // Ramp up to 1000 users
    { duration: "2m", target: 1000 }, // Stay at 1000 users
    { duration: "1m", target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    ws_session_duration: ["p(95)<3000"], // 95% of WebSocket sessions should be below 3s
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
  },
};

export default function () {
  // Test HTTP endpoints
  const clientsResponse = http.get("http://localhost:8083/api/clients");
  check(clientsResponse, {
    "clients status is 200": (r) => r.status === 200,
    "clients response is json": (r) =>
      r.headers["Content-Type"].includes("application/json"),
  });

  const roomsResponse = http.get("http://localhost:8083/api/rooms");
  check(roomsResponse, {
    "rooms status is 200": (r) => r.status === 200,
    "rooms response is json": (r) =>
      r.headers["Content-Type"].includes("application/json"),
  });

  // Test WebSocket - Room Chat
  const roomName = "testRoom";
  const username = `user_${randomString(5)}`;

  const wsUrl = `ws://localhost:8083/ws?name=${username}&room=${roomName}`;

  const res = ws.connect(wsUrl, {}, function (socket) {
    socket.on("open", () => {
      // Send join message
      socket.send(
        JSON.stringify({
          type: 1, // JOIN
          from: username,
          to: roomName,
          content: "",
        }),
      );

      // Send a chat message
      socket.send(
        JSON.stringify({
          type: 0, // MESSAGE
          from: username,
          to: roomName,
          content: "Hello, this is a test message!",
        }),
      );

      // Send typing indicator
      socket.send(
        JSON.stringify({
          type: 3, // TYPING
          from: username,
          to: roomName,
          content: "",
        }),
      );

      // Send stop typing
      socket.send(
        JSON.stringify({
          type: 4, // STOP_TYPING
          from: username,
          to: roomName,
          content: "",
        }),
      );
    });

    socket.on("message", (data) => {
      // Verify received messages
      const msg = JSON.parse(data);
      check(msg, {
        "message has correct structure": () =>
          msg.type !== undefined &&
          msg.from !== undefined &&
          msg.to !== undefined &&
          msg.content !== undefined,
      });
    });

    socket.on("error", (e) => {
      console.error("WebSocket error: ", e);
    });

    // Keep connection alive for a while
    sleep(5);

    // Send leave message before closing
    socket.send(
      JSON.stringify({
        type: 2, // LEAVE
        from: username,
        to: roomName,
        content: "",
      }),
    );
  });

  check(res, {
    "WebSocket connection successful": (r) => r && r.status === 101,
  });
}
