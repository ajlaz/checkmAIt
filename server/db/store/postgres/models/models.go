package models

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/ajlaz/checkmAIt/server/model"
)

// CreateModel inserts a new model into the database
func (s *Store) CreateModel(m *model.UserModel) (*model.UserModel, error) {
	query := `
		INSERT INTO user_models (user_id, name, model, rating)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, name, model, rating
	`

	var createdModel model.UserModel
	err := s.DB.QueryRowx(
		query,
		m.UserID,
		m.Name,
		m.Model,
		m.Rating,
	).StructScan(&createdModel)

	if err != nil {
		return nil, fmt.Errorf("failed to create model: %w", err)
	}

	return &createdModel, nil
}

// GetModelByID retrieves a model by its ID
func (s *Store) GetModelByID(id int) (*model.UserModel, error) {
	query := `
		SELECT id, user_id, name, model, rating 
		FROM user_models 
		WHERE id = $1
	`

	var userModel model.UserModel
	err := s.DB.Get(&userModel, query, id)

	if err == sql.ErrNoRows {
		return nil, errors.New("model not found")
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get model: %w", err)
	}

	return &userModel, nil
}

// GetModelsByUserID retrieves all models for a specific user
func (s *Store) GetModelsByUserID(userID int) ([]*model.UserModel, error) {
	query := `
		SELECT id, user_id, name, model, rating 
		FROM user_models 
		WHERE user_id = $1
	`

	var models []*model.UserModel
	err := s.DB.Select(&models, query, userID)

	if err != sql.ErrNoRows && err != nil {
		// Return error only for actual DB errors, not for "no rows" cases
		return nil, fmt.Errorf("failed to get models for user: %w", err)
	}

	// If no models found, return an empty slice (not nil)
	if models == nil {
		return []*model.UserModel{}, nil
	}

	return models, nil
}

// UpdateModel updates an existing model
func (s *Store) UpdateModel(m *model.UserModel) (*model.UserModel, error) {
	query := `
		UPDATE user_models 
		SET name = $2, model = $3, rating = $4
		WHERE id = $1
		RETURNING id, user_id, name, model, rating
	`

	var updatedModel model.UserModel
	err := s.DB.QueryRowx(
		query,
		m.ID,
		m.Name,
		m.Model,
		m.Rating,
	).StructScan(&updatedModel)

	if err == sql.ErrNoRows {
		return nil, errors.New("model not found")
	}

	if err != nil {
		return nil, fmt.Errorf("failed to update model: %w", err)
	}

	return &updatedModel, nil
}

// DeleteModel deletes a model by ID
func (s *Store) DeleteModel(id int) error {
	query := `DELETE FROM user_models WHERE id = $1`

	result, err := s.DB.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete model: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("model not found")
	}

	return nil
}
