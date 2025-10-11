package models

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type CreateModelRequest struct {
	UserID int    `json:"user_id" binding:"required"`
	Name   string `json:"name" binding:"required"`
	Model  string `json:"model" binding:"required"`
}

func (h *Handler) CreateModel(c *gin.Context) {
	var req CreateModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	model, err := h.modelService.CreateModel(req.UserID, req.Name, req.Model)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create model"})
		return
	}

	c.JSON(http.StatusCreated, model)

}
