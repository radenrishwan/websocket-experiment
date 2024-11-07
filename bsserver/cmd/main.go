package main

import (
	"bsserver"
	"encoding/json"
	"errors"
	"log"
	"log/slog"
	"strconv"
	"sync"
	"time"

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
			v := value.(*bsserver.Client)
			result = append(result, cl{
				Id:        strconv.FormatInt(v.ConnectAt, 10),
				Name:      v.Name,
				ConnectAt: v.ConnectAt,
			})
			return true
		})

		data, _ := json.Marshal(map[string]any{
			"count":   len(result),
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
			"count": len(data),
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

		// check if name is exist
		_, ok := clients.Load(name)
		if ok {
			slog.Error("Error while get args", "ERROR", "Name is already exist")
			return hfs.NewTextResponse("Name is already exist")
		}

		conn, _ := websocket.Upgrade(r)
		client := bsserver.NewClient(name, &conn)
		clients.Store(client.Name, &client)

		room := r.GetArgs("room")
		private := r.GetArgs("private")

		// send user data
		msg := bsserver.Message{
			Type:    bsserver.MESSAGE,
			From:    "SERVER",
			To:      string(rune(client.ConnectAt)),
			Content: string(client.Json()),
		}

		client.Conn.SendWithMessageType(msg.String(), hfs.BINARY)

		if room != "" {
			err := roomLoop(room, &client)
			if err != nil {
				slog.Error("Error while room loop", "ERROR", err.Error())

				// sending leave message
				res := bsserver.Message{
					Type:    bsserver.LEAVE,
					From:    "SERVER",
					To:      room,
					Content: client.Name + " has left the room",
				}

				websocket.BroadcastWithMessageType(room, res.String(), hfs.BINARY, true)

				// remove from room
				r, _ := websocket.Rooms.Load(room)
				r.(*hfs.Room).RemoveClient(client.Conn)
			}

		} else if private != "" {
			err := privateLoop(private, &client)

			if err != nil {
				slog.Error("Error while room loop", "ERROR", err.Error())
			}
		} else {
			slog.Error("Error while get args", "ERROR", "Room or private is required")
			return hfs.NewTextResponse("Room or private is required")
		}

		slog.Info("Delete client", "Name", client.Name)
		clients.Delete(client.Name)

		// check if room is empty
		currentRoom, _ := websocket.Rooms.Load(room)

		if room != "" && len(currentRoom.(*hfs.Room).Client) == 0 {
			websocket.Rooms.Delete(room)
			rooms.Delete(room)
		}

		return hfs.NewTextResponse("OK")
	})

	err := server.ListenAndServe()
	if err != nil {
		panic(err)
	}
}

func roomLoop(room string, client *bsserver.Client) error {
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
			client.Conn.Close(err.Error(), hfs.STATUS_CLOSE_NO_STATUS)
			return err
		}

		msg := bsserver.NewMessage()
		err = msg.Parse(data)
		if err != nil {
			slog.Error("Error while parsing data", "ERROR", err.Error())
		}

		switch msg.Type {
		case bsserver.MESSAGE:
			websocket.BroadcastWithMessageType(room, msg.String(), hfs.BINARY, true)
		case bsserver.JOIN:
			res := bsserver.Message{
				Type:    bsserver.JOIN,
				From:    "SERVER",
				To:      room,
				Content: client.Name + " has joined the room",
			}

			websocket.BroadcastWithMessageType(room, res.String(), hfs.BINARY, true)
		case bsserver.LEAVE:
			res := bsserver.Message{
				Type:    bsserver.LEAVE,
				From:    "SERVER",
				To:      room,
				Content: client.Name + " has left the room",
			}

			websocket.BroadcastWithMessageType(room, res.String(), hfs.BINARY, true)
		case bsserver.TYPING:
			res := bsserver.Message{
				Type:    bsserver.TYPING,
				From:    client.Name,
				To:      room,
				Content: client.Name + "is typing...",
			}

			websocket.BroadcastWithMessageType(room, res.String(), hfs.BINARY, true)
		case bsserver.STOP_TYPING:
			res := bsserver.Message{
				Type:    bsserver.STOP_TYPING,
				From:    client.Name,
				To:      room,
				Content: client.Name + "stop typing...",
			}
			websocket.BroadcastWithMessageType(room, res.String(), hfs.BINARY, true)
		}
	}
}

func privateLoop(private string, client *bsserver.Client) error {
	// check if client is exist
	maxRetries := 5
	var to *bsserver.Client

	for i := 0; i < maxRetries; i++ {
		if toVal, ok := clients.Load(private); ok {
			to = toVal.(*bsserver.Client)
			break
		}
		time.Sleep(time.Second) // Wait before retry
	}

	if to == nil {
		return errors.New("Client not found after retries")
	}

	for {
		data, err := client.Conn.Read()
		if err != nil {
			if !(err.Error() == "Error reading message : EOF") {
				client.Conn.Close(err.Error(), hfs.STATUS_CLOSE_NO_STATUS)
				return err
			}
		}

		msg := bsserver.NewMessage()
		err = msg.Parse(data)
		if err != nil {
			slog.Error("Error while parsing data", "ERROR", err.Error())
		}

		log.Println("MSG: ", msg)

		switch msg.Type {
		case bsserver.MESSAGE:
			to.Conn.SendWithMessageType(msg.String(), hfs.BINARY)
		case bsserver.JOIN:
			res := bsserver.Message{
				Type:    bsserver.JOIN,
				From:    "SERVER",
				To:      client.Name,
				Content: client.Name + " has joined the room",
			}

			to.Conn.SendWithMessageType(res.String(), hfs.BINARY)
		case bsserver.LEAVE:
			res := bsserver.Message{
				Type:    bsserver.LEAVE,
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + " has left the room",
			}

			to.Conn.SendWithMessageType(res.String(), hfs.BINARY)
		case bsserver.TYPING:
			res := bsserver.Message{
				Type:    bsserver.TYPING,
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + "is typing...",
			}

			to.Conn.SendWithMessageType(res.String(), hfs.BINARY)
		case bsserver.STOP_TYPING:
			res := bsserver.Message{
				Type:    bsserver.STOP_TYPING,
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + "stop typing...",
			}

			to.Conn.SendWithMessageType(res.String(), hfs.BINARY)
		}
	}
}
