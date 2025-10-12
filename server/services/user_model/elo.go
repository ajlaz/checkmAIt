package user_model

import (
	"math"
)

const (
	// K factor for ELO calculation
	K = 32
)

// CalculateELO calculates new ELO ratings after a game where player A wins against player B
// This uses a simplified version of the Chess.com ELO algorithm
func CalculateELO(winnerRating, loserRating int) (int, int) {
	// Calculate expected outcome using logistic curve
	expectedWinner := 1.0 / (1.0 + math.Pow(10, float64(loserRating-winnerRating)/400.0))
	expectedLoser := 1.0 / (1.0 + math.Pow(10, float64(winnerRating-loserRating)/400.0))

	// Calculate new ratings
	newWinnerRating := winnerRating + int(math.Round(K*(1.0-expectedWinner)))
	newLoserRating := loserRating + int(math.Round(K*(0.0-expectedLoser)))

	// Ensure ratings don't go below 100
	if newLoserRating < 100 {
		newLoserRating = 100
	}

	return newWinnerRating, newLoserRating
}

// CalculateELODraw calculates new ELO ratings after a draw
func CalculateELODraw(ratingA, ratingB int) (int, int) {
	// Calculate expected outcome using logistic curve
	expectedA := 1.0 / (1.0 + math.Pow(10, float64(ratingB-ratingA)/400.0))
	expectedB := 1.0 / (1.0 + math.Pow(10, float64(ratingA-ratingB)/400.0))

	// For a draw, the actual outcome is 0.5 for both players
	newRatingA := ratingA + int(math.Round(K*(0.5-expectedA)))
	newRatingB := ratingB + int(math.Round(K*(0.5-expectedB)))

	// Ensure ratings don't go below 100
	if newRatingA < 100 {
		newRatingA = 100
	}
	if newRatingB < 100 {
		newRatingB = 100
	}

	return newRatingA, newRatingB
}
