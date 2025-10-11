package users

import (
	"github.com/ajlaz/checkmAIt/server/api"
	"github.com/ajlaz/checkmAIt/server/services/user"
)

type Handler struct {
	*api.API

	userService user.ServiceInterface
}

func NewHandler(a *api.API, userService user.ServiceInterface) *Handler {
	h := &Handler{
		API:         a,
		userService: userService,
	}

	h.registerRoutes()

	return h
}

func (h *Handler) registerRoutes() {
	usersGroup := h.Group("/users")
	{
		usersGroup.GET("/:id", h.GetUserByID)
	}
}
