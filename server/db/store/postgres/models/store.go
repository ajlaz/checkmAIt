package models

import (
	"github.com/ajlaz/checkmAIt/server/model"
	"github.com/jmoiron/sqlx"
)

// StoreInterface defines the contract for user model data access
type StoreInterface interface {
	CreateModel(model *model.UserModel) (*model.UserModel, error)
	GetModelByID(id string) (*model.UserModel, error)
	GetModelsByUserID(userID string) ([]*model.UserModel, error)
	UpdateModel(model *model.UserModel) (*model.UserModel, error)
	DeleteModel(id string) error
}

// Store implements the user model data access
type Store struct {
	*sqlx.DB
}

// NewStore creates a new model store instance
func NewStore(db *sqlx.DB) StoreInterface {
	return &Store{
		DB: db,
	}
}
