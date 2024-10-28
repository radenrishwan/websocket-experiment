package main

import (
	"encoding/json"
	"errors"
	"log/slog"
	"strconv"
	"time"

	"github.com/radenrishwan/hfs"
)

type MessageType int

const (
	MESSAGE     MessageType = iota
	JOIN        MessageType = iota
	LEAVE       MessageType = iota
	TYPING      MessageType = iota
	STOP_TYPING MessageType = iota
)

type Message struct {
	Type    MessageType `json:"type"`
	From    string      `json:"from"`
	To      string      `json:"to"`
	Content string      `json:"content"`
}

func NewMessage() *Message {
	return &Message{}
}

func (m *Message) Parse(msg []byte) error {
	return json.Unmarshal(msg, m)
}

func (m Message) String() string {
	result, _ := json.Marshal(m)

	return string(result)
}

type Client struct {
	Name      string
	Conn      *hfs.Client
	ConnectAt int64
}

func NewClient(name string, conn *hfs.Client) Client {
	return Client{
		Name:      name,
		Conn:      conn,
		ConnectAt: time.Now().UnixMilli(),
	}
}

var websocket = hfs.NewWebsocket(nil)
var clients = make(map[int64]*Client)
var rooms = make(map[string][]bool)

func main() {
	server := hfs.NewServer(":8080", hfs.Option{})

	server.ServeFile("/", "public/index.html")

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
		client := NewClient(name, &conn)
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

func roomLoop(room string, client *Client) error {
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

		msg := NewMessage()
		err = msg.Parse(data)
		if err != nil {
			slog.Error("Error while parsing data", "ERROR", err.Error())
		}

		slog.Info("MSG INCOMMING", "MSG", msg.String())

		switch msg.Type {
		case MESSAGE:
			websocket.Broadcast(room, msg.String(), true)
		case JOIN:
			res := Message{
				Type:    JOIN,
				From:    "SERVER",
				To:      room,
				Content: client.Name + " has joined the room",
			}

			websocket.Broadcast(room, res.String(), true)
		case LEAVE:
			res := Message{
				Type:    LEAVE,
				From:    "SERVER",
				To:      room,
				Content: client.Name + " has left the room",
			}

			websocket.Broadcast(room, res.String(), true)
		case TYPING:
			res := Message{
				Type:    TYPING,
				From:    client.Name,
				To:      room,
				Content: client.Name + "is typing...",
			}

			websocket.Broadcast(room, res.String(), true)
		case STOP_TYPING:
			res := Message{
				Type:    STOP_TYPING,
				From:    client.Name,
				To:      room,
				Content: client.Name + "stop typing...",
			}
			websocket.Broadcast(room, res.String(), true)
		}
	}
}

func privateLoop(private int64, client *Client) error {
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

		msg := NewMessage()
		err = msg.Parse(data)
		if err != nil {
			slog.Error("Error while parsing data", "ERROR", err.Error())
		}

		switch msg.Type {
		case MESSAGE:
			to.Conn.Send(msg.String())
		case JOIN:
			res := Message{
				Type:    JOIN,
				From:    "SERVER",
				To:      client.Name,
				Content: client.Name + " has joined the room",
			}

			to.Conn.Send(res.String())
		case LEAVE:
			res := Message{
				Type:    LEAVE,
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + " has left the room",
			}

			to.Conn.Send(res.String())
		case TYPING:
			res := Message{
				Type:    TYPING,
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + "is typing...",
			}

			to.Conn.Send(res.String())
		case STOP_TYPING:
			res := Message{
				Type:    STOP_TYPING,
				From:    client.Name,
				To:      to.Name,
				Content: client.Name + "stop typing...",
			}

			to.Conn.Send(res.String())
		}
	}
}
