package bsserver

import (
	"github.com/vmihailenco/msgpack/v5"
)

type MessageType int

const (
	MESSAGE MessageType = iota
	JOIN
	LEAVE
	TYPING
	STOP_TYPING
)

type Message struct {
	Type    MessageType `msgpack:"type"`
	From    string      `msgpack:"from"`
	To      string      `msgpack:"to"`
	Content string      `msgpack:"content"`
}

func NewMessage() *Message {
	return &Message{}
}

func (m *Message) Parse(msg []byte) error {
	err := msgpack.Unmarshal(msg, &m)

	return err
}

func (m Message) String() string {
	result, _ := msgpack.Marshal(m)

	return string(result)
}
