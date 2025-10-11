package users

import (
	"github.com/ajlaz/checkmAIt/server/models"
	"github.com/jmoiron/sqlx"
)

type StoreInterface interface {
	GetUserByID(id int64) (*models.User, error)
}

type Store struct {
	*sqlx.DB
}

func NewStore(db *sqlx.DB) StoreInterface {
	return &Store{
		DB: db,
	}
}
