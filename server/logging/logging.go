package logging

import (
	"context"

	"github.com/rs/zerolog"
)

// Returns a new context with the logger attached
func WithContext(log zerolog.Logger, ctx context.Context) context.Context {
	return log.WithContext(ctx)
}

// FromContext retrieves the logger from the context.
func FromContext(ctx context.Context) zerolog.Logger {
	return zerolog.Ctx(ctx).With().Logger()
}
