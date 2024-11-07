import { WebSocket } from "k6/x/websockets";
import { check } from "k6";
import { SharedArray } from "k6/data";

// Message types
const MESSAGE = 0;
const JOIN = 1;
const LEAVE = 2;
const TYPING = 3;
const STOP_TYPING = 4;

const msg = `
  "Lorem ipsum" is a placeholder text commonly used in design, publishing, and graphic design. It's derived from Latin but is essentially meaningless text used to demonstrate visual elements of a document or visual presentation without the distraction of meaningful content.
  `;

var vus = 5;

export const options = {
  discardResponseBodies: true,
  scenarios: {
    userA: {
      executor: "shared-iterations",
      exec: "userA",
      vus: vus,
      iterations: vus,
    },
    userB: {
      executor: "shared-iterations",
      exec: "userB",
      vus: vus,
      iterations: vus,
      startTime: "2s",
    },
  },
};

// username for userA and userB
const data = new SharedArray("username", () => {
  const data = [];

  for (let i = 1; i <= vus; i++) {
    data.push(`userA${i}`);
    data.push(`userB${i}`);
  }

  return data;
});
export function userA() {
  // create username from VU number
  const username = `userA${__VU}`;

  console.log(`UserA: ${username}`);

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=private`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: "private",
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (message.type) {
      case MESSAGE:
        check(message, {
          "message type is MESSAGE": (m) => m.type === MESSAGE,
        });
        break;
      case TYPING:
        check(message, {
          "message type is TYPING": (m) => m.type === TYPING,
        });
        break;
      case STOP_TYPING:
        check(message, {
          "message type is STOP_TYPING": (m) => m.type === STOP_TYPING,
        });
        break;
    }
  };

  setInterval(() => {
    const msg = "Hello, World!!!";

    // send typing message
    for (let i = 0; i < msg.length; i++) {
      ws.send(
        JSON.stringify({
          type: TYPING,
          from: username,
          to: "private",
        }),
      );
    }

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: "private",
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: "private",
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}

export function userB() {
  const username = `userB${__VU}`;
  const usernameA = `userA${__VU - 1}`;

  console.log(`UserB: ${username} UserA: ${usernameA}`);

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&private=${usernameA}`);

  ws.onopen = () => {
    console.log(`${username} Connected to ${url}`);
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: "private",
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    console.log(`Received message: ${msg.data}`);
    switch (message.type) {
      case MESSAGE:
        check(message, {
          "message type is MESSAGE": (m) => m.type === MESSAGE,
        });
        break;
      case TYPING:
        check(message, {
          "message type is TYPING": (m) => m.type === TYPING,
        });
        break;
      case STOP_TYPING:
        check(message, {
          "message type is STOP_TYPING": (m) => m.type === STOP_TYPING,
        });
        break;
    }
  };

  setInterval(() => {
    // send typing message
    ws.send(
      JSON.stringify({
        type: TYPING,
        from: username,
        to: usernameA,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: usernameA,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: usernameA,
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}
