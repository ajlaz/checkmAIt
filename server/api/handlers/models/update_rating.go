package models

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type UpdateRatingRequest struct {
	WinnerID int  `json:"winner_id" binding:"required"`
	LoserID  int  `json:"loser_id" binding:"required"`
	IsDraw   bool `json:"is_draw"`
}

// UpdateRating updates the ELO ratings of two models after a game
func (h *Handler) UpdateRating(c *gin.Context) {
	var req UpdateRatingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate model IDs
	if req.WinnerID <= 0 || req.LoserID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid model IDs"})
		return
	}

	var winner, loser interface{}
	var err error

	if req.IsDraw {
		// Handle a draw
		winner, loser, err = h.modelService.UpdateRatingDraw(req.WinnerID, req.LoserID)
	} else {
		// Handle a win/loss
		winner, loser, err = h.modelService.UpdateRating(req.WinnerID, req.LoserID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"winner": winner,
		"loser":  loser,
	})
}
