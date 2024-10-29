import ws from "k6/ws";
import { check, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export let options = {
  stages: [
    { duration: "30s", target: 100 }, // Ramp up to 50 users (25 pairs)
    { duration: "1m", target: 250 }, // Stay at 50 users for 1 minute
    { duration: "1m", target: 500 }, // Stay at 50 users for 1 minute
    { duration: "1m", target: 1000 }, // Stay at 50 users for 1 minute
    { duration: "1m", target: 2000 }, // Stay at 50 users for 1 minute
    { duration: "1m", target: 5000 }, // Stay at 50 users for 1 minute
    { duration: "1m", target: 10000 }, // Stay at 50 users for 1 minute
    { duration: "1m", target: 20000 }, // Stay at 50 users for 1 minute
    { duration: "30s", target: 0 }, // Ramp down to 0 users
  ],
};

// Shared state between VUs
let vuPairs = new Map();

export default function () {
  const vuId = __VU; // Virtual User ID

  if (vuId % 2 === 1) {
    // First user in pair
    testPrivateChatUser1(vuId);
  } else {
    // Second user in pair
    testPrivateChatUser2(vuId);
  }
}

function testPrivateChatUser1(vuId) {
  const username1 = `user1_${randomString(5)}`;
  const url = `ws://localhost:8083/ws?name=${username1}`;

  // First user connects and waits for second user
  const res = ws.connect(url, {}, function (socket) {
    socket.on("open", () => {
      console.log(`User1 (VU ${vuId}) connected`);

      // Get client info from first message
      socket.on("message", (msg) => {
        const data = JSON.parse(msg);
        if (data.type === "MESSAGE") {
          // Store connection info for second user to find
          vuPairs.set(vuId, {
            clientId: data.content.connect_at,
            socket: socket,
            username: username1,
          });
        }
      });

      // Handle incoming messages
      socket.on("message", (msg) => {
        const data = JSON.parse(msg);
        if (data.type === "MESSAGE" && data.from !== username1) {
          // Respond to messages from user2
          sleep(0.5);
          socket.send(
            JSON.stringify({
              type: "MESSAGE",
              from: username1,
              to: data.from,
              content: `Reply from ${username1}: ${randomString(10)}`,
            }),
          );
        }
      });
    });

    socket.on("error", (e) => {
      console.log("User1 Error: ", e);
    });
  });

  check(res, { "User1 connected successfully": (r) => r && r.status === 101 });
  sleep(10); // Keep connection alive for a while
}

function testPrivateChatUser2(vuId) {
  const pairVuId = vuId - 1; // Get paired user's ID
  const username2 = `user2_${randomString(5)}`;

  // Wait for first user to connect and store their info
  sleep(2);

  while (!vuPairs.has(pairVuId)) {
    sleep(0.1);
  }

  const pair = vuPairs.get(pairVuId);
  const url = `ws://localhost:8083/ws?name=${username2}&private=${pair.clientId}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on("open", () => {
      console.log(
        `User2 (VU ${vuId}) connected and paired with User1 (VU ${pairVuId})`,
      );

      // Send initial messages
      for (let i = 0; i < 3; i++) {
        socket.send(
          JSON.stringify({
            type: "MESSAGE",
            from: username2,
            to: pair.username,
            content: `Message ${i + 1} from ${username2}`,
          }),
        );
        sleep(1);
      }

      // Send typing events
      socket.send(
        JSON.stringify({
          type: "TYPING",
          from: username2,
          to: pair.username,
          content: "",
        }),
      );

      sleep(0.5);

      socket.send(
        JSON.stringify({
          type: "STOP_TYPING",
          from: username2,
          to: pair.username,
          content: "",
        }),
      );

      // Handle incoming messages
      socket.on("message", (msg) => {
        const data = JSON.parse(msg);
        console.log(`User2 received: ${msg}`);
      });
    });

    socket.on("error", (e) => {
      console.log("User2 Error: ", e);
    });
  });

  check(res, { "User2 connected successfully": (r) => r && r.status === 101 });
  sleep(10); // Keep connection alive for a while

  // Cleanup
  vuPairs.delete(pairVuId);
}
