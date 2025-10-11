package api

import (
	"github.com/gin-gonic/gin"
)

type API struct {
	*gin.Engine
	middlewares []gin.HandlerFunc
}

func New() *API {
	api := &API{
		Engine:      gin.Default(),
		middlewares: []gin.HandlerFunc{},
	}

	api.RegisterDefaultRoutes()

	return api
}
