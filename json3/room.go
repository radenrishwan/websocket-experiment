package json3

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Room struct {
	Connections sync.Map // Changed value type to *Client
	Broadcast   chan []byte
	Register    chan *websocket.Conn
	Unregister  chan *websocket.Conn
}

func NewRoom() *Room {
	return &Room{
		Connections: sync.Map{},
		Broadcast:   make(chan []byte),
		Register:    make(chan *websocket.Conn),
		Unregister:  make(chan *websocket.Conn),
	}
}

func (r *Room) GetClient(name string) *Client {
	if client, ok := r.Connections.Load(name); ok {
		return client.(*Client)
	}

	return nil
}

func (r *Room) RemoveClient(name string) {
	if client, ok := r.Connections.Load(name); ok {
		r.Connections.Delete(client)
	}
}

func (r *Room) Run() {
	for {
		select {
		case message := <-r.Broadcast:
			r.Connections.Range(func(key, value interface{}) bool {
				client := value.(*Client)
				select {
				case client.Send <- message:
				default:
					r.RemoveClient(client.Name)
					close(client.Send)
				}
				return true
			})
		}
	}
}

func (r *Room) GetUsers() []string {
	users := []string{}
	r.Connections.Range(func(key, value interface{}) bool {
		client := value.(*Client)
		users = append(users, client.Name)
		return true
	})
	return users
}
