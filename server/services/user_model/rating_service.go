package user_model

import (
	"fmt"

	"github.com/ajlaz/checkmAIt/server/model"
)

// UpdateRating updates the ratings of two models after a match
// where one model wins and the other loses
func (s *Service) UpdateRating(winnerID, loserID int) (*model.UserModel, *model.UserModel, error) {
	// Get current ratings
	winner, err := s.modelStore.GetModelByID(winnerID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get winner model: %w", err)
	}

	loser, err := s.modelStore.GetModelByID(loserID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get loser model: %w", err)
	}

	// Calculate new ratings
	newWinnerRating, newLoserRating := CalculateELO(winner.Rating, loser.Rating)

	// Update winner rating
	winner.Rating = newWinnerRating
	updatedWinner, err := s.modelStore.UpdateModel(winner)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to update winner rating: %w", err)
	}

	// Update loser rating
	loser.Rating = newLoserRating
	updatedLoser, err := s.modelStore.UpdateModel(loser)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to update loser rating: %w", err)
	}

	return updatedWinner, updatedLoser, nil
}

// UpdateRatingDraw updates the ratings of two models after a draw match
func (s *Service) UpdateRatingDraw(modelAID, modelBID int) (*model.UserModel, *model.UserModel, error) {
	// Get current ratings
	modelA, err := s.modelStore.GetModelByID(modelAID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get model A: %w", err)
	}

	modelB, err := s.modelStore.GetModelByID(modelBID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get model B: %w", err)
	}

	// Calculate new ratings for a draw
	newModelARating, newModelBRating := CalculateELODraw(modelA.Rating, modelB.Rating)

	// Update model A rating
	modelA.Rating = newModelARating
	updatedModelA, err := s.modelStore.UpdateModel(modelA)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to update model A rating: %w", err)
	}

	// Update model B rating
	modelB.Rating = newModelBRating
	updatedModelB, err := s.modelStore.UpdateModel(modelB)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to update model B rating: %w", err)
	}

	return updatedModelA, updatedModelB, nil
}
