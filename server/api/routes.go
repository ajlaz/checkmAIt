package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (a *API) RegisterDefaultRoutes() {
	a.GET("/health", a.healthCheck)
	a.GET("/ping", a.ping)
}

// default routes

func (a *API) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (a *API) ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "pong"})
}
