package jsonserver2

import (
	"errors"
	"sync"
)

type Broadcaster struct {
	rooms sync.Map
}

func NewBroadcaster() Broadcaster {
	return Broadcaster{
		rooms: sync.Map{},
	}
}

func (b *Broadcaster) New(name string) {
	room := NewRoom()

	b.rooms.Store(name, &room)
}

func (b *Broadcaster) Get(name string) (*Room, error) {
	room, ok := b.rooms.Load(name)
	if !ok {
		return nil, errors.New("room not found")
	}

	return room.(*Room), nil
}

func (b *Broadcaster) Remove(name string) {
	b.rooms.Delete(name)
}

func (b *Broadcaster) List() []string {
	var r []string

	b.rooms.Range(func(key, value any) bool {
		r = append(r, key.(string))
		return true
	})

	return r
}
