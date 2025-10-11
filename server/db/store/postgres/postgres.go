package postgres

import (
	"log"

	"github.com/ajlaz/checkmAIt/server/config"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

const driver = "postgres"

func Connect(cfg *config.Config) *sqlx.DB {
	db, err := sqlx.Connect(driver, dsn(cfg))
	if err != nil {
		log.Fatalf("failed to connect to Postgres: %v", err)
	}
	return db
}

func dsn(cfg *config.Config) string {
	// modify this later for production use
	return "postgres://" + cfg.Postgres.User + ":" + cfg.Postgres.Password + "@localhost:" + cfg.Postgres.Port + "/" + cfg.Postgres.DB + "?sslmode=disable"
}
