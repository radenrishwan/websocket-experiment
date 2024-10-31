package main

import (
	"fmt"
	"jsonserver2"
	"log/slog"
	"net/http"

	"github.com/gobwas/ws"
)

func main() {
	b := jsonserver2.NewBroadcaster()
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "public/index.html")
	})

	mux.HandleFunc("/api/rooms", func(w http.ResponseWriter, r *http.Request) {
		jsonserver2.WriteJson(w, map[string]any{
			"rooms": b.List(),
		})
	})

	mux.HandleFunc("/api/room", func(w http.ResponseWriter, r *http.Request) {
		// get room name
		roomName := r.URL.Query().Get("name")
		if roomName == "" {
			slog.Error("room name is required")

			fmt.Fprint(w, "room name is required")
			return
		}

		room, err := b.Get(roomName)
		if err != nil {
			slog.Error("room not found", "err", err)

			fmt.Fprint(w, "room not found")
			return
		}

		jsonserver2.WriteJson(w, map[string]any{
			"clients": room.List(),
		})
	})

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		clientName := r.URL.Query().Get("name")
		if clientName == "" {
			slog.Error("client name is required")

			fmt.Fprint(w, "client name is required")
		}

		roomName := r.URL.Query().Get("room")
		if roomName == "" {
			slog.Error("room name is required")

			fmt.Fprint(w, "room name is required")
			return
		}

		conn, _, _, err := ws.UpgradeHTTP(r, w)
		if err != nil {
			slog.Error("error while upgrading connection", "err", err)

			fmt.Fprint(w, "error while upgrading connection")
			return
		}

		defer conn.Close()

		// check if room is exist
		var room *jsonserver2.Room
		room, err = b.Get(roomName)
		if err != nil {
			b.New(roomName)

			room, _ = b.Get(roomName)
		}

		room.Add(clientName, &conn)

		joinMsg := jsonserver2.Message{
			Type:    jsonserver2.JOIN,
			From:    "SERVER",
			To:      roomName,
			Content: clientName + " join room",
		}

		room.Broadcast(joinMsg.Bytes())

		client := jsonserver2.NewClient(clientName, &conn)

		err = client.ReadPool(room, &b, roomName, clientName)
		if err != nil {
			slog.Error("error while reading pool", "err", err)
		}
	})

	if err := http.ListenAndServe(":8083", mux); err != nil {
		slog.Error("error while starting server", "err", err)
	}
}
