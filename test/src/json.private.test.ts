import ws from "k6/ws";
import { check, group, sleep } from "k6";

// Message types
const MESSAGE = 0;
const JOIN = 1;
const LEAVE = 2;
const TYPING = 3;
const STOP_TYPING = 4;

export const options = {
  vus: 15000,
  duration: "2m",
};

export function runUserA() {
  // Generate unique usernames for each iteration
  const userA = `userA_${__VU}_${__ITER}`;

  group("User A Connect", () => {
    // Connect userA first
    const wsUserA = ws.connect(
      `ws://localhost:8083/ws?name=${userA}&room=private`,
      { tags: { type: "userA" } },
      function (socket) {
        socket.on("message", function (data) {
          group("User A Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userA received message": (msg) => msg.type !== undefined,
            });
          });
        });

        socket.on("error", function (e) {
          group("User A Error Handling", () => {
            console.error("userA error: ", e);
          });
        });
      },
    );
  });

  sleep(10);
}

export default function runUserB() {
  const userA = `userA_${__VU}_${__ITER}`;
  const userB = `userB_${__VU}_${__ITER}`;

  sleep(1);

  group("User B Connect", () => {
    const wsUserB = ws.connect(
      `ws://localhost:8083/ws?name=${userB}&private=${userA}`,
      { tags: { type: "userB" } },
      function (socket) {
        socket.on("open", function () {
          group("User B Join", () => {
            const join = {
              type: JOIN,
              from: userB,
              to: userA,
            };

            socket.send(JSON.stringify(join));
          });
        });

        socket.on("message", function (data) {
          group("User B Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userB received message": (msg) => msg.type !== undefined,
            });
          });
        });

        // Send messages every second from userB to userA
        const interval = setInterval(() => {
          const msg = `Hello from ${userB} at ${new Date().toISOString()}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: userB,
                to: userA,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: userB,
              to: userA,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: userB,
              to: userA,
            };

            socket.send(JSON.stringify(stopTyping));
          });
        }, 500);

        // Clear interval when connection closes
        socket.on("close", () => clearInterval(interval));
      },
    );
  });
}
