import { WebSocket } from "k6/x/websockets";
import { check, group, sleep } from "k6";

// Message types
const MESSAGE = 0;
const JOIN = 1;
const LEAVE = 2;
const TYPING = 3;
const STOP_TYPING = 4;

export const options = {
  vus: 100,
  duration: "2m",
};

export default function userA() {
  // create username from VU number
  const username = `userA${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=private`);

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
    check(message, {
      "message type is MESSAGE": (m) => m.type !== undefined,
    });
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
  const usernameA = `userA${__VU}`;

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
    check(message, {
      "message type is MESSAGE": (m) => m.type !== undefined,
    });
  };

  setInterval(() => {
    const msg = "Hello, World!!!";

    // send typing message
    for (let i = 0; i < msg.length; i++) {
      ws.send(
        JSON.stringify({
          type: TYPING,
          from: username,
          to: usernameA,
        }),
      );
    }

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
