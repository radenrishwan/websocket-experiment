package json3

import (
	"fmt"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn *websocket.Conn
	Name string
	Room string
	Send chan []byte
}

var clientNames = make(map[string]bool)

func NewClient(conn *websocket.Conn, name string, room string) *Client {
	if name == "" {
		name = fmt.Sprintf("user_%d", time.Now().UnixNano())
	}

	// Check if name exists
	for clientNames[name] {
		name = fmt.Sprintf("user_%d", time.Now().UnixNano())
	}
	clientNames[name] = true

	return &Client{
		Conn: conn,
		Name: name,
		Room: room,
		Send: make(chan []byte, 256),
	}
}
