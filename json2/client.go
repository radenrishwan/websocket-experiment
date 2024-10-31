package jsonserver2

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"time"

	"github.com/devchat-ai/gopool"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
)

type Client struct {
	Name      string    `json:"name"`
	Conn      *net.Conn `json:"-"`
	ConnectAt int64     `json:"connect_at"`
	pool      gopool.GoPool
}

func NewClient(name string, conn *net.Conn) Client {
	pool := gopool.NewGoPool(
		5,
		gopool.WithMinWorkers(1),
		gopool.WithErrorCallback(func(err error) {
			slog.Info("pool error", "err", err)
		}),
	)

	return Client{
		Name:      name,
		Conn:      conn,
		ConnectAt: time.Now().UnixMilli(),
		pool:      pool,
	}
}

func (c Client) Json() []byte {
	res, _ := json.Marshal(c)

	return res
}

func (c *Client) ReadPool(room *Room, b *Broadcaster, roomName string, clientName string) error {
	for {
		raw, op, err := wsutil.ReadClientData(*c.Conn)
		if err != nil {
			(*c.Conn).Close()

			// clean connection from room
			room.Remove(clientName)

			leaveMsg := Message{
				Type:    LEAVE,
				From:    "SERVER",
				To:      roomName,
				Content: clientName + " leave room",
			}

			room.Broadcast(leaveMsg.Bytes())

			if len(room.List()) == 0 {
				b.Remove(roomName)
			}

			return err
		}

		if op == ws.OpClose {
			slog.Info("connection closed")
			break
		}

		c.pool.AddTask(func() (any, error) {
			msg := NewMessage()
			err = msg.Parse(raw)
			if err != nil {
				return nil, err
			}

			fmt.Println(msg)

			switch msg.Type {
			case MESSAGE:
				room.Broadcast(msg.Bytes())
			case LEAVE:
				newMsg := Message{
					Type:    LEAVE,
					From:    msg.From,
					To:      roomName,
					Content: msg.From + "leave room",
				}

				room.Broadcast(newMsg.Bytes())
			case JOIN:
				newMsg := Message{
					Type:    JOIN,
					From:    msg.From,
					To:      roomName,
					Content: msg.From + "join",
				}

				room.Broadcast(newMsg.Bytes())
			case TYPING:
				newMsg := Message{
					Type:    TYPING,
					From:    msg.From,
					To:      roomName,
					Content: msg.From + "is typing",
				}

				room.Broadcast(newMsg.Bytes())
			case STOP_TYPING:
				newMsg := Message{
					Type: STOP_TYPING,
					From: msg.From,
					To:   roomName,
				}

				room.Broadcast(newMsg.Bytes())
			}

			return nil, nil
		})
	}

	return nil
}
