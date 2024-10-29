import ws from "k6/ws";
import { check, group, sleep } from "k6";

// Message types
const MESSAGE = 0;
const JOIN = 1;
const LEAVE = 2;
const TYPING = 3;
const STOP_TYPING = 4;

const vus = 5000;

export const options = {
  vus: vus,
  duration: "2m",
  exec: "setup",
};

const roomNameList: string[] = [];

export function setup() {
  for (let i = 0; i < vus / 10; i++) {
    roomNameList.push(`room_${i}`);
  }
}

export function runUserA() {
  const user = `userA_${__VU}_${__ITER}`;
  const room = roomNameList[__VU % roomNameList.length];

  group("User connect", () => {
    ws.connect(
      `ws://localhost:8083/ws?name=${user}&room=${room}`,
      { tags: { type: "userA" } },
      function (socket) {
        socket.on("open", function () {
          group("User A Join", () => {
            const join = {
              type: JOIN,
              from: user,
              to: room,
            };

            socket.send(JSON.stringify(join));
          });
        });

        socket.on("message", function (data) {
          group("User A Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userA received message": (msg) => msg.type !== undefined,
            });
          });
        });

        // Send messages every second
        const interval = setInterval(() => {
          const msg = `Hello from ${user}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: user,
                to: room,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: user,
              to: room,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: user,
              to: room,
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

export function runUserB() {
  const user = `userB_${__VU}_${__ITER}`;
  const room = roomNameList[__VU % roomNameList.length];

  group("User connect", () => {
    ws.connect(
      `ws://localhost:8083/ws?name=${user}&room=${room}`,
      { tags: { type: "userB" } },
      function (socket) {
        socket.on("open", function () {
          group("User B Join", () => {
            const join = {
              type: JOIN,
              from: user,
              to: room,
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

        // Send messages every second
        const interval = setInterval(() => {
          const msg = `Hello from ${user}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: user,
                to: room,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: user,
              to: room,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: user,
              to: room,
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

export function runUserC() {
  const user = `userC_${__VU}_${__ITER}`;
  const room = roomNameList[__VU % roomNameList.length];

  group("User connect", () => {
    ws.connect(
      `ws://localhost:8083/ws?name=${user}&room=${room}`,
      { tags: { type: "userC" } },
      function (socket) {
        socket.on("open", function () {
          group("User C Join", () => {
            const join = {
              type: JOIN,
              from: user,
              to: room,
            };

            socket.send(JSON.stringify(join));
          });
        });

        socket.on("message", function (data) {
          group("User C Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userC received message": (msg) => msg.type !== undefined,
            });
          });
        });

        // Send messages every second
        const interval = setInterval(() => {
          const msg = `Hello from ${user}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: user,
                to: room,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: user,
              to: room,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: user,
              to: room,
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

export function runUserD() {
  const user = `userD_${__VU}_${__ITER}`;
  const room = roomNameList[__VU % roomNameList.length];

  group("User connect", () => {
    ws.connect(
      `ws://localhost:8083/ws?name=${user}&room=${room}`,
      { tags: { type: "userD" } },
      function (socket) {
        socket.on("open", function () {
          group("User D Join", () => {
            const join = {
              type: JOIN,
              from: user,
              to: room,
            };

            socket.send(JSON.stringify(join));
          });
        });

        socket.on("message", function (data) {
          group("User D Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userD received message": (msg) => msg.type !== undefined,
            });
          });
        });

        // Send messages every second
        const interval = setInterval(() => {
          const msg = `Hello from ${user}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: user,
                to: room,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: user,
              to: room,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: user,
              to: room,
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

export function runUserE() {
  const user = `userE_${__VU}_${__ITER}`;
  const room = roomNameList[__VU % roomNameList.length];

  group("User connect", () => {
    ws.connect(
      `ws://localhost:8083/ws?name=${user}&room=${room}`,
      { tags: { type: "userE" } },
      function (socket) {
        socket.on("open", function () {
          group("User E Join", () => {
            const join = {
              type: JOIN,
              from: user,
              to: room,
            };

            socket.send(JSON.stringify(join));
          });
        });

        socket.on("message", function (data) {
          group("User E Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userE received message": (msg) => msg.type !== undefined,
            });
          });
        });

        // Send messages every second
        const interval = setInterval(() => {
          const msg = `Hello from ${user}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: user,
                to: room,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: user,
              to: room,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: user,
              to: room,
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

export function runUserF() {
  const user = `userF_${__VU}_${__ITER}`;
  const room = roomNameList[__VU % roomNameList.length];

  group("User connect", () => {
    ws.connect(
      `ws://localhost:8083/ws?name=${user}&room=${room}`,
      { tags: { type: "userF" } },
      function (socket) {
        socket.on("open", function () {
          group("User F Join", () => {
            const join = {
              type: JOIN,
              from: user,
              to: room,
            };

            socket.send(JSON.stringify(join));
          });
        });

        socket.on("message", function (data) {
          group("User F Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userF received message": (msg) => msg.type !== undefined,
            });
          });
        });

        // Send messages every second
        const interval = setInterval(() => {
          const msg = `Hello from ${user}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: user,
                to: room,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: user,
              to: room,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: user,
              to: room,
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

export function runUserG() {
  const user = `userG_${__VU}_${__ITER}`;
  const room = roomNameList[__VU % roomNameList.length];

  group("User connect", () => {
    ws.connect(
      `ws://localhost:8083/ws?name=${user}&room=${room}`,
      { tags: { type: "userG" } },
      function (socket) {
        socket.on("open", function () {
          group("User G Join", () => {
            const join = {
              type: JOIN,
              from: user,
              to: room,
            };

            socket.send(JSON.stringify(join));
          });
        });

        socket.on("message", function (data) {
          group("User G Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userG received message": (msg) => msg.type !== undefined,
            });
          });
        });

        // Send messages every second
        const interval = setInterval(() => {
          const msg = `Hello from ${user}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: user,
                to: room,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: user,
              to: room,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: user,
              to: room,
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

export function runUserH() {
  const user = `userH_${__VU}_${__ITER}`;
  const room = roomNameList[__VU % roomNameList.length];

  group("User connect", () => {
    ws.connect(
      `ws://localhost:8083/ws?name=${user}&room=${room}`,
      { tags: { type: "userH" } },
      function (socket) {
        socket.on("open", function () {
          group("User H Join", () => {
            const join = {
              type: JOIN,
              from: user,
              to: room,
            };

            socket.send(JSON.stringify(join));
          });
        });

        socket.on("message", function (data) {
          group("User H Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userH received message": (msg) => msg.type !== undefined,
            });
          });
        });

        // Send messages every second
        const interval = setInterval(() => {
          const msg = `Hello from ${user}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: user,
                to: room,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: user,
              to: room,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: user,
              to: room,
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

export function runUserI() {
  const user = `userI_${__VU}_${__ITER}`;
  const room = roomNameList[__VU % roomNameList.length];

  group("User connect", () => {
    ws.connect(
      `ws://localhost:8083/ws?name=${user}&room=${room}`,
      { tags: { type: "userI" } },
      function (socket) {
        socket.on("open", function () {
          group("User I Join", () => {
            const join = {
              type: JOIN,
              from: user,
              to: room,
            };

            socket.send(JSON.stringify(join));
          });
        });

        socket.on("message", function (data) {
          group("User I Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userI received message": (msg) => msg.type !== undefined,
            });
          });
        });

        // Send messages every second
        const interval = setInterval(() => {
          const msg = `Hello from ${user}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: user,
                to: room,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: user,
              to: room,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: user,
              to: room,
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

export function runUserJ() {
  const user = `userJ_${__VU}_${__ITER}`;
  const room = roomNameList[__VU % roomNameList.length];

  group("User connect", () => {
    ws.connect(
      `ws://localhost:8083/ws?name=${user}&room=${room}`,
      { tags: { type: "userJ" } },
      function (socket) {
        socket.on("open", function () {
          group("User J Join", () => {
            const join = {
              type: JOIN,
              from: user,
              to: room,
            };

            socket.send(JSON.stringify(join));
          });
        });

        socket.on("message", function (data) {
          group("User J Message Handling", () => {
            const message = JSON.parse(data);
            check(message, {
              "userJ received message": (msg) => msg.type !== undefined,
            });
          });
        });

        // Send messages every second
        const interval = setInterval(() => {
          const msg = `Hello from ${user}`;

          group("sending typing message", () => {
            // send typing message
            for (let i = 0; i < msg.length; i++) {
              const typing = {
                type: TYPING,
                from: user,
                to: room,
              };

              socket.send(JSON.stringify(typing));
            }
          });

          group("sending message", () => {
            const message = {
              type: MESSAGE,
              from: user,
              to: room,
              content: msg,
            };

            socket.send(JSON.stringify(message));
          });

          group("sending stop typing message", () => {
            const stopTyping = {
              type: STOP_TYPING,
              from: user,
              to: room,
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
