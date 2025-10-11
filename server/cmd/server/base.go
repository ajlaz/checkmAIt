package server

import (
	"github.com/spf13/cobra"
)

var ServerCmd = &cobra.Command{
	Use:   "serve",
	Short: "Serve commands",
	Long:  `Serve commands run the server`,
	Run: func(cmd *cobra.Command, args []string) {
		Run()
	},
}
