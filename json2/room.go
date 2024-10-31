package jsonserver2

import (
	"log/slog"
	"net"
	"sync"

	"github.com/devchat-ai/gopool"
	"github.com/gobwas/ws/wsutil"
)

type Room struct {
	pool gopool.GoPool
	conn sync.Map
}

func NewRoom() Room {
	pool := gopool.NewGoPool(
		5,
		gopool.WithMinWorkers(1),
		gopool.WithErrorCallback(func(err error) {
			slog.Info("pool error", "err", err)
		}),
	)

	return Room{
		conn: sync.Map{},
		pool: pool,
	}
}

func (b *Room) Add(name string, conn *net.Conn) {
	b.conn.Store(name, conn)
}

func (b *Room) Remove(name string) {
	b.conn.Delete(name)
}

func (b *Room) Broadcast(msg []byte) {
	b.conn.Range(func(key, value interface{}) bool {
		b.pool.AddTask(func() (interface{}, error) {
			conn := *value.(*net.Conn)
			err := wsutil.WriteServerText(conn, msg)
			if err != nil {
				return nil, err
			}

			return nil, nil
		})

		return true
	})
}

func (b *Room) Close() {
	b.conn.Range(func(key, value interface{}) bool {
		conn := *value.(*net.Conn)

		err := conn.Close()
		if err != nil {
			slog.Info("close error", "err", err)
		}

		return true
	})

	b.pool.Release()
}

func (b *Room) List() []string {
	var r []string

	b.conn.Range(func(key, value any) bool {
		r = append(r, key.(string))
		return true
	})

	return r
}
