package models

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetModelsByUserID retrieves all models for a specific user
func (h *Handler) GetModelsByUserID(c *gin.Context) {
	// Get user ID from URL params
	userID := c.Param("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// Get models from service
	models, err := h.modelService.GetModelsByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve models: " + err.Error()})
		return
	}

	// Return the models (will be empty array if no models found)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(models),
		"models":  models,
	})
}
