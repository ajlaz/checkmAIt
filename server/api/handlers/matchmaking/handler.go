package matchmaking

import (
	"github.com/ajlaz/checkmAIt/server/api"
	"github.com/ajlaz/checkmAIt/server/services"
)

type Handler struct {
	api *api.API
	svc services.Services
}

func NewHandler(api *api.API, svc services.Services) *Handler {
	h := &Handler{

		api: api,
		svc: svc,
	}

	h.registerRoutes()
	return h
}

func (h *Handler) registerRoutes() {
	matchmakingGroup := h.api.Group("/matchmaking")
	matchmakingGroup.Use(api.JWTAuthMiddleware(h.api.GetJWTSecret()))
	{
		matchmakingGroup.POST("/join", h.JoinQueue)
		matchmakingGroup.POST("/leave", h.LeaveQueue)
		matchmakingGroup.GET("/status", h.GetQueueStatus)
		matchmakingGroup.POST("/cleanup/match/:matchId", h.CleanupMatch)
		matchmakingGroup.POST("/cleanup/player/:userId", h.CleanupPlayer)
	}
}
