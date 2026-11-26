package main

import (
	"log"
	"net/http"

	"streamapp/chat"
	"streamapp/config"
)

func main() {
	cfg := config.Load()
	hub := chat.NewHub()
	handler := chat.NewHandler(hub, chat.HandlerConfig{
		JWTSecret: cfg.JWTSecret,
		JWTAlg:    cfg.JWTAlg,
	})

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", handler.ServeWS)
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.Handle("/", http.FileServer(http.Dir("./web")))

	log.Printf("chat-service listening on %s", cfg.ServerAddr)
	if err := http.ListenAndServe(cfg.ServerAddr, mux); err != nil {
		log.Fatal(err)
	}
}
