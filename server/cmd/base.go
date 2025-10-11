package cmd

import (
	"fmt"

	"github.com/ajlaz/checkmAIt/server/cmd/migrate"
	"github.com/ajlaz/checkmAIt/server/cmd/server"
	"github.com/spf13/cobra"
)

var RootCmd = &cobra.Command{
	Use:   "base",
	Short: "Base command for the application",
}

func Execute() {
	if err := RootCmd.Execute(); err != nil {
		fmt.Println(err)
	}
}

func init() {
	RootCmd.AddCommand(server.ServerCmd)
	RootCmd.AddCommand(migrate.MigrateCmd)
}
