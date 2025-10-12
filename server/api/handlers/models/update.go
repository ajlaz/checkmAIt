package models

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type UpdateModelRequest struct {
	Name  string `json:"name" binding:"required"`
	Model string `json:"model" binding:"required"` // Changed from ModelCode to Model to match frontend and CreateModelRequest
}

// UpdateModel updates an existing model
func (h *Handler) UpdateModel(c *gin.Context) {
	// Get model ID from URL
	modelIDStr := c.Param("id")
	modelID, err := strconv.Atoi(modelIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid model ID",
		})
		return
	}

	// Get user ID from JWT token
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: No user ID found",
		})
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
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Internal server error: Invalid user ID format",
			})
			return
		}
	default:
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized: Invalid user ID format",
		})
		return
	}

	// Parse request body
	var req UpdateModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Check if model exists and belongs to user
	existingModel, err := h.modelService.GetModelByID(modelID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Model not found",
		})
		return
	}

	// Verify model belongs to user
	if existingModel.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "You don't have permission to update this model",
		})
		return
	}

	// Update model
	updatedModel, err := h.modelService.UpdateModel(modelID, req.Name, req.Model)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update model: " + err.Error(),
		})
		return
	}

	// Return updated model
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Model updated successfully",
		"model":   updatedModel,
	})
}
