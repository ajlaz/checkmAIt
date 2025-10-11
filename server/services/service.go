package services

import (
	"github.com/ajlaz/checkmAIt/server/db/store/postgres/models"
	"github.com/ajlaz/checkmAIt/server/db/store/postgres/users"
	"github.com/ajlaz/checkmAIt/server/services/engine"
	"github.com/ajlaz/checkmAIt/server/services/matchmaking"
	"github.com/ajlaz/checkmAIt/server/services/user"
	"github.com/ajlaz/checkmAIt/server/services/user_model"
)

// Define all services here
type Services struct {
	UserService        user.ServiceInterface
	MatchmakingService matchmaking.ServiceInterface
	ModelService       user_model.ServiceInterface
	EngineService      engine.ServiceInterface
}

func NewServices(userStore users.StoreInterface, modelStore models.StoreInterface, engineURL string) *Services {
	userService := user.NewService(userStore)
	engineService := engine.NewService(engineURL)
	matchmakingService := matchmaking.NewService(engineService)
	modelService := user_model.NewService(modelStore)
	return &Services{
		UserService:        userService,
		MatchmakingService: matchmakingService,
		EngineService:      engineService,
		ModelService:       modelService,
	}
}
