package main

import (
	"encoding/json"
	"errors"
	"jsonserver"
	"log/slog"
	"strconv"
	"sync"

	"github.com/radenrishwan/hfs"
)

var websocket = hfs.NewWebsocket(nil)
var clients sync.Map
var rooms sync.Map

func main() {
	server := hfs.NewServer(":8083", hfs.Option{})

	server.ServeFile("/", "public/index.html")

	server.Handle("/api/clients", func(r hfs.Request) *hfs.Response {
		type cl struct {
			Id        string `json:"id"`
			Name      string `json:"name"`
			ConnectAt int64  `json:"connect_at"`
		}

		var result []cl
		clients.Range(func(key, value interface{}) bool {
			v := value.(*jsonserver.Client)
			result = append(result, cl{
				Id:        strconv.FormatInt(v.ConnectAt, 10),
				Name:      v.Name,
				ConnectAt: v.ConnectAt,
			})
			return true
		})

		data, _ := json.Marshal(map[string]any{
			"clients": result,
		})

		return hfs.NewJSONResponse(string(data))
	})

	server.Handle("/api/rooms", func(r hfs.Request) *hfs.Response {
		var data []string

		rooms.Range(func(key, value interface{}) bool {
			data = append(data, key.(string))
			return true
		})

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
		client := jsonserver.NewClient(name, &conn)
		clients.Store(client.ConnectAt, &client)

		room := r.GetArgs("room")
		private := r.GetArgs("private")

		// send user data
		msg := jsonserver.Message{
			Type:    jsonserver.MESSAGE,
			From:    "SERVER",
			To:      string(rune(client.ConnectAt)),
			Content: string(client.Json()),
		}

		client.Conn.Send(msg.String())

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
		clients.Delete(client.ConnectAt)

		return hfs.NewTextResponse("OK")
	})

	err := server.ListenAndServe()
	if err != nil {
		panic(err)
	}
}

func roomLoop(room string, client *jsonserver.Client) error {
	// check if room is exist
	if _, ok := rooms.Load(room); !ok {
		websocket.CreateRoom(room)
		rooms.Store(room, []bool{true})
	}

	// add to room
	rl, ok := websocket.Rooms.Load(room)
	if !ok {
		return errors.New("Error while loading room")
	}

	rl.(*hfs.Room).AddClient(client.Conn)

	for {
		data, err := client.Conn.Read()
		if err != nil {
			return err
		}

		msg := jsonserver.NewMessage()
		err = msg.Parse(data)
		if err != nil {
			slog.Error("Error while parsing data", "ERROR", err.Error())
		}

		slog.Info("MSG INCOMMING", "MSG", msg.String())

		switch msg.Type {
		case jsonserver.MESSAGE:
			websocket.Broadcast(room, msg.String(), true)
		case jsonserver.JOIN:
			res := jsonserver.Message{
				Type:    jsonserver.JOIN,
				From:    "SERVER",
				To:      room,
				Content: client.Name + " has joined the room",
			}

			websocket.Broadcast(room, res.String(), true)
		case jsonserver.LEAVE:
			res := jsonserver.Message{
				Type:    jsonserver.LEAVE,
				From:    "SERVER",
				To:      room,
				Content: client.Name + " has left the room",
			}

			websocket.Broadcast(room, res.String(), true)
		case jsonserver.TYPING:
			res := jsonserver.Message{
				Type:    jsonserver.TYPING,
				From:    client.Name,
				To:      room,
				Content: client.Name + "is typing...",
			}

			websocket.Broadcast(room, res.String(), true)
		case jsonserver.STOP_TYPING:
			res := jsonserver.Message{
				Type:    jsonserver.STOP_TYPING,
				From:    client.Name,
				To:      room,
				Content: client.Name + "stop typing...",
			}
			websocket.Broadcast(room, res.String(), true)
		}
	}
}

func privateLoop(private int64, client *jsonserver.Client) error {
	// check if client is exist
	if _, ok := clients.Load(private); !ok {
		return errors.New("Client not found")
	}

	toVal, _ := clients.Load(private)
	to := toVal.(*jsonserver.Client)

	for {
		data, err := client.Conn.Read()
		if err != nil {
			return err
		}

		msg := jsonserver.NewMessage()
		err = msg.Parse(data)
		if err != nil {
			slog.Error("Error while parsing data", "ERROR", err.Error())
		}

		switch msg.Type {
		case jsonserver.MESSAGE:
			to.Conn.Send(msg.String())
		case jsonserver.JOIN:
			res := jsonserver.Message{
				Type:    jsonserver.JOIN,
				From:    "SERVER",
				To:      client.Name,
				Content: client.Name + " has joined the room",
			}

			to.Conn.Send(res.String())
		case jsonserver.LEAVE:
			res := jsonserver.Message{
				Type:    jsonserver.LEAVE,
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + " has left the room",
			}

			to.Conn.Send(res.String())
		case jsonserver.TYPING:
			res := jsonserver.Message{
				Type:    jsonserver.TYPING,
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + "is typing...",
			}

			to.Conn.Send(res.String())
		case jsonserver.STOP_TYPING:
			res := jsonserver.Message{
				Type:    jsonserver.STOP_TYPING,
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + "stop typing...",
			}

			to.Conn.Send(res.String())
		}
	}
}
