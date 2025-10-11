package user

import "github.com/ajlaz/checkmAIt/server/models"

func (s *Service) GetUserByID(id int64) (*models.User, error) {

	return s.userStore.GetUserByID(id)
}
