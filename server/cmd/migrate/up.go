package migrate

import (
	"log"

	"github.com/ajlaz/checkmAIt/server/config"
	"github.com/ajlaz/checkmAIt/server/db/store/postgres"
	"github.com/pressly/goose"
	"github.com/spf13/cobra"
)

var UpCmd = &cobra.Command{
	Use:   "up",
	Short: "Migrate up",
	Run: func(cmd *cobra.Command, args []string) {
		migrateUp()
	},
}

// MigrateUp is called by the up command in base.go
func migrateUp() {

	cfg, err := config.LoadConfig()
	if err != nil {
		panic("Failed to load config: " + err.Error())
	}

	db := postgres.Connect(cfg)
	if err := goose.Up(db.DB, MigrationsDir); err != nil {
		log.Fatalf("Failed to apply migrations: %v", err)
	}

	log.Println("Migrations applied successfully.")

}
