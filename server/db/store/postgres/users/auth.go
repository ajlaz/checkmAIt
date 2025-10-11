package users

import (
	"database/sql"
	"errors"

	"github.com/ajlaz/checkmAIt/server/model"
)

// GetUserByEmail retrieves a user by email
func (s *Store) GetUserByEmail(email string) (*model.User, error) {
	var user model.User
	err := s.DB.Get(
		&user,
		"SELECT id, username, email, password_hash as password FROM users WHERE email=$1",
		email,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// CreateUser creates a new user
func (s *Store) CreateUser(user *model.User) (*model.User, error) {
	query := `
		INSERT INTO users (username, email, password_hash) 
		VALUES ($1, $2, $3) 
		RETURNING id, username, email, password_hash as password
	`

	var createdUser model.User
	err := s.DB.QueryRowx(
		query,
		user.Username,
		user.Email,
		user.Password,
	).StructScan(&createdUser)

	if err != nil {
		return nil, err
	}

	return &createdUser, nil
}
