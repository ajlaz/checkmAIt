package server

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/ajlaz/checkmAIt/server/api"
	"github.com/ajlaz/checkmAIt/server/config"
	"github.com/ajlaz/checkmAIt/server/logging"
)

type Server struct {
	config *config.Config

	http *http.Server
}

func New(config *config.Config) *Server {
	return &Server{
		config: config,
	}
}

func (s *Server) Start(api *api.API) error {
	s.http = &http.Server{
		Handler: api,
		Addr:    fmt.Sprintf("%s:%s", s.config.HTTP.Host, s.config.HTTP.Port),
	}

	return s.http.ListenAndServe()
}

func (s *Server) Run(ctx context.Context, api *api.API) {
	logger := logging.FromContext(ctx)
	logger.Debug().Ctx(ctx).Msg("Running server...")
	if err := s.Start(api); err != nil {
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Err(err).Ctx(ctx).Send()
		}
	}
}

func (s *Server) Shutdown(ctx context.Context) error {
	// shutdown gracefully
	return s.http.Shutdown(ctx)
}
