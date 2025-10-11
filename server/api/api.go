package api

import (
	"github.com/ajlaz/checkmAIt/server/config"
	"github.com/gin-gonic/gin"
)

type API struct {
	*gin.Engine
	middlewares []gin.HandlerFunc
	jwtSecret   string
}

func New(cfg *config.Config) *API {
	api := &API{
		Engine:      gin.Default(),
		middlewares: []gin.HandlerFunc{},
		jwtSecret:   cfg.Auth.JWTSecret,
	}

	// Add CORS middleware
	api.Use(CORSMiddleware())

	api.RegisterDefaultRoutes()

	return api
}

// GetJWTSecret returns the JWT secret from the API
func (a *API) GetJWTSecret() string {
	return a.jwtSecret
}
