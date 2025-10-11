package user_model

import (
	"errors"

	"github.com/ajlaz/checkmAIt/server/model"
)

// CreateModel creates a new chess model
func (s *Service) CreateModel(userID, name, modelCode string) (*model.UserModel, error) {
	// Validate the model code (you may want to add more specific validation)
	if modelCode == "" {
		return nil, errors.New("model code cannot be empty")
	}

	// Create a new model with default values
	newModel := model.NewUserModel(userID, name, modelCode)

	// Save the model to the database
	createdModel, err := s.modelStore.CreateModel(newModel)
	if err != nil {
		return nil, err
	}

	return createdModel, nil
}

// GetModelByID retrieves a model by its ID
func (s *Service) GetModelByID(modelID string) (*model.UserModel, error) {
	if modelID == "" {
		return nil, errors.New("model ID cannot be empty")
	}

	model, err := s.modelStore.GetModelByID(modelID)
	if err != nil {
		return nil, err
	}

	return model, nil
}

// GetModelsByUserID retrieves all models for a specific user
func (s *Service) GetModelsByUserID(userID string) ([]*model.UserModel, error) {
	if userID == "" {
		return nil, errors.New("user ID cannot be empty")
	}

	models, err := s.modelStore.GetModelsByUserID(userID)
	if err != nil {
		return nil, err
	}

	return models, nil
}

// UpdateModel updates an existing model
func (s *Service) UpdateModel(modelID, name, modelCode string) (*model.UserModel, error) {
	if modelID == "" {
		return nil, errors.New("model ID cannot be empty")
	}

	// Check if model exists
	existingModel, err := s.modelStore.GetModelByID(modelID)
	if err != nil {
		return nil, err
	}

	// Update the model fields
	if name != "" {
		existingModel.Name = name
	}
	if modelCode != "" {
		existingModel.Model = modelCode
	}

	// Save the updated model
	updatedModel, err := s.modelStore.UpdateModel(existingModel)
	if err != nil {
		return nil, err
	}

	return updatedModel, nil
}

// DeleteModel deletes a model by ID
func (s *Service) DeleteModel(modelID string) error {
	if modelID == "" {
		return errors.New("model ID cannot be empty")
	}

	return s.modelStore.DeleteModel(modelID)
}
