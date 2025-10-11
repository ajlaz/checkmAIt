package services

import (
	"github.com/ajlaz/checkmAIt/server/db/store/postgres/users"
	"github.com/ajlaz/checkmAIt/server/services/engine"
	"github.com/ajlaz/checkmAIt/server/services/matchmaking"
	"github.com/ajlaz/checkmAIt/server/services/user"
)

// Define all services here
type Services struct {
	UserService        user.ServiceInterface
	MatchmakingService matchmaking.ServiceInterface
	EngineService      engine.ServiceInterface
}

func NewServices(userStore users.StoreInterface, engineURL string) *Services {
	userService := user.NewService(userStore)
	engineService := engine.NewService(engineURL)
	matchmakingService := matchmaking.NewService(engineService)
	return &Services{
		UserService:        userService,
		MatchmakingService: matchmakingService,
		EngineService:      engineService,
	}
}
