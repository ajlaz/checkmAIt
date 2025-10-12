package models

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateModelRequest struct {
	UserID int    `json:"user_id"` // Not required anymore, we get it from JWT token
	Name   string `json:"name" binding:"required"`
	Model  string `json:"model" binding:"required"`
}

func (h *Handler) CreateModel(c *gin.Context) {
	var req CreateModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Extract user ID from context (set by JWT middleware)
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: No user ID found"})
		return
	}

	// Convert userID to int based on the type
	var userID int

	// JWT claims are stored as float64 when unmarshalled
	switch v := userIDVal.(type) {
	case float64:
		userID = int(v)
	case string:
		var err error
		userID, err = strconv.Atoi(v)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Invalid user ID format"})
			return
		}
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Invalid user ID format"})
		return
	}

	model, err := h.modelService.CreateModel(userID, req.Name, req.Model)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create model"})
		return
	}

	c.JSON(http.StatusCreated, model)
}
