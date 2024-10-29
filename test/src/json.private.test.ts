import ws from "k6/ws";
import { check, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  stages: [
    { duration: "30s", target: 1000 }, // Ramp up to 1000 VUs in 30s
    { duration: "30s", target: 2500 }, // Ramp up to 2500 VUs in next 30s
    { duration: "1m", target: 2500 }, // Stay at 2500 VUs for 1 minute
    { duration: "1m", target: 5000 }, // Stay at 2500 VUs for 1 minute
    { duration: "30s", target: 0 }, // Ramp down to 0 VUs
  ],
};

const MESSAGE = 0;
const JOIN = 1;
const LEAVE = 2;
const TYPING = 3;
const STOP_TYPING = 4;

export default function () {
  const base_url = "ws://localhost:8083/ws";

  const user1 = randomString(10, "abcdefghijklmnopqrstuvwxyz1234567890");
  const user2 = randomString(10, "abcdefghijklmnopqrstuvwxyz1234567890");

  // run user 1
  const res = ws.connect(
    base_url + `?name=${user1}&room=general`,
    {},
    function (socket) {
      socket.on("open", function open() {
        console.log(`user1: ${user1} connected`);
      });

      const message = {
        type: MESSAGE,
        from: user1,
        to: user2,
        content: "Hello from user1",
      };

      // sending message to user 2 for each 1 secoind
      socket.setInterval(function timeout() {
        socket.send(JSON.stringify(message));
      }, 1000);
    },
  );

  // run user 2
  const res2 = ws.connect(
    base_url + `?name=${user2}&private=${user1}`,
    {},
    function (socket) {
      socket.on("open", function open() {
        console.log(`user2: ${user2} connected`);
      });

      const message = {
        type: MESSAGE,
        from: user2,
        to: user1,
        content: "Hello from user2",
      };

      // sending message to user 2 for each 1 secoind
      socket.setInterval(function timeout() {
        socket.send(JSON.stringify(message));
      }, 1000);
    },
  );

  check(res, { "status is 101": (r) => r && r.status === 101 });
  check(res2, { "status is 101": (r) => r && r.status === 101 });

  sleep(10); // Keep connection alive for 10 seconds
}

export function handleSummary(data) {
  console.log("Preparing the end-of-test summary...");
  console.log(JSON.stringify(data, null, 2));
}
