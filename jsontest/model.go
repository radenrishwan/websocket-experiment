package jsontest

import "encoding/json"

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
