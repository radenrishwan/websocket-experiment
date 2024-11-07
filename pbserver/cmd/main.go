package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"pbserver"
	"pbserver/model"
	"strconv"
	"sync"
	"time"

	"github.com/radenrishwan/hfs"
	"google.golang.org/protobuf/proto"
)

var websocket = hfs.NewWebsocket(nil)
var clients sync.Map
var rooms sync.Map

func main() {
	server := hfs.NewServer(":8083", hfs.Option{})

	server.ServeFile("/", "public/index.html")
	server.ServeDir("/pb", "model/")

	server.Handle("/api/clients", func(r hfs.Request) *hfs.Response {
		type cl struct {
			Id        string `json:"id"`
			Name      string `json:"name"`
			ConnectAt int64  `json:"connect_at"`
		}

		var result []cl
		clients.Range(func(key, value interface{}) bool {
			v := value.(*pbserver.Client)
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
		client := pbserver.NewClient(name, &conn)
		clients.Store(client.Name, &client)

		room := r.GetArgs("room")
		private := r.GetArgs("private")

		// send user data
		msg := model.Message{
			Type:    int32(pbserver.MESSAGE),
			From:    "SERVER",
			To:      string(rune(client.ConnectAt)),
			Content: string(client.Json()),
		}

		client.Conn.Send(string(pbserver.NewMessage(&msg)))

		if room != "" {
			err := roomLoop(room, &client)
			if err != nil {
				slog.Error("Error while room loop", "ERROR", err.Error())

				// sending leave message
				res := model.Message{
					Type:    int32(pbserver.LEAVE),
					From:    "SERVER",
					To:      room,
					Content: client.Name + " has left the room",
				}

				websocket.Broadcast(room, res.String(), true)

				// remove from room
				r, _ := websocket.Rooms.Load(room)
				r.(*hfs.Room).RemoveClient(client.Conn)
			}
		} else if private != "" {
			err := privateLoop(private, &client)

			if err != nil {
				slog.Error("Error while private loop", "ERROR", err.Error())
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

func roomLoop(room string, client *pbserver.Client) error {
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
			fmt.Println("ERR: ", err.Error())
			if !(err.Error() == "Error reading message : EOF") {
				client.Conn.Close(err.Error(), hfs.STATUS_CLOSE_NO_STATUS)
				return err
			}
		}

		msg := model.Message{}
		err = proto.Unmarshal(data, &msg)
		if err != nil {
			client.Conn.Close(err.Error(), hfs.STATUS_CLOSE_NO_STATUS)
			slog.Error("Error while parsing data", "ERROR", err.Error())
		}

		// slog.Info("MSG INCOMMING", "MSG", msg.String())

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

func privateLoop(private string, client *pbserver.Client) error {
	// check if client is exist
	maxRetries := 5
	var to *pbserver.Client

	for i := 0; i < maxRetries; i++ {
		if toVal, ok := clients.Load(private); ok {
			to = toVal.(*pbserver.Client)
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
