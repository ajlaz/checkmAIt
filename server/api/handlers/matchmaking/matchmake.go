package matchmaking

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type JoinQueueRequest struct {
	ModelID int `json:"modelId" binding:"required"`
}

type QueueStatusResponse struct {
	Status          string `json:"status"` // "queued", "matched"
	QueuePosition   int    `json:"queuePosition,omitempty"`
	GameID          string `json:"gameId,omitempty"`
	WSPort          int    `json:"wsPort,omitempty"`
	MatchID         string `json:"matchId,omitempty"`
	PlayerColor     string `json:"playerColor,omitempty"`     // "white" or "black"
	OpponentModelID int    `json:"opponentModelId,omitempty"` // Added for rating updates
}

func (h *Handler) JoinQueue(c *gin.Context) {
	// Extract user ID from context (set by JWT middleware)
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized: No user ID found",
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
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized: Invalid user ID format",
			})
			return
		}
	default:
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized: Invalid user ID format",
		})
		return
	}

	// Parse request body
	var req JoinQueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Add user to matchmaking queue
	match, err := h.svc.MatchmakingService.AddToQueue(userID, req.ModelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to join queue: " + err.Error(),
		})
		return
	}

	// If match is nil, user is still in queue
	if match == nil {
		c.JSON(http.StatusOK, gin.H{
			"status":  "queued",
			"message": "Added to matchmaking queue, waiting for opponent...",
		})
		return
	}

	// User was matched immediately
	// Determine player color and opponent model ID
	playerColor := "white"
	var opponentModelID int

	if match.BlackPlayer == userID {
		playerColor = "black"
		// If we're black, the opponent is white (player1)
		opponentModelID = match.Player1.ModelID
	} else {
		// If we're white, the opponent is black (player2)
		opponentModelID = match.Player2.ModelID
	}

	c.JSON(http.StatusOK, QueueStatusResponse{
		Status:          "matched",
		GameID:          match.GameID,
		WSPort:          match.WSPort,
		MatchID:         match.ID,
		PlayerColor:     playerColor,
		OpponentModelID: opponentModelID,
	})
}

func (h *Handler) LeaveQueue(c *gin.Context) {
	// Extract user ID from context (set by JWT middleware)
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized: No user ID found",
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
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized: Invalid user ID format",
			})
			return
		}
	default:
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized: Invalid user ID format",
		})
		return
	}

	// Remove user from queue
	err := h.svc.MatchmakingService.RemoveFromQueue(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to leave queue: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Removed from matchmaking queue",
	})
}

func (h *Handler) GetQueueStatus(c *gin.Context) {
	// Extract user ID from context (set by JWT middleware)
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized: No user ID found",
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
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized: Invalid user ID format",
			})
			return
		}
	default:
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized: Invalid user ID format",
		})
		return
	}

	// Get player status
	match, queuePosition, err := h.svc.MatchmakingService.GetPlayerStatus(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get queue status: " + err.Error(),
		})
		return
	}

	// If match exists, return match details
	if match != nil {
		// Determine player color and opponent model ID
		playerColor := "white"
		var opponentModelID int

		if match.BlackPlayer == userID {
			playerColor = "black"
			// If we're black, the opponent is white (player1)
			opponentModelID = match.Player1.ModelID
		} else {
			// If we're white, the opponent is black (player2)
			opponentModelID = match.Player2.ModelID
		}

		c.JSON(http.StatusOK, QueueStatusResponse{
			Status:          "matched",
			GameID:          match.GameID,
			WSPort:          match.WSPort,
			MatchID:         match.ID,
			PlayerColor:     playerColor,
			OpponentModelID: opponentModelID,
		})
		return
	}

	// If player is in queue, return queue position
	if queuePosition >= 0 {
		c.JSON(http.StatusOK, QueueStatusResponse{
			Status:        "queued",
			QueuePosition: queuePosition,
		})
		return
	}

	// Player is not in queue or match
	c.JSON(http.StatusOK, gin.H{
		"status":  "not_queued",
		"message": "Player is not in the matchmaking queue",
	})
}

func (h *Handler) CleanupMatch(c *gin.Context) {
	matchID := c.Param("matchId")
	if matchID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Match ID is required",
		})
		return
	}

	err := h.svc.MatchmakingService.RemoveMatch(matchID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Failed to cleanup match: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Match cleaned up successfully",
	})
}

func (h *Handler) CleanupPlayer(c *gin.Context) {
	userIDStr := c.Param("userId")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User ID is required",
		})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	err = h.svc.MatchmakingService.RemovePlayerFromMatch(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Failed to cleanup player: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Player cleaned up successfully",
	})
}
