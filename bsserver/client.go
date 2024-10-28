package bsserver

import (
	"time"

	"github.com/radenrishwan/hfs"
)

type Client struct {
	Name      string
	Conn      *hfs.Client
	ConnectAt int64
}

func NewClient(name string, conn *hfs.Client) Client {
	return Client{
		Name:      name,
		Conn:      conn,
		ConnectAt: time.Now().UnixMilli(),
	}
}
