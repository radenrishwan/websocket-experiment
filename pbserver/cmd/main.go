package main

import (
	"encoding/json"
	"errors"
	"log/slog"
	"pbserver"
	"pbserver/model"
	"strconv"

	"github.com/radenrishwan/hfs"
	"google.golang.org/protobuf/proto"
)

var websocket = hfs.NewWebsocket(nil)
var clients = make(map[int64]*pbserver.Client)
var rooms = make(map[string][]bool)

func main() {
	server := hfs.NewServer(":8083", hfs.Option{})

	server.ServeFile("/", "public/index.html")
	server.ServeDir("/pb", "model/")

	server.Handle("/api/clients", func(r hfs.Request) *hfs.Response {
		type cl struct {
			Id   int64  `json:"id"`
			Name string `json:"name"`
		}

		var result []cl

		for _, v := range clients {
			result = append(result, cl{
				Id:   v.ConnectAt,
				Name: v.Name,
			})
		}

		data, _ := json.Marshal(map[string]any{
			"clients": result,
		})

		return hfs.NewJSONResponse(string(data))
	})
	server.Handle("/api/rooms", func(r hfs.Request) *hfs.Response {
		var data []string

		for k := range rooms {
			data = append(data, k)
		}

		result, _ := json.Marshal(map[string]any{
			"rooms": data,
		})
		return hfs.NewJSONResponse(string(result))
	})

	server.Handle("/ws", func(r hfs.Request) *hfs.Response {
		name := r.GetArgs("name")
		if name == "" {
			slog.Error("Error while get args", "ERROR", "Name is required")
			return hfs.NewTextResponse("Name is required")
		}

		conn, _ := websocket.Upgrade(r)
		client := pbserver.NewClient(name, &conn)
		clients[client.ConnectAt] = &client

		room := r.GetArgs("room")
		private := r.GetArgs("private")

		if room != "" {
			roomLoop(room, &client)
		} else if private != "" {
			// string to int64
			privId, err := strconv.Atoi(private)
			if err != nil {
				slog.Error("Error while converting private to int64", "ERROR", err.Error())
				return hfs.NewTextResponse("Error while converting private to int64")
			}

			privateLoop(int64(privId), &client)
		} else {
			slog.Error("Error while get args", "ERROR", "Room or private is required")
			return hfs.NewTextResponse("Room or private is required")
		}

		// remove client from clients
		delete(clients, client.ConnectAt)

		return hfs.NewTextResponse("OK")
	})

	err := server.ListenAndServe()
	if err != nil {
		panic(err)
	}
}

func roomLoop(room string, client *pbserver.Client) error {
	// check if room is exist
	if _, ok := rooms[room]; !ok {
		websocket.CreateRoom(room)
		rooms[room] = append(rooms[room], true)
	}

	// add to room
	websocket.Rooms[room].AddClient(client.Conn)

	for {
		data, err := client.Conn.Read()
		if err != nil {
			return err
		}

		msg := model.Message{}
		err = proto.Unmarshal(data, &msg)
		if err != nil {
			slog.Error("Error while parsing data", "ERROR", err.Error())
		}

		slog.Info("MSG INCOMMING", "MSG", msg.String())

		switch msg.Type {
		case int32(pbserver.MESSAGE):
			websocket.Broadcast(room, string(pbserver.NewMessage(&msg)), true)
		case int32(pbserver.JOIN):
			res := model.Message{
				Type:    int32(pbserver.JOIN),
				From:    "SERVER",
				To:      room,
				Content: client.Name + " has joined the room",
			}

			websocket.Broadcast(room, string(pbserver.NewMessage(&res)), true)
		case int32(pbserver.LEAVE):
			res := model.Message{
				Type:    int32(pbserver.LEAVE),
				From:    "SERVER",
				To:      room,
				Content: client.Name + " has left the room",
			}

			websocket.Broadcast(room, string(pbserver.NewMessage(&res)), true)
		case int32(pbserver.TYPING):
			res := model.Message{
				Type:    int32(pbserver.TYPING),
				From:    client.Name,
				To:      room,
				Content: client.Name + "is typing...",
			}

			websocket.Broadcast(room, string(pbserver.NewMessage(&res)), true)
		case int32(pbserver.STOP_TYPING):
			res := model.Message{
				Type:    int32(pbserver.STOP_TYPING),
				From:    client.Name,
				To:      room,
				Content: client.Name + "stop typing...",
			}
			websocket.Broadcast(room, string(pbserver.NewMessage(&res)), true)
		}
	}
}

func privateLoop(private int64, client *pbserver.Client) error {
	// check if client is exist
	if _, ok := clients[private]; !ok {
		return errors.New("Client not found")
	}

	to := clients[private]
	for {
		data, err := client.Conn.Read()
		if err != nil {
			return err
		}

		msg := model.Message{}
		err = proto.Unmarshal(data, &msg)
		if err != nil {
			slog.Error("Error while parsing data", "ERROR", err.Error())
		}

		slog.Info("MSG INCOMMING", "MSG", msg.String())

		switch msg.Type {
		case int32(pbserver.MESSAGE):
			to.Conn.Send(string(pbserver.NewMessage(&msg)))
		case int32(pbserver.JOIN):
			res := model.Message{
				Type:    int32(pbserver.JOIN),
				From:    "SERVER",
				To:      client.Name,
				Content: client.Name + " has joined the room",
			}

			to.Conn.Send(string(pbserver.NewMessage(&res)))
		case int32(pbserver.LEAVE):
			res := model.Message{
				Type:    int32(pbserver.LEAVE),
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + " has left the room",
			}

			to.Conn.Send(string(pbserver.NewMessage(&res)))
		case int32(pbserver.TYPING):
			res := model.Message{
				Type:    int32(pbserver.TYPING),
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + "is typing...",
			}

			to.Conn.Send(string(pbserver.NewMessage(&res)))
		case int32(pbserver.STOP_TYPING):
			res := model.Message{
				Type:    int32(pbserver.STOP_TYPING),
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + "stop typing...",
			}

			to.Conn.Send(string(pbserver.NewMessage(&res)))
		}
	}
}
