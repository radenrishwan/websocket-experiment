package jsonserver2

import (
	"encoding/json"
	"net/http"
)

func WriteJson(w http.ResponseWriter, data interface{}) {
	res, _ := json.Marshal(data)
	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}
