package main

import (
	"flag"
	"fmt"
	"jsontest"
	"log/slog"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

func generateMetrics(start time.Time) {
	end := time.Now()

	fmt.Println("Generating metrics from", start, "to", end)
}

var lorem = `"Lorem" is often the beginning of "Lorem ipsum," a placeholder text commonly used in design, publishing, and web development. It's derived from Latin and is used to demonstrate the visual form of a document or typeface without relying on meaningful content.`

var (
	roomCount = flag.Int("room", 0, "create room count")
	userCount = flag.Int("user", 0, "create user count for each room")
)

func main() {
	flag.Parse()

	defer generateMetrics(time.Now())
	var wg sync.WaitGroup
	for i := 0; i < *roomCount; i++ {
		room := fmt.Sprintf("%s-%d", "sample", i)

		fmt.Println("create room :", room)

		wg.Add(1)
		go createLoop(*userCount, func(index int, wg2 *sync.WaitGroup) {
			username := fmt.Sprintf("user-%d-%d", i, index)
			uri := url.URL{Scheme: "ws", Host: "localhost:8083", Path: "/ws", RawQuery: "name=" + username + "&room=" + room}
			slog.Info("Connecting to server", "URI", uri.String())

			fmt.Println("create user : ", username)

			createConnection(uri, room, username, func(conn *websocket.Conn, room, username string) {
				// sending message to room for every 1 second
				stop := make(chan bool)
				go runMessageInterval(5*time.Second, stop, func() error {
					msg := jsontest.Message{
						Type:    jsontest.MESSAGE,
						From:    username,
						To:      room,
						Content: lorem,
					}

					// fmt.Println("Sending message ....")
					err := conn.WriteMessage(websocket.TextMessage, []byte(msg.String()))
					if err != nil {
						slog.Error("Error while writing message", "ERROR", err.Error())

						return err
					}

					return nil
				})

				time.Sleep(30 * time.Second)

				stop <- true

				conn.Close()

				wg2.Done()
			})
		})
	}

	wg.Wait()
}

func createLoop(loop int, run func(index int, wg *sync.WaitGroup)) {
	var wg sync.WaitGroup
	for i := 0; i < loop; i++ {
		wg.Add(1)
		go run(i, &wg)
	}

	wg.Wait()
}

func createConnection(uri url.URL, room string, username string, callback func(conn *websocket.Conn, room string, username string)) {
	c, _, err := websocket.DefaultDialer.Dial(uri.String(), nil)
	if err != nil {
		slog.Error("Error while dialing to server", "ERROR", err.Error())

		return
	}

	defer c.Close()

	callback(c, room, username)
}

func runMessageInterval(interval time.Duration, stop chan bool, run ...func() error) {
	for {
		// send message
		for _, r := range run {
			err := r()

			if err != nil {
				break
			}
		}

		time.Sleep(interval)

		// if stop signal received, break the loop
		select {
		case <-stop:
			break
		default:
			continue
		}

	}
}
