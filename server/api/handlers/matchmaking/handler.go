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

	// User-facing routes (require JWT auth)
	authRoutes := matchmakingGroup.Group("")
	authRoutes.Use(api.JWTAuthMiddleware(h.api.GetJWTSecret()))
	{
		authRoutes.POST("/join", h.JoinQueue)
		authRoutes.POST("/leave", h.LeaveQueue)
		authRoutes.GET("/status", h.GetQueueStatus)
	}

	// Internal service routes (no auth required - for engine communication)
	{
		matchmakingGroup.POST("/cleanup/match/:matchId", h.CleanupMatch)
		matchmakingGroup.POST("/cleanup/player/:userId", h.CleanupPlayer)
	}
}
