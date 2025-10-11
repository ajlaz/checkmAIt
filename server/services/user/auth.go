package user

import (
	"errors"

	"github.com/ajlaz/checkmAIt/server/model"
	"golang.org/x/crypto/bcrypt"
)

// CreateUser creates a new user with the provided credentials
func (s *Service) CreateUser(username, email, password string) (*model.User, error) {
	// Check if user with email already exists
	existingUser, err := s.userStore.GetUserByEmail(email)
	if err == nil && existingUser != nil {
		return nil, errors.New("email already in use")
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user, err := s.userStore.CreateUser(&model.User{
		Username: username,
		Email:    email,
		Password: string(hashedPassword),
	})

	return user, err
}

// AuthenticateUser verifies user credentials and returns the user if valid
func (s *Service) AuthenticateUser(email, password string) (*model.User, error) {
	// Get user by email
	user, err := s.userStore.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid password")
	}

	return user, nil
}
