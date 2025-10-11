package user

import (
	"github.com/ajlaz/checkmAIt/server/db/store/postgres/users"
	"github.com/ajlaz/checkmAIt/server/model"
)

type ServiceInterface interface {
	GetUserByID(id string) (*model.User, error)
	CreateUser(username, email, password string) (*model.User, error)
	AuthenticateUser(email, password string) (*model.User, error)
}

type Service struct {
	userStore users.StoreInterface
}

func NewService(userStore users.StoreInterface) ServiceInterface {
	return &Service{
		userStore: userStore,
	}
}
