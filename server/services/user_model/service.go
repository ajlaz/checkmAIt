package user_model

import (
	"github.com/ajlaz/checkmAIt/server/db/store/postgres/models"
	"github.com/ajlaz/checkmAIt/server/model"
)

// ServiceInterface defines the contract for user model service
type ServiceInterface interface {
	CreateModel(userID, name, modelCode string) (*model.UserModel, error)
	GetModelByID(modelID string) (*model.UserModel, error)
	GetModelsByUserID(userID string) ([]*model.UserModel, error)
	UpdateModel(modelID, name, modelCode string) (*model.UserModel, error)
	DeleteModel(modelID string) error
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
