package config

import "github.com/joho/godotenv"

type Config struct {
	Postgres PostgresConfig
	HTTP     HTTPConfig
	Auth     AuthConfig
	Engine   EngineConfig
}

var env map[string]string

func LoadConfig() (*Config, error) {

	env, err := godotenv.Read()
	if err != nil {
		return nil, err
	}

	config := &Config{
		Postgres: PostgresConfig{
			User:     env["POSTGRES_USER"],
			Password: env["POSTGRES_PASSWORD"],
			DB:       env["POSTGRES_DB"],
			Port:     env["POSTGRES_PORT"],
		},
		HTTP: HTTPConfig{
			Host: env["HTTP_HOST"],
			Port: env["HTTP_PORT"],
		},
		Auth: AuthConfig{
			JWTSecret: env["JWT_SECRET"],
		},
		Engine: EngineConfig{
			URL: env["ENGINE_URL"],
		},
	}

	return config, nil
}

type PostgresConfig struct {
	User     string
	Password string
	DB       string
	Port     string
}

type HTTPConfig struct {
	Host string
	Port string
}

type AuthConfig struct {
	JWTSecret string
}

type EngineConfig struct {
	URL string
}
