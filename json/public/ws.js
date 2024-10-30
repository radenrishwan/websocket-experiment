let ws;
let typingTimeout;
const MESSAGE = 0;
const JOIN = 1;
const LEAVE = 2;
const TYPING = 3;
const STOP_TYPING = 4;

const style = document.createElement("style");
style.textContent = `
        .private-chat-header {
            background-color: #f8d7da;
            color: #721c24;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
            text-align: center;
        }
        .private-message {
            background-color: #ffe0e0;
            border-radius: 5px;
            padding: 8px;
            margin: 5px 0;
        }
        .room-item {
            padding: 10px;
            margin: 5px 0;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            cursor: pointer;
        }
        .room-item:hover {
            background-color: #e9ecef;
        }
    `;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", () => {
  // Type select change handler
  document
    .getElementById("typeSelect")
    .addEventListener("change", handleTypeChange);

  // Refresh rooms button
  document
    .getElementById("refreshButton")
    .addEventListener("click", refreshRooms);

  // Connect button
  document.getElementById("connectButton").addEventListener("click", connect);

  // Send button
  document.getElementById("sendButton").addEventListener("click", sendMessage);

  // Message input typing handler
  document
    .getElementById("messageInput")
    .addEventListener("keydown", handleTyping);

  // Initial setup
  handleTypeChange();
  refreshRooms();
});

let clientsRefreshInterval;

function startClientsRefresh() {
  if (document.getElementById("typeSelect").value === "private") {
    refreshClients();
    clientsRefreshInterval = setInterval(refreshClients, 5000); // Refresh every 5 seconds
  }
}

function stopClientsRefresh() {
  if (clientsRefreshInterval) {
    clearInterval(clientsRefreshInterval);
  }
}

async function refreshClients() {
  if (document.getElementById("typeSelect").value === "private") {
    const clients = await fetchClients();
    displayClients(clients);
  }
}

async function fetchRooms() {
  try {
    const response = await fetch("http://localhost:8083/api/rooms");
    const data = await response.json();
    return data.rooms || [];
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }
}

