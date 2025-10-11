package server

import (
	"context"
	"os"
	"os/signal"
	"time"

	"github.com/ajlaz/checkmAIt/server/api"
	"github.com/ajlaz/checkmAIt/server/api/handlers/matchmaking"
	"github.com/ajlaz/checkmAIt/server/api/handlers/models"
	"github.com/ajlaz/checkmAIt/server/api/handlers/users"
	"github.com/ajlaz/checkmAIt/server/config"
	"github.com/ajlaz/checkmAIt/server/server"
	"github.com/ajlaz/checkmAIt/server/services"
	"github.com/rs/zerolog"
)

var logger zerolog.Logger

func Run() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	// setup server
	cfg, err := config.LoadConfig()
	if err != nil {
		logger.Fatal().Err(err).Msg("Failed to load config")
	}

	srv := server.New(cfg)

	store := initStore(cfg)

	services := services.NewServices(store.user_store, store.model_store, cfg.Engine.URL)

	a := api.New(cfg)
	// initialize handlers
	_ = users.NewHandler(a, services.UserService)
	_ = models.NewHandler(a, services.UserService, services.ModelService)
	_ = matchmaking.NewHandler(a, *services)

	idleConnsClosed := make(chan struct{})
	// gracefully shutdown the server on os.interrupt signal
	go func() {
		const shutdownTimeout = 5 * time.Second

		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt)
		<-sigint

		ctx, cancel := context.WithTimeout(ctx, shutdownTimeout)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			logger.Fatal().Err(err).Msg("Server Shutdown Failed")
		}
		logger.Info().Ctx(ctx).Msg("HTTP server stopped")
		close(idleConnsClosed)
	}()

	logger.Info().Ctx(ctx).Msg("Starting server...")
	srv.Run(ctx, a)

	<-idleConnsClosed
	logger.Info().Ctx(ctx).Msg("Server exited gracefully")
}
