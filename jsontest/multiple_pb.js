const WebSocket = require("ws");
const crypto = require("crypto");
const protobuf = require("protobufjs");

const NUM_CLIENTS = 10000;
const USERS_PER_ROOM = 100;
const NUM_ROOMS = NUM_CLIENTS / USERS_PER_ROOM;
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 100;
const WS_URL = "ws://localhost:8083/ws";
const RUN_DURATION = 2 * 60 * 1000;

let connectedClients = 0;
let successfulConnections = 0;
let failedConnections = 0;

// Create proper protobuf message definition
const root = protobuf.Root.fromJSON({
    nested: {
        model: {
            nested: {
                Message: {
                    fields: {
                        type: {
                            type: "int32",
                            id: 1
                        },
                        from: {
                            type: "string",
                            id: 2
                        },
                        to: {
                            type: "string",
                            id: 3
                        },
                        content: {
                            type: "string",
                            id: 4
                        }
                    }
                }
            }
        }
    }
});

const Message = root.lookupType("model.Message");

const generateRandomName = () => {
    return "client_" + crypto.randomBytes(4).toString("hex");
};

const createWebSocketClient = (room) => {
    const name = generateRandomName();

    const ws = new WebSocket(`${WS_URL}?name=${name}&room=${room}`);
    ws.binaryType = 'arraybuffer';

    ws.on("open", () => {
        successfulConnections++;
        connectedClients++;

        // Send join message using Protobuf
        const joinMessage = Message.create({
            type: 1, // JOIN
            from: name,
            to: room,
            content: "Joined the room"
        });

        const buffer = Message.encode(joinMessage).finish();
        ws.send(buffer);

        // Periodically send messages
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const message = Message.create({
                    type: 0, // MESSAGE
                    from: name,
                    to: room,
                    content: `Message from ${name}`
                });
                ws.send(Message.encode(message).finish());
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
        const message = Message.decode(new Uint8Array(data));
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

// Start the test
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