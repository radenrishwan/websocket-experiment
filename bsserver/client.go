package bsserver

import (
	"encoding/json"
	"time"

	"github.com/radenrishwan/hfs"
)

type Client struct {
	Name      string      `json:"name"`
	Conn      *hfs.Client `json:"-"`
	ConnectAt int64       `json:"connect_at"`
}

func NewClient(name string, conn *hfs.Client) Client {
	return Client{
		Name:      name,
		Conn:      conn,
		ConnectAt: time.Now().UnixMilli(),
	}
}

func (c Client) Json() []byte {
	res, _ := json.Marshal(c)

	return res
}
