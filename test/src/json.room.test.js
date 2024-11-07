import { WebSocket } from "k6/x/websockets";
import { check, group, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

// Message types
const MESSAGE = 0;
const JOIN = 1;
const LEAVE = 2;
const TYPING = 3;
const STOP_TYPING = 4;

const msg = `
  "Lorem ipsum" is a placeholder text commonly used in design, publishing, and graphic design. It's derived from Latin but is essentially meaningless text used to demonstrate visual elements of a document or visual presentation without the distraction of meaningful content.
  `;

export const options = {
  stages: [
    { duration: "30s", target: 1 },
    // { duration: "1m", target: 10 },
    { duration: "30s", target: 0 },
  ],
};

export default function userA() {
  // create username from VU number
  const username = `userA${__VU}`;
  const room = `room${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=${__VU}`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: room,
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
    // send typing message
    ws.send(
      JSON.stringify({
        type: TYPING,
        from: username,
        to: room,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: room,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: room,
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
  // create username from VU number
  const username = randomString(10, `aeioubcdfghijpqrstuv1234567890`);
  const room = `room${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=${__VU}`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: room,
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (m.type) {
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
        to: room,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: room,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: room,
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}

export function userC() {
  // create username from VU number
  const username = randomString(10, `aeioubcdfghijpqrstuv1234567890`);
  const room = `room${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=${__VU}`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: room,
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (m.type) {
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
        to: room,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: room,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: room,
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}

export function userD() {
  // create username from VU number
  const username = randomString(10, `aeioubcdfghijpqrstuv1234567890`);
  const room = `room${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=${__VU}`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: room,
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (m.type) {
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
        to: room,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: room,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: room,
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}

export function userE() {
  // create username from VU number
  const username = randomString(10, `aeioubcdfghijpqrstuv1234567890`);
  const room = `room${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=${__VU}`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: room,
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (m.type) {
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
        to: room,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: room,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: room,
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}

export function userF() {
  // create username from VU number
  const username = randomString(10, `aeioubcdfghijpqrstuv1234567890`);
  const room = `room${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=${__VU}`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: room,
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (m.type) {
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
        to: room,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: room,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: room,
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}

export function userG() {
  // create username from VU number
  const username = randomString(10, `aeioubcdfghijpqrstuv1234567890`);
  const room = `room${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=${__VU}`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: room,
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (m.type) {
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
        to: room,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: room,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: room,
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}

export function userH() {
  // create username from VU number
  const username = randomString(10, `aeioubcdfghijpqrstuv1234567890`);
  const room = `room${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=${__VU}`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: room,
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (m.type) {
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
        to: room,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: room,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: room,
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}

export function userI() {
  // create username from VU number
  const username = randomString(10, `aeioubcdfghijpqrstuv1234567890`);
  const room = `room${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=${__VU}`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: room,
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (m.type) {
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
        to: room,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: room,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: room,
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}

export function userJ() {
  // create username from VU number
  const username = randomString(10, `aeioubcdfghijpqrstuv1234567890`);
  const room = `room${__VU}`;

  var url = "ws://localhost:8083/ws";

  let ws = new WebSocket(url + `?name=${username}&room=${__VU}`);

  ws.onopen = () => {
    // send join message
    ws.send(
      JSON.stringify({
        type: JOIN,
        from: username,
        to: room,
      }),
    );
  };

  ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (m.type) {
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
        to: room,
      }),
    );

    // send message
    ws.send(
      JSON.stringify({
        type: MESSAGE,
        from: username,
        to: room,
        content: msg,
      }),
    );

    // send stop typing message
    ws.send(
      JSON.stringify({
        type: STOP_TYPING,
        from: username,
        to: room,
      }),
    );
  }, 1000);

  ws.onerror = (e) => {
    if (e.error != "websocket: close sent") {
      console.log("An unexpected error occurred: ", e.error);
    }
  };
}
