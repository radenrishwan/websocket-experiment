package main

import (
	"encoding/json"
	"json3"
	"log"
	"log/slog"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for this example
	},
}

func main() {
	broadcaster := json3.NewBroadcaster()
	go broadcaster.Run()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "public/index.html")
	})

	http.HandleFunc("/api/rooms", func(w http.ResponseWriter, r *http.Request) {
		rooms := broadcaster.List()

		w.Header().Set("Content-Type", "application/json")

		result, _ := json.Marshal(map[string]any{
			"count": len(rooms),
			"rooms": rooms,
		})

		w.Write(result)
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// check if room is provided
		room := r.URL.Query().Get("room")
		if room == "" {
			slog.Info("room parameter is required")
			http.Error(w, "Room parameter is required", http.StatusBadRequest)
			return
		}

		// check if client name is provided
		name := r.URL.Query().Get("name")
		if name == "" {
			slog.Info("name parameter is required")
			http.Error(w, "Name parameter is required", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("Error upgrading connection: %v", err)
			return
		}

		client := json3.NewClient(conn, name, room)

		// Register client
		broadcaster.Register <- client

		// Handle incoming messages
		go func() {
			defer func() {
				broadcaster.Unregister <- client
				conn.Close()
			}()

			for {
				_, message, err := conn.ReadMessage()
				if err != nil {
					if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
						log.Printf("error: %v", err)
					}
					break
				}

				// Parse message
				msg := json3.NewMessage()
				if err := msg.Parse(message); err != nil {
					log.Printf("error parsing message: %v", err)
					continue
				}

				// Get room
				if roomInterface, ok := broadcaster.Rooms.Load(client.Room); ok {
					room := roomInterface.(*json3.Room)
					room.Broadcast <- message
				}
			}
		}()

		// Handle outgoing messages
		go func() {
			defer conn.Close()

			for message := range client.Send {
				err := conn.WriteMessage(websocket.TextMessage, message)
				if err != nil {
					break
				}
			}
		}()
	})

	log.Println("Server starting on :8083")
	log.Fatal(http.ListenAndServe(":8083", nil))
}