async function fetchClients() {
  try {
    const response = await fetch("http://localhost:8083/api/clients");
    const data = await response.json();
    return data.clients || [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

async function refreshRooms() {
  const roomsList = document.getElementById("roomsList");
  roomsList.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <i class="fas fa-spinner fa-spin text-4xl mb-2"></i>
              <p class="text-center">Fetching rooms...</p>
          </div>
        `;

  const rooms = await fetchRooms();

  if (rooms.length === 0) {
    roomsList.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <i class="fas fa-comments text-4xl mb-2"></i>
                <p class="text-center">No active rooms available</p>
                <p class="text-sm text-center mt-1">Create a room or wait for others to join</p>
            </div>
        `;
    return;
  }

  roomsList.innerHTML = "";
  rooms.forEach((room) => {
    const roomElement = createRoomElement(room);
    roomsList.appendChild(roomElement);
  });
}

function createRoomElement(room) {
  const roomElement = document.createElement("div");
  roomElement.className =
    "p-4 border-b hover:bg-gray-50 cursor-pointer transition duration-200 flex items-center space-x-3";

  const roomIcon = document.createElement("div");
  roomIcon.className =
    "w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold";
  roomIcon.textContent = room.charAt(0).toUpperCase();

  const roomDetails = document.createElement("div");
  roomDetails.className = "flex-1";
  roomDetails.innerHTML = `
                    <h3 class="font-semibold text-gray-800">${room}</h3>
                    <p class="text-sm text-gray-500">Click to join</p>
                `;

  roomElement.appendChild(roomIcon);
  roomElement.appendChild(roomDetails);

  roomElement.addEventListener("click", () => {
    const nameInput = document.getElementById("nameInput").value;
    if (!nameInput) {
      alert("Please enter your name first!");
      return;
    }
    document.getElementById("roomInput").value = room;
    connect();
  });

  return roomElement;
}

async function handleTypeChange() {
  const typeSelect = document.getElementById("typeSelect");
  const roomInputContainer = document.getElementById("roomInputContainer");
  const roomInput = document.getElementById("roomInput");
  const roomsList = document.getElementById("roomsList");

  if (typeSelect.value === "room") {
    roomInputContainer.style.display = "block";
    roomInput.placeholder = "Enter room name";
    roomsList.innerHTML = "Loading rooms...";
    const rooms = await fetchRooms();
    displayRooms(rooms);
  } else {
    roomInputContainer.style.display = "block";
    roomInput.placeholder = "Enter user ID";
    roomsList.innerHTML = "Loading users...";
    const clients = await fetchClients();
    displayClients(clients);
  }
}

function displayRooms(rooms) {
  const roomsList = document.getElementById("roomsList");

  if (rooms.length === 0) {
    roomsList.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                            <i class="fas fa-comments text-4xl mb-2"></i>
                            <p class="text-center">No active rooms available</p>
                            <p class="text-sm text-center mt-1">Create a room or wait for others to join</p>
                        </div>
                    `;
    return;
  }

  roomsList.innerHTML = "";
  rooms.forEach((room) => {
    const roomElement = createRoomElement(room);
    roomsList.appendChild(roomElement);
  });
}

function displayClients(clients) {
  const roomsList = document.getElementById("roomsList");
  roomsList.innerHTML = "";

  if (clients.length === 0) {
    roomsList.innerHTML = "No active users";
    return;
  }

  const currentUserId = document.getElementById("userInfoId").textContent;

  clients.forEach((client) => {
    // Don't show current user in the list
    if (client.id === currentUserId) {
      return;
    }

    const clientElement = document.createElement("div");
    clientElement.className = "room-item";
    clientElement.innerHTML = `
                <strong>${client.name}</strong><br>
                <small>ID: ${client.id}</small>
            `;
    clientElement.addEventListener("click", () => {
      document.getElementById("roomInput").value = client.id;
    });
    roomsList.appendChild(clientElement);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  handleTypeChange();
  refreshRooms();
});

function connect() {
  const name = document.getElementById("nameInput").value;
  const type = document.getElementById("typeSelect").value;
  const roomOrPrivate = document.getElementById("roomInput").value;

  if (!name || !roomOrPrivate) {
    alert("Please enter name and room/private ID");
    return;
  }

  let wsUrl = `ws://localhost:8083/ws?name=${encodeURIComponent(name)}`;
  if (type === "room") {
    wsUrl += `&room=${encodeURIComponent(roomOrPrivate)}`;
  } else {
    wsUrl += `&private=${encodeURIComponent(roomOrPrivate)}`;
  }

  if (ws) {
    ws.close();
  }

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    appendMessage("Connected to server", "system");
    const joinMessage = {
      type: JOIN,
      from: name,
      to: roomOrPrivate,
      content: "",
    };
    ws.send(JSON.stringify(joinMessage));

    if (type === "room") {
      stopClientsRefresh();
      refreshRooms();
    } else {
      startClientsRefresh();
    }
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleMessage(message);
  };

  ws.onclose = () => {
    console.log("Disconnected from server");
    appendMessage("Disconnected from server", "system");
    stopClientsRefresh();
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    appendMessage("WebSocket error occurred", "system");
  };
}

function handleMessage(message) {
  console.log("Received message:", message);

  switch (message.type) {
    case MESSAGE:
      if (message.from === "SERVER") {
        try {
          const userData = JSON.parse(message.content);
          updateUserInfo(userData);
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      } else if (message.from !== document.getElementById("nameInput").value) {
        const isPrivate =
          document.getElementById("typeSelect").value === "private";
        const messageClass = isPrivate ? "private-message" : "user";
        const prefix = isPrivate ? "Private message from" : "From";
        appendMessage(
          `${prefix} ${message.from}: ${message.content}`,
          messageClass,
        );
      }
      break;
    case JOIN:
    case LEAVE:
      appendMessage(message.content, "system");
      break;
    case TYPING:
      showTyping(message.from);
      break;
    case STOP_TYPING:
      hideTyping(message.from);
      break;
  }
}

function updateUserInfo(userData) {
  console.log("Updating user info with:", userData); // Debug log

  if (userData) {
    document.getElementById("userInfoId").textContent =
      userData.connect_at || "Unknown";
    document.getElementById("userInfoName").textContent =
      userData.name || "Unknown";
    // Convert timestamp to readable date
    if (userData.connect_at) {
      const connectDate = new Date(userData.connect_at).toLocaleString();
      document.getElementById("userInfoConnectAt").textContent = connectDate;
    } else {
      document.getElementById("userInfoConnectAt").textContent = "Unknown";
    }
  }
}

function sendMessage() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("Not connected to server");
    return;
  }

  const messageInput = document.getElementById("messageInput");
  const content = messageInput.value.trim();
  if (!content) return;

  const message = {
    type: MESSAGE,
    from: document.getElementById("nameInput").value,
    to: document.getElementById("roomInput").value,
    content: content,
  };

  console.log("Sending message:", message);
  ws.send(JSON.stringify(message));
  appendMessage(`${message.from}: ${message.content}`, "user");
  messageInput.value = "";
}

function handleTyping(event) {
  if (event.key === "Enter") {
    sendMessage();
    return;
  }

  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  clearTimeout(typingTimeout);
  const message = {
    type: TYPING,
    from: document.getElementById("nameInput").value,
    to: document.getElementById("roomInput").value,
    content: "",
  };
  ws.send(JSON.stringify(message));

  typingTimeout = setTimeout(() => {
    const stopTypingMessage = {
      type: STOP_TYPING,
      from: document.getElementById("nameInput").value,
      to: document.getElementById("roomInput").value,
      content: "",
    };
    ws.send(JSON.stringify(stopTypingMessage));
  }, 1000);
}

function showTyping(user) {
  const typingIndicator = document.getElementById("typingIndicator");
  typingIndicator.textContent = `${user} is typing...`;
}

function hideTyping(user) {
  const typingIndicator = document.getElementById("typingIndicator");
  typingIndicator.textContent = "";
}

function appendMessage(message, type) {
  const messageDiv = document.createElement("div");
  const isSystem = type === "system";
  const isUser = message.startsWith(
    document.getElementById("nameInput").value + ":",
  );

  if (isSystem) {
    messageDiv.className = "flex justify-center my-2";
    messageDiv.innerHTML = `
                        <span class="bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full">
                            ${message}
                        </span>
                    `;
  } else {
    messageDiv.className = `flex ${isUser ? "justify-end" : "justify-start"} mb-4`;
    const bubbleColor = isUser
      ? "bg-blue-500 text-white"
      : "bg-white text-gray-800";
    const bubbleAlign = isUser
      ? "rounded-l-lg rounded-br-lg"
      : "rounded-r-lg rounded-bl-lg";

    messageDiv.innerHTML = `
                        <div class="${bubbleColor} ${bubbleAlign} px-4 py-2 max-w-[70%] shadow-sm">
                            ${message}
                        </div>
                    `;
  }

  const container = document.getElementById("messageContainer");
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}
