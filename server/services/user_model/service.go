package user_model

import (
	"github.com/ajlaz/checkmAIt/server/db/store/postgres/models"
	"github.com/ajlaz/checkmAIt/server/model"
)

// ServiceInterface defines the contract for user model service
type ServiceInterface interface {
	CreateModel(userID int, name, modelCode string) (*model.UserModel, error)
	GetModelByID(modelID int) (*model.UserModel, error)
	GetModelsByUserID(userID int) ([]*model.UserModel, error)
	UpdateModel(modelID int, name, modelCode string) (*model.UserModel, error)
	DeleteModel(modelID int) error
}

// Service implements the user model service
type Service struct {
	modelStore models.StoreInterface
}

// NewService creates a new model service instance
func NewService(modelStore models.StoreInterface) ServiceInterface {
	return &Service{
		modelStore: modelStore,
	}
}
