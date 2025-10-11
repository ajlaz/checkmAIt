package services

import (
	"github.com/ajlaz/checkmAIt/server/db/store/postgres/users"
	"github.com/ajlaz/checkmAIt/server/services/user"
)

// Define all services here
type Services struct {
	UserService user.ServiceInterface
}

func NewServices(userStore users.StoreInterface) *Services {
	userService := user.NewService(userStore)
	return &Services{
		UserService: userService,
	}
}
