package pbserver

import (
	"pbserver/model"

	"google.golang.org/protobuf/proto"
)

type MessageType int32

const (
	MESSAGE MessageType = iota
	JOIN
	LEAVE
	TYPING
	STOP_TYPING
)

func NewMessage(msg *model.Message) []byte {
	data, _ := proto.Marshal(msg)

	return data
}
