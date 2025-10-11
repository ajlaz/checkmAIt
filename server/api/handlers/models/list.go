package models

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetModelsByUserID retrieves all models for a specific user
func (h *Handler) GetModelsByUserID(c *gin.Context) {
	// Get user ID from URL params
	userID := c.Param("userId")

	// Convert userID to int
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if userIDInt == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// Get models from service
	models, err := h.modelService.GetModelsByUserID(userIDInt)
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
