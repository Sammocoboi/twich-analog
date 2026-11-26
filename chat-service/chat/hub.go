package chat

import "sync"

type Hub struct {
	mu    sync.RWMutex
	rooms map[string]map[*Client]bool
}

func NewHub() *Hub {
	return &Hub{rooms: make(map[string]map[*Client]bool)}
}

func (h *Hub) Join(room string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.rooms[room] == nil {
		h.rooms[room] = make(map[*Client]bool)
	}
	h.rooms[room][c] = true
}

func (h *Hub) Leave(room string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.rooms[room] == nil {
		return
	}
	delete(h.rooms[room], c)
	if len(h.rooms[room]) == 0 {
		delete(h.rooms, room)
	}
}

func (h *Hub) Broadcast(room string, msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.rooms[room] {
		select {
		case c.send <- msg:
		default:
			// клиент не успевает читать — пропускаем сообщение
		}
	}
}

func (h *Hub) Online(room string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms[room])
}
