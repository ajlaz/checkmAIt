package users

import "github.com/ajlaz/checkmAIt/server/models"

func (s *Store) GetUserByID(id int64) (*models.User, error) {
	var user models.User
	err := s.DB.Get(
		&user,
		"SELECT id, username, email, password FROM users WHERE id=$1",
		id,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
