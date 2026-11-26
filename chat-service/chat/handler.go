package chat

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"streamapp/auth"

	"github.com/gorilla/websocket"
)

type HandlerConfig struct {
	JWTSecret string
	JWTAlg    string
}

type ChatMessage struct {
	UserID    int64  `json:"user_id"`
	Room      string `json:"room"`
	Text      string `json:"text"`
	Timestamp int64  `json:"ts"`
}

type Handler struct {
	hub      *Hub
	cfg      HandlerConfig
	upgrader websocket.Upgrader
}

func NewHandler(hub *Hub, cfg HandlerConfig) *Handler {
	return &Handler{
		hub: hub,
		cfg: cfg,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin:     func(r *http.Request) bool { return true },
		},
	}
}

func (h *Handler) ServeWS(w http.ResponseWriter, r *http.Request) {
	// JWT можно передать либо в ?token=, либо в Authorization: Bearer ...
	tokenStr := r.URL.Query().Get("token")
	if tokenStr == "" {
		tokenStr = auth.ExtractBearer(r.Header.Get("Authorization"))
	}
	if tokenStr == "" {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}

	_, userID, err := auth.VerifyToken(tokenStr, h.cfg.JWTSecret, h.cfg.JWTAlg)
	if err != nil {
		log.Printf("jwt verification failed: %v", err)
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}

	room := r.URL.Query().Get("room")
	if room == "" {
		room = "main"
	}

	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade: %v", err)
		return
	}

	client := NewClient(h.hub, conn, room, userID)
	h.hub.Join(room, client)

	go client.WritePump()
	go client.ReadPump(func(uid int64, room string, payload []byte) {
		var in struct {
			Text string `json:"text"`
		}
		if err := json.Unmarshal(payload, &in); err != nil {
			return
		}
		if len(in.Text) == 0 || len(in.Text) > 500 {
			return
		}
		out, _ := json.Marshal(ChatMessage{
			UserID:    uid,
			Room:      room,
			Text:      in.Text,
			Timestamp: time.Now().Unix(),
		})
		h.hub.Broadcast(room, out)
	})
}
