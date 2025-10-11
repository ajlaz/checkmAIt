package migrate

import (
	"log"

	"github.com/ajlaz/checkmAIt/server/config"
	"github.com/ajlaz/checkmAIt/server/db/store/postgres"
	"github.com/pressly/goose"
	"github.com/spf13/cobra"
)

var DownCmd = &cobra.Command{
	Use:   "down",
	Short: "Migrate down",
	Run: func(cmd *cobra.Command, args []string) {
		migrateDown()
	},
}

// migrateDown is called by the down command in base.go
func migrateDown() {

	cfg, err := config.LoadConfig()
	if err != nil {
		panic("Failed to load config: " + err.Error())
	}

	db := postgres.Connect(cfg)
	if err := goose.Down(db.DB, MigrationsDir); err != nil {
		log.Fatalf("Failed to apply migrations: %v", err)
	}

	log.Println("Successfully migrated down.")
}
