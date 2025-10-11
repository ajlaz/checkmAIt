package model

type UserModel struct {
	ID     string `json:"id" db:"id"`
	UserID string `json:"user_id" db:"user_id"`
	Name   string `json:"name" db:"name"`
	Model  string `json:"model" db:"model"`
	Rating int    `json:"rating" db:"rating"`
}

// NewUserModel creates a new UserModel with default values
func NewUserModel(userID, name, modelCode string) *UserModel {
	return &UserModel{
		UserID: userID,
		Name:   name,
		Model:  modelCode,
		Rating: 400, // Default rating
	}
}
