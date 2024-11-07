package json3

import (
	"strings"
	"sync"
)

type Broadcaster struct {
	Rooms      sync.Map
	Register   chan *Client
	Unregister chan *Client
}

func NewBroadcaster() *Broadcaster {
	return &Broadcaster{
		Rooms:      sync.Map{},
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (b *Broadcaster) GetRoom(name string) *Room {
	if room, ok := b.Rooms.Load(name); ok {
		return room.(*Room)
	}

	return nil
}

func (b *Broadcaster) RemoveRoom(name string) {
	b.Rooms.Delete(name)
}

func (b *Broadcaster) List() []string {
	rooms := []string{}

	b.Rooms.Range(func(key, value any) bool {
		rooms = append(rooms, key.(string))
		return true
	})

	return rooms
}

func (b *Broadcaster) Run() {
    for {
        select {
        case client := <-b.Register:
            roomInterface, _ := b.Rooms.LoadOrStore(client.Room, NewRoom())
            room := roomInterface.(*Room)

            room.Connections.Store(client.Name, client)

            // Create user list update message
            usersMsg := Message{
                Type:    USERLIST,
                Content: strings.Join(room.GetUsers(), ","),
            }

            // Send both join notification and user list update
            joinMsg := Message{
                Type:    JOINROOM,
                From:    client.Name,
                Content: "joined the room",
            }

            room.Broadcast <- joinMsg.Bytes()
            room.Broadcast <- usersMsg.Bytes()

        case client := <-b.Unregister:
            if roomInterface, ok := b.Rooms.Load(client.Room); ok {
                room := roomInterface.(*Room)

                room.RemoveClient(client.Name)
                close(client.Send)

                empty := true
                room.Connections.Range(func(key, value interface{}) bool {
                    empty = false
                    return false
                })

                if empty {
                    b.RemoveRoom(client.Room)
                } else {
                    // Send both leave notification and updated user list
                    leaveMsg := Message{
                        Type:    LEAVEROOM,
                        From:    client.Name,
                        Content: "left the room",
                    }
                    usersMsg := Message{
                        Type:    USERLIST,
                        Content: strings.Join(room.GetUsers(), ","),
                    }

                    room.Broadcast <- leaveMsg.Bytes()
                    room.Broadcast <- usersMsg.Bytes()
                }
            }
        }
    }
}
