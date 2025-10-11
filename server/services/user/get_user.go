package user

import "github.com/ajlaz/checkmAIt/server/model"

func (s *Service) GetUserByID(id string) (*model.User, error) {

	return s.userStore.GetUserByID(id)
}
