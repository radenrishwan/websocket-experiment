package main

import (
	"jsontest"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	maxConnections  = 200
	batchSize       = 50
	reconnectDelay  = 5 * time.Second
	messageInterval = 1 * time.Second
)

var lorem = `"Lorem" is often the beginning of "Lorem ipsum," a placeholder text commonly used in design, publishing, and web development. It's derived from Latin and is used to demonstrate the visual form of a document or typeface without relying on meaningful content.`

func main() {
	room := "sample-1"
	semaphore := make(chan struct{}, batchSize)
	var wg sync.WaitGroup

	for i := 0; i < maxConnections; i++ {
		wg.Add(1)
		username := "user-" + strconv.Itoa(i)

		go func(username string) {
			defer wg.Done()

			// Rate limiting
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Connect with retry
			var conn *websocket.Conn
			for attempts := 0; attempts < 3; attempts++ {
				uri := url.URL{
					Scheme:   "ws",
					Host:     "localhost:8083",
					Path:     "/ws",
					RawQuery: "name=" + username + "&room=" + room,
				}

				dial := websocket.Dialer{
					Proxy:            http.ProxyFromEnvironment,
					HandshakeTimeout: 30 * time.Second,
					WriteBufferSize:  1024,
					ReadBufferSize:   1024,
				}

				var err error
				conn, _, err = dial.Dial(uri.String(), nil)
				if err != nil {
					log.Printf("Connection attempt %d failed for %s: %v\n", attempts+1, username, err)
					time.Sleep(reconnectDelay)
					continue
				}
				break
			}

			if conn == nil {
				log.Printf("Failed to establish connection for %s after 3 attempts\n", username)
				return
			}

			defer conn.Close()

			// Set connection parameters
			conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			conn.SetReadLimit(512)
			conn.SetPongHandler(func(string) error {
				return conn.SetReadDeadline(time.Now().Add(60 * time.Second))
			})

			// Message sending loop
			ticker := time.NewTicker(messageInterval)
			defer ticker.Stop()

			for {
				select {
				case <-ticker.C:
					msg := jsontest.Message{
						Type:    jsontest.MESSAGE,
						From:    username,
						To:      room,
						Content: lorem,
					}

					err := conn.WriteMessage(websocket.TextMessage, []byte(msg.String()))
					if err != nil {
						log.Printf("Write error for %s: %v\n", username, err)
						return
					}
				}
			}
		}(username)

		// Small delay between connection attempts
		time.Sleep(100 * time.Millisecond)
	}

	wg.Wait()
}
