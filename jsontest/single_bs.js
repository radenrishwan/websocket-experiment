const WebSocket = require("ws");
const crypto = require("crypto");
const msgpack = require("msgpack5")();

const NUM_CLIENTS = 2000;
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 100; 
const WS_URL = "ws://localhost:8083/ws";
const ROOM = "test_room";
const RUN_DURATION = 2 * 60 * 1000;

let connectedClients = 0;
let successfulConnections = 0;
let failedConnections = 0;
const clients = [];

const generateRandomName = () => {
    return "client_" + crypto.randomBytes(4).toString("hex");
};

const createWebSocketClient = () => {
    const name = generateRandomName();

    const ws = new WebSocket(`${WS_URL}?name=${name}&room=${ROOM}`);
    ws.binaryType = 'nodebuffer';

    ws.on("open", () => {
        successfulConnections++;
        connectedClients++;

        const joinMessage = {
            type: 1,
            from: name,
            to: ROOM,
            content: "Joined the room"
        };
        ws.send(msgpack.encode(joinMessage));

        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const message = {
                    type: 0,
                    from: name,
                    to: ROOM,
                    content: `Message from ${name}`
                };
                ws.send(msgpack.encode(message));
            }
        }, 5000 + Math.random() * 5000);
    });

    ws.on("error", (error) => {
        failedConnections++;
        console.error(`Connection failed for ${name}:`, error.message);
    });

    ws.on("close", () => {
        connectedClients--;
    });

    ws.on("message", (data) => {
        const message = msgpack.decode(data);
        // Process message if needed
    });

    return ws;
};

const createConnections = async () => {
    console.log("Starting to create connections...");
    console.time("Total Connection Time");

    for (let i = 0; i < NUM_CLIENTS; i += BATCH_SIZE) {
        const batch = Math.min(BATCH_SIZE, NUM_CLIENTS - i);

        for (let j = 0; j < batch; j++) {
            clients.push(createWebSocketClient());
        }

        console.log(`Created ${i + batch} connections...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }

    console.timeEnd("Total Connection Time");
};

createConnections().then(() => {
    const statsInterval = setInterval(() => {
        console.log("\n=== Connection Statistics ===");
        console.log(`Total Attempted: ${NUM_CLIENTS}`);
        console.log(`Successfully Connected: ${successfulConnections}`);
        console.log(`Failed Connections: ${failedConnections}`);
    }, 5000);

    setTimeout(() => {
        clearInterval(statsInterval);
        console.log("\n=== Test Completed ===");
        console.log(`Total Attempted: ${NUM_CLIENTS}`);
        console.log(`Successfully Connected: ${successfulConnections}`);
        console.log(`Failed Connections: ${failedConnections}`);
        process.exit(0);
    }, RUN_DURATION);
});