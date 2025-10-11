package models

import (
	"github.com/ajlaz/checkmAIt/server/api"
	"github.com/ajlaz/checkmAIt/server/services/user"
	"github.com/ajlaz/checkmAIt/server/services/user_model"
)

type Handler struct {
	*api.API

	userService  user.ServiceInterface
	modelService user_model.ServiceInterface
	jwtSecret    string
}

func NewHandler(a *api.API, userService user.ServiceInterface, modelService user_model.ServiceInterface) *Handler {
	h := &Handler{
		API:          a,
		userService:  userService,
		modelService: modelService,
		jwtSecret:    a.GetJWTSecret(),
	}

	h.registerRoutes()

	return h
}

func (h *Handler) registerRoutes() {
	// Public routes
	modelGroup := h.Group("/models")
	{
		modelGroup.GET("/:id", h.GetModelByID)
		modelGroup.GET("/user/:userId", h.GetModelsByUserID)
		modelGroup.POST("", h.CreateModel)  // Remove trailing slash to avoid redirects
	}
}
