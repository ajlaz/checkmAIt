package store

import "database/sql"

type StorageInterface interface {
	GetDBConnection() *sql.DB
}


