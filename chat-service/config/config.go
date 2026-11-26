package config

import "os"

type Config struct {
	JWTSecret  string
	JWTAlg     string
	ServerAddr string
}

func Load() *Config {
	return &Config{
		JWTSecret:  getEnv("SECRET_KEY", "change-me"),
		JWTAlg:     getEnv("ALGORITHM", "HS256"),
		ServerAddr: getEnv("SERVER_ADDR", ":8080"),
	}
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
