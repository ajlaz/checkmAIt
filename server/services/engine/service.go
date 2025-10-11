package engine

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// ServiceInterface defines the contract for the engine service
type ServiceInterface interface {
	CreateGame(gameID, player1ID, player1ModelID, player2ID, player2ModelID string) (string, int, error)
}

// Service implements the engine service
type Service struct {
	engineURL  string
	httpClient *http.Client
}

// CreateGameRequest matches the engine's expected request format
type CreateGameRequest struct {
	GameID         string `json:"gameId"`
	WhitePlayerID  string `json:"whitePlayerId"`
	BlackPlayerID  string `json:"blackPlayerId"`
}

// CreateGameResponse matches the engine's response format
type CreateGameResponse struct {
	Success bool   `json:"success"`
	GameID  string `json:"gameId"`
	WSPort  int    `json:"wsPort"`
	Error   string `json:"error,omitempty"`
}

// NewService creates a new engine service
func NewService(engineURL string) ServiceInterface {
	return &Service{
		engineURL: engineURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// CreateGame creates a new game in the engine and returns the game ID and WebSocket port
func (s *Service) CreateGame(gameID, player1ID, player1ModelID, player2ID, player2ModelID string) (string, int, error) {
	// Create request payload
	reqBody := CreateGameRequest{
		GameID:         gameID,
		WhitePlayerID:  player1ID,
		BlackPlayerID:  player2ID,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", 0, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Make HTTP request to engine
	url := fmt.Sprintf("%s/game/create", s.engineURL)
	resp, err := s.httpClient.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", 0, fmt.Errorf("failed to make request to engine: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", 0, fmt.Errorf("failed to read response body: %w", err)
	}

	// Parse response
	var response CreateGameResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return "", 0, fmt.Errorf("failed to parse response: %w", err)
	}

	// Check if request was successful
	if !response.Success {
		return "", 0, fmt.Errorf("engine returned error: %s", response.Error)
	}

	return response.GameID, response.WSPort, nil
}
