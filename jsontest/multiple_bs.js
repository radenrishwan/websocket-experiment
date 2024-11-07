const WebSocket = require("ws");
const crypto = require("crypto");
const msgpack = require("msgpack5")();

const NUM_CLIENTS = 15000;
const USERS_PER_ROOM = 100;
const NUM_ROOMS = NUM_CLIENTS / USERS_PER_ROOM;
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 100;
const WS_URL = "ws://localhost:8083/ws";
const RUN_DURATION = 2 * 60 * 1000;

let connectedClients = 0;
let successfulConnections = 0;
let failedConnections = 0;

const generateRandomName = () => {
    return "client_" + crypto.randomBytes(4).toString("hex");
};

const createWebSocketClient = (room) => {
    const name = generateRandomName();

    const ws = new WebSocket(`${WS_URL}?name=${name}&room=${room}`);
    
    // Configure WebSocket for binary data
    ws.binaryType = 'nodebuffer';

    ws.on("open", () => {
        successfulConnections++;
        connectedClients++;

        // Send join message using MessagePack
        const joinMessage = {
            type: 1, // JOIN
            from: name,
            to: room,
            content: "Joined the room"
        };
        ws.send(msgpack.encode(joinMessage));

        // Periodically send messages
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const message = {
                    type: 0, // MESSAGE
                    from: name,
                    to: room,
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

    // Handle incoming messages with MessagePack
    ws.on("message", (data) => {
        const message = msgpack.decode(data);
        // Process message if needed
    });

    return ws;
};

const clientsPerRoom = [];

const createConnectionsForRooms = async () => {
    console.log(`Starting to create connections for ${NUM_ROOMS} rooms...`);
    console.time("Total Connection Time");

    for (let room = 0; room < NUM_ROOMS; room++) {
        clientsPerRoom[room] = [];

        console.log(`\nCreating connections for Room ${room + 1}...`);
        console.time(`Room ${room + 1} Connection Time`);

        for (let i = 0; i < USERS_PER_ROOM; i += BATCH_SIZE) {
            const batch = Math.min(BATCH_SIZE, USERS_PER_ROOM - i);

            for (let j = 0; j < batch; j++) {
                clientsPerRoom[room].push(createWebSocketClient(`room_${room + 1}`));
            }

            console.log(`Room ${room + 1}: Created ${i + batch} connections...`);
            await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }

        console.timeEnd(`Room ${room + 1} Connection Time`);
    }

    console.timeEnd("Total Connection Time");
};

// Start the test for multiple rooms
createConnectionsForRooms().then(() => {
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