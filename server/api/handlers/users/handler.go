package users

import (
	"github.com/ajlaz/checkmAIt/server/api"
	"github.com/ajlaz/checkmAIt/server/services/user"
)

type Handler struct {
	*api.API

	userService user.ServiceInterface
	jwtSecret   string
}

func NewHandler(a *api.API, userService user.ServiceInterface) *Handler {
	h := &Handler{
		API:         a,
		userService: userService,
		jwtSecret:   a.GetJWTSecret(),
	}

	h.registerRoutes()

	return h
}

func (h *Handler) registerRoutes() {
	// Public routes
	authGroup := h.Group("/auth")
	{
		authGroup.POST("/login", h.Login)
		authGroup.POST("/register", h.Register)
	}

	// Protected routes
	// Add JWT middleware to users group
	usersGroup := h.Group("/users")
	usersGroup.Use(api.JWTAuthMiddleware(h.jwtSecret))
	{
		usersGroup.GET("/:id", h.GetUserByID)
	}
}
