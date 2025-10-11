package matchmaking

import (
	"sync"
	"time"
)

// Player represents a user in the matchmaking queue
type Player struct {
	UserID    string     `json:"userId"`
	ModelID   string     `json:"modelId"`
	JoinedAt  time.Time  `json:"joinedAt"`
	MatchedAt *time.Time `json:"matchedAt,omitempty"`
}

// Match represents a pairing between two players
type Match struct {
	ID           string    `json:"id"`
	Player1      Player    `json:"player1"`
	Player2      Player    `json:"player2"`
	GameID       string    `json:"gameId"`
	WSPort       int       `json:"wsPort"`
	WhitePlayer  string    `json:"whitePlayer"`  // UserID of white player
	BlackPlayer  string    `json:"blackPlayer"`  // UserID of black player
	CreatedAt    time.Time `json:"createdAt"`
	Status       string    `json:"status"` // "waiting", "matched", "in_progress", "completed", "error"
}

// ServiceInterface defines the contract for the matchmaking service
type ServiceInterface interface {
	// AddToQueue adds a player to the matchmaking queue and attempts to find a match
	AddToQueue(userID, modelID string) (*Match, error)
	
	// GetPlayerStatus gets the match status for a player or their position in queue
	GetPlayerStatus(userID string) (*Match, int, error)
	
	// RemoveFromQueue removes a player from the queue
	RemoveFromQueue(userID string) error
	
	// GetQueueStats returns statistics about the current queue
	GetQueueStats() (int, int)
}

// Service implements the matchmaking service with thread-safe operations
type Service struct {
	queue         []Player          // Queue of players waiting to be matched
	matches       map[string]*Match  // Map of active matches by match ID
	playerMatches map[string]string // Maps player IDs to match IDs for quick lookup
	mu            sync.RWMutex      // RWMutex for thread-safe operations
	engineService EngineServiceInterface
}

// EngineServiceInterface defines the contract for interaction with the chess engine
type EngineServiceInterface interface {
	CreateGame(gameID, player1ID, player1ModelID, player2ID, player2ModelID string) (string, int, error)
}

// NewService creates a new matchmaking service instance
func NewService(engineService EngineServiceInterface) ServiceInterface {
	return &Service{
		queue:         make([]Player, 0),
		matches:       make(map[string]*Match),
		playerMatches: make(map[string]string),
		engineService: engineService,
	}
}
