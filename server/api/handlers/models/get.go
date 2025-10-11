package models

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetModelByID(c *gin.Context) {
	// Get model ID from URL params
	modelID := c.Param("id")

	// Convert modelID to int
	modelIDInt, err := strconv.Atoi(modelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid model ID"})
		return
	}

	if modelIDInt == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Model ID is required"})
		return
	}

	// Get model from service
	model, err := h.modelService.GetModelByID(modelIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Model not found"})
		return
	}

	c.JSON(http.StatusOK, model)
}
