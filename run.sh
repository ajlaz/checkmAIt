#!/bin/bash

# Initialize the checkmAIt project

# Check if .env exists, if not create it from template
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please update your .env file with proper values before running the application."
fi

# Function to display messages
show_message() {
    echo "====================================================="
    echo "$1"
    echo "====================================================="
}

# Check command line arguments
case "$1" in
    start)
        show_message "Starting all services..."
        docker-compose up -d
        show_message "Services started. Use './run.sh logs' to see the logs."
        ;;
    stop)
        show_message "Stopping all services..."
        docker-compose down
        ;;
    restart)
        show_message "Restarting all services..."
        docker-compose restart
        ;;
    build)
        show_message "Building all services..."
        docker-compose build
        ;;
    logs)
        docker-compose logs -f
        ;;
    migrate)
        show_message "Running database migrations..."
        docker-compose exec server ./server migrate up
        show_message "Database migration completed."
        ;;
    status)
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|build|logs|migrate|status}"
        exit 1
        ;;
esac

exit 0