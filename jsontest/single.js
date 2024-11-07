const WebSocket = require("ws");
const crypto = require("crypto");

const NUM_CLIENTS = 1600; // Total number of users
const BATCH_SIZE = 100; // Number of connections to create simultaneously
const DELAY_BETWEEN_BATCHES = 100; // Milliseconds between batches
const WS_URL = "ws://localhost:8083/ws";
const RUN_DURATION = 2 * 60 * 1000; // 2 minutes

let connectedClients = 0;
let successfulConnections = 0;
let failedConnections = 0;

const generateRandomName = () => {
  return "client_" + crypto.randomBytes(4).toString("hex");
};

const createWebSocketClient = (room) => {
  const name = generateRandomName();

  const ws = new WebSocket(`${WS_URL}?name=${name}&room=${room}`);

  ws.on("open", () => {
    successfulConnections++;
    connectedClients++;

    // Send join message
    const joinMessage = {
      type: 1, // JOIN
      from: name,
      to: room,
      content: "Joined the room",
    };
    ws.send(JSON.stringify(joinMessage));

    // Periodically send messages
    setInterval(
      () => {
        if (ws.readyState === WebSocket.OPEN) {
          const message = {
            type: 0, // MESSAGE
            from: name,
            to: room,
            content: `Message from ${name}`,
          };
          ws.send(JSON.stringify(message));
        }
      },
      5000 + Math.random() * 5000,
    ); // Random interval between 5-10 seconds
  });

  ws.on("error", (error) => {
    failedConnections++;
    console.error(`Connection failed for ${name}:`, error.message);
  });

  ws.on("close", () => {
    connectedClients--;
  });

  return ws;
};

const clients = [];

// Create connections for a single room
const createConnectionsForRoom = async () => {
  const room = "room_1";
  console.log(`Starting to create connections for ${room}...`);
  console.time("Total Connection Time");

  for (let i = 0; i < NUM_CLIENTS; i += BATCH_SIZE) {
    const batch = Math.min(BATCH_SIZE, NUM_CLIENTS - i);

    for (let j = 0; j < batch; j++) {
      clients.push(createWebSocketClient(room));
    }

    // Progress update
    console.log(`Room ${room}: Created ${i + batch} connections...`);

    // Wait before creating next batch
    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
  }

  console.timeEnd("Total Connection Time");
};

// Start the test for a single room
createConnectionsForRoom().then(() => {
  // Print statistics every 5 seconds
  const statsInterval = setInterval(() => {
    console.log("\n=== Connection Statistics ===");
    console.log(`Total Attempted: ${NUM_CLIENTS}`);
    console.log(`Successfully Connected: ${successfulConnections}`);
    console.log(`Failed Connections: ${failedConnections}`);
  }, 5000);

  // Close the program after RUN_DURATION
  setTimeout(() => {
    clearInterval(statsInterval);
    console.log("\n=== Test Completed ===");
    console.log(`Total Attempted: ${NUM_CLIENTS}`);
    console.log(`Successfully Connected: ${successfulConnections}`);
    console.log(`Failed Connections: ${failedConnections}`);
    process.exit(0);
  }, RUN_DURATION);
});