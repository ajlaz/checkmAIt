package user

import "github.com/ajlaz/checkmAIt/server/db/store/postgres/users"

type ServiceInterface interface {
}

type Service struct {
	userStore users.StoreInterface
}

func NewService(userStore users.StoreInterface) *Service {
	return &Service{
		userStore: userStore,
	}
}
