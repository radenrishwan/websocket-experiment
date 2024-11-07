import { WebSocket } from "k6/x/websockets";
import { check } from "k6";
import { SharedArray } from "k6/data";
var vus = 100;

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

const datas = new SharedArray("username", () => {
  const data = [
    {
      usernameA: "userA1",
      usernameB: "userB1",
    },
  ];

  return data;
});

export function userA() {
  console.log(`UserA: ${__VU}`);
}

export function userB() {
  console.log(`UserB: ${__VU}`);
}
