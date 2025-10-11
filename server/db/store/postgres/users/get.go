package users

import (
	"database/sql"
	"errors"

	"github.com/ajlaz/checkmAIt/server/model"
)

func (s *Store) GetUserByID(id string) (*model.User, error) {
	var user model.User
	err := s.DB.Get(
		&user,
		"SELECT id, username, email, password_hash as password FROM users WHERE id=$1",
		id,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}

	if err != nil {
		return nil, err
	}

	return &user, nil
}
