package users

import (
	"github.com/ajlaz/checkmAIt/server/model"
	"github.com/jmoiron/sqlx"
)

type StoreInterface interface {
	GetUserByID(id string) (*model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	CreateUser(user *model.User) (*model.User, error)
}

type Store struct {
	*sqlx.DB
}

func NewStore(db *sqlx.DB) StoreInterface {
	return &Store{
		DB: db,
	}
}
