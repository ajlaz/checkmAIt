package matchmaking

import (
	"errors"
	"fmt"
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
func (s *Service) AddToQueue(userID, modelID string) (*Match, error) {
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

		// Create a game via engine service
		returnedGameID, wsPort, err := s.engineService.CreateGame(
			gameID,
			player1.UserID, player1.ModelID,
			player2.UserID, player2.ModelID,
		)
		
		if err != nil {
			// If creating the game fails, put the players back in the queue
			s.queue = append([]Player{player1, player2}, s.queue...)
			return nil, fmt.Errorf("failed to create game: %w", err)
		}

		// Create and store the match
		match := &Match{
			ID:        matchID,
			Player1:   player1,
			Player2:   player2,
			GameID:    returnedGameID,
			WSPort:    wsPort,
			CreatedAt: now,
			Status:    "matched",
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
func (s *Service) GetPlayerStatus(userID string) (*Match, int, error) {
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
func (s *Service) RemoveFromQueue(userID string) error {
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