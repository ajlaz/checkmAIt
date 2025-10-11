package server

import (
	"github.com/ajlaz/checkmAIt/server/config"
	"github.com/ajlaz/checkmAIt/server/db/store/postgres"
	"github.com/ajlaz/checkmAIt/server/db/store/postgres/users"
)

type store struct {
	user_store users.StoreInterface
}

func initStore(cfg *config.Config) *store {
	db := postgres.Connect(cfg)

	return &store{
		user_store: users.NewStore(db),
	}
}
