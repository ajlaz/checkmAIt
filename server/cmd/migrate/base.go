package migrate

import (
	"github.com/spf13/cobra"
)

// migrateUp and migrateDown are implemented in up.go and down.go
const MigrationsDir = "db/migrations"

var MigrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Apply database migrations",
}

func init() {
	MigrateCmd.AddCommand(UpCmd)
	MigrateCmd.AddCommand(DownCmd)
}
