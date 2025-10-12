package matchmaking

import (
	"errors"
	"fmt"
	"math/rand"
	"time"
)

// Helper function to generate a unique ID
func generateMatchID() string {
	return fmt.Sprintf("match-%d", time.Now().UnixNano())
}

// Helper function to generate a game UUID
func generateGameID() string {
	return fmt.Sprintf("game-%d", time.Now().UnixNano())
}

// AddToQueue adds a player to the matchmaking queue and attempts to find a match
func (s *Service) AddToQueue(userID, modelID int) (*Match, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Check if user is already in a match
	if matchID, exists := s.playerMatches[userID]; exists {
		if match, found := s.matches[matchID]; found {
			return match, nil
		}
	}

	// Check if user is already in the queue
	for _, player := range s.queue {
		if player.UserID == userID {
			return nil, errors.New("user is already in the matchmaking queue")
		}
	}

	// Add the player to the queue
	player := Player{
		UserID:   userID,
		ModelID:  modelID,
		JoinedAt: time.Now(),
	}
	s.queue = append(s.queue, player)

	// Try to find a match (FIFO)
	if len(s.queue) > 1 {
		// Match the first two players in the queue
		player1 := s.queue[0]
		player2 := s.queue[1]

		// Remove matched players from queue
		s.queue = s.queue[2:]

		// Create the match
		matchID := generateMatchID()
		gameID := generateGameID()
		now := time.Now()

		// Update matched time for players
		player1.MatchedAt = &now
		player2.MatchedAt = &now

		// Randomly assign colors
		var whitePlayerID, blackPlayerID int
		var whiteModelID, blackModelID int
		if rand.Intn(2) == 0 {
			whitePlayerID = player1.UserID
			whiteModelID = player1.ModelID
			blackPlayerID = player2.UserID
			blackModelID = player2.ModelID
		} else {
			whitePlayerID = player2.UserID
			whiteModelID = player2.ModelID
			blackPlayerID = player1.UserID
			blackModelID = player1.ModelID
		}
		// Create a game via engine service
		returnedGameID, wsPort, err := s.engineService.CreateGame(
			gameID,
			fmt.Sprintf("%d", whitePlayerID), fmt.Sprintf("%d", whiteModelID),
			fmt.Sprintf("%d", blackPlayerID), fmt.Sprintf("%d", blackModelID),
		)

		if err != nil {
			// If creating the game fails, put the players back in the queue
			s.queue = append([]Player{player1, player2}, s.queue...)
			return nil, fmt.Errorf("failed to create game: %w", err)
		}

		// Create and store the match
		match := &Match{
			ID:          matchID,
			Player1:     player1,
			Player2:     player2,
			GameID:      returnedGameID,
			WSPort:      wsPort,
			WhitePlayer: whitePlayerID,
			BlackPlayer: blackPlayerID,
			CreatedAt:   now,
			Status:      "matched",
		}
		s.matches[matchID] = match

		// Add player-to-match mapping for quick lookup
		s.playerMatches[player1.UserID] = matchID
		s.playerMatches[player2.UserID] = matchID

		return match, nil
	}

	// Return nil if no match was made (player is still in queue)
	return nil, nil
}

// GetPlayerStatus returns the match for a player if matched, or their position in queue
func (s *Service) GetPlayerStatus(userID int) (*Match, int, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Check if player is in a match
	if matchID, exists := s.playerMatches[userID]; exists {
		if match, found := s.matches[matchID]; found {
			return match, -1, nil
		}
	}

	// Check if player is in queue and get position
	for i, player := range s.queue {
		if player.UserID == userID {
			return nil, i, nil
		}
	}

	// Player is not in queue or match
	return nil, -1, nil
}

// RemoveFromQueue removes a player from the queue
func (s *Service) RemoveFromQueue(userID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Check queue
	for i, player := range s.queue {
		if player.UserID == userID {
			// Remove the player from the queue
			s.queue = append(s.queue[:i], s.queue[i+1:]...)
			return nil
		}
	}

	// Check if player is in a match but not started
	// We don't allow leaving once matched, so no implementation here

	return errors.New("user not found in the matchmaking queue")
}

// GetQueueStats returns the number of players in queue and active matches
func (s *Service) GetQueueStats() (int, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return len(s.queue), len(s.matches)
}

// RemoveMatch removes a match by ID and cleans up all associated player mappings
func (s *Service) RemoveMatch(matchID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Find the match
	match, exists := s.matches[matchID]
	if !exists {
		return errors.New("match not found")
	}

	// Remove player mappings
	delete(s.playerMatches, match.Player1.UserID)
	delete(s.playerMatches, match.Player2.UserID)

	// Remove the match itself
	delete(s.matches, matchID)

	return nil
}

// RemovePlayerFromMatch removes a player from their current match
// This is useful when a player disconnects or a game ends
func (s *Service) RemovePlayerFromMatch(userID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Find the match ID for this player
	matchID, exists := s.playerMatches[userID]
	if !exists {
		return errors.New("player is not in any match")
	}

	// Get the match to find the other player
	match, found := s.matches[matchID]
	if !found {
		// Clean up orphaned player mapping
		delete(s.playerMatches, userID)
		return nil
	}

	// Remove both players from the match
	delete(s.playerMatches, match.Player1.UserID)
	delete(s.playerMatches, match.Player2.UserID)

	// Remove the match
	delete(s.matches, matchID)

	return nil
}
