# checkmAIt

> Chess.com meets LeetCode. Test your chess AI models without the hassle.

[![Demo Video](https://img.shields.io/badge/Demo-Watch%20Video-blue)](./demo.mp4)

## Overview

checkmAIt is a platform designed to help computer science students and chess enthusiasts create, test, and compete with their own chess AI models. Built for BostonHacks 2025 by Seth Culberson and Aden Lazarus, checkmAIt provides a VS Code-like browser-based editor for writing Python chess bots, a matchmaking system for AI vs AI competitions, and real-time game visualization.

## Features

- **Browser-Based Code Editor**: Write Python chess models directly in your browser using Monaco Editor (the same editor that powers VS Code)
- **User Authentication**: Secure JWT-based registration and login system
- **Model Management**: Create, store, edit, and manage multiple chess AI models per user
- **Intelligent Matchmaking**: Queue system that pairs chess bots for competitive matches
- **Real-Time Chess Engine**: WebSocket-based chess game execution with live board updates
- **ELO Rating System**: Track your AI's performance with competitive ratings
- **Secure Python Execution**: Run Python code safely using Pyodide (Python compiled to WebAssembly)

## Demo
Check out our Devpost for a full demo video [here!](https://devpost.com/software/checkmait)

[Download Demo Video](./demo.mp4)

## Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Chakra UI** - Component library
- **Monaco Editor** - In-browser code editor
- **Pyodide** - Python runtime in WebAssembly
- **chess.js** - Chess game logic
- **react-chessboard** - Interactive chess board visualization
- **Axios** - HTTP client

### Backend
- **Go** - Primary server language
- **Gin** - HTTP web framework
- **JWT** - Authentication tokens
- **PostgreSQL** - Primary database

### Chess Engine
- **Node.js/TypeScript** - Runtime and language
- **Express** - HTTP API server
- **WebSocket (ws)** - Real-time bidirectional communication
- **chess.js** - Chess game validation and logic

### Infrastructure
- **Docker & Docker Compose** - Containerization and orchestration
- **PostgreSQL 16** - Database
- **Alpine Linux** - Base images for minimal container size


### Component Responsibilities

1. **Go Server** (`/server`)
   - User authentication and authorization (JWT)
   - User model CRUD operations
   - Matchmaking queue management
   - Database operations via PostgreSQL
   - API gateway for frontend requests

2. **Chess Engine** (`/engine`)
   - Game state management
   - Chess move validation
   - WebSocket server for real-time game updates
   - Bot vs Bot game execution
   - Communication with Go server for matchmaking

3. **React Frontend** (`/chess-frontend`)
   - User authentication UI
   - Monaco-based Python code editor
   - Model selection and management
   - Matchmaking queue interface
   - Real-time chess board visualization
   - Pyodide integration for Python execution

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/checkmAIt.git
cd checkmAIt
```

2. Create environment file (if `.env.example` exists):
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Build and start all services:
```bash
./run.sh build
./run.sh start
```

The services will be available at:
- Frontend: http://localhost:5173
- Go Server API: http://localhost:8080
- Chess Engine: http://localhost:3000
- PostgreSQL: localhost:5432

### Using the Run Script

The `run.sh` script provides convenient commands for managing the application:

```bash
./run.sh start      # Start all services in detached mode
./run.sh stop       # Stop all services
./run.sh restart    # Restart all services
./run.sh build      # Build all Docker images
./run.sh logs       # View logs from all services
./run.sh migrate    # Run database migrations
./run.sh status     # Check status of all services
```

## Usage

1. **Register/Login**: Create an account or log in to access the platform
2. **Create a Model**: Write your Python chess AI using the in-browser editor
   - Implement the required functions for move generation
   - Save your model with a descriptive name
3. **Join Matchmaking**: Select a model and join the queue
4. **Watch the Match**: Once matched with an opponent, watch your AI compete in real-time
5. **Track Progress**: View your model's ELO rating and performance

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

### Models
- `POST /api/models` - Create a new chess AI model
- `GET /api/models` - List all models for authenticated user
- `GET /api/models/:id` - Get specific model details
- `PUT /api/models/:id` - Update model code or name
- `PUT /api/models/:id/rating` - Update model rating

### Matchmaking
- `POST /api/matchmaking/queue` - Join matchmaking queue
- `GET /api/matchmaking/status` - Check queue status
- `DELETE /api/matchmaking/queue` - Leave queue
- `DELETE /api/matchmaking/match/:matchId` - Cleanup match
- `DELETE /api/matchmaking/player/:userId` - Cleanup player

### Health
- `GET /health` - Server health check
- `GET /ping` - Ping endpoint

## Development

### Running Locally Without Docker

#### Go Server
```bash
cd server
go mod download
go run main.go serve
```

#### Chess Engine
```bash
cd engine
npm install
npm run dev
```

#### React Frontend
```bash
cd chess-frontend
npm install
npm run dev
```

### Running Tests

#### Engine Tests
```bash
cd engine
npm test              # Unit tests
npm run test:coverage # Coverage report
```

## Project Structure

```
checkmAIt/
├── server/              # Go backend server
│   ├── api/            # HTTP handlers and routes
│   ├── cmd/            # CLI commands (serve, migrate)
│   ├── config/         # Configuration management
│   ├── db/             # Database store implementations
│   ├── model/          # Data models
│   ├── services/       # Business logic
│   └── main.go         # Entry point
├── engine/             # Node.js chess engine
│   ├── src/
│   │   ├── cmd/        # Server initialization
│   │   ├── controllers/# Game controllers
│   │   ├── services/   # Game services
│   │   └── index.ts    # Entry point
│   └── test/           # Engine tests
├── chess-frontend/     # React frontend
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # React components
│   │   ├── context/    # React context
│   │   ├── services/   # Frontend services
│   │   └── App.jsx     # Main app component
│   └── public/         # Static assets
├── docker-compose.yml  # Multi-service orchestration
├── run.sh             # Utility script
└── demo.mp4           # Demo video
```

## Challenges & Learnings

### Challenges Faced
- **UI Updates**: Synchronizing bot moves with real-time board updates via WebSocket
- **Python Execution**: Running Python code securely in the browser using Pyodide
- **Deployment**: Time constraints prevented full production deployment
- **Multi-Service Integration**: Coordinating Go, Node.js, and React services

### What We Learned
- Integrating multiple backend services (Go + Node.js) with a React frontend
- WebSocket implementation for real-time game state synchronization
- How platforms like LeetCode run user code in the browser
- Docker Compose orchestration for complex multi-service applications
- JWT authentication flow across microservices

### Accomplishments
- Achieved core functionality of AI vs AI chess matches
- Implemented secure user authentication
- Created a polished in-browser code editor experience
- Built a working matchmaking and rating system
- Developed a clean, responsive UI

## Future Plans

- Deploy the application to a production environment
- Add more predefined Python functions and helper utilities for the editor
- Implement spectator mode for watching ongoing matches
- Add leaderboard for top-rated models
- Support for more chess variants
- Tournament system for models
- Code templates and examples for beginners
- Replay system for past games
- Model performance analytics

## Environment Variables

The application uses the following environment variables (see `.env.example`):

### Server
- `POSTGRES_HOST` - PostgreSQL host (default: postgres)
- `POSTGRES_USER` - Database user (default: postgres)
- `POSTGRES_PASSWORD` - Database password (default: postgres)
- `POSTGRES_DB` - Database name (default: postgres)
- `POSTGRES_PORT` - Database port (default: 5432)
- `HTTP_HOST` - Server host (default: 0.0.0.0)
- `HTTP_PORT` - Server port (default: 8080)
- `HTTP_CORS_ORIGINS` - Allowed CORS origins
- `JWT_SECRET` - JWT signing secret (change in production!)

### Engine
- `NODE_ENV` - Environment (production/development)
- `HTTP_PORT` - Engine HTTP port (default: 3000)
- `WS_BASE_PORT` - WebSocket base port (default: 9000)
- `MATCHMAKING_URL` - Go server URL (default: http://server:8080)

## Database Migrations

The application uses database migrations to manage schema changes:

```bash
# Run migrations
./run.sh migrate

# Or manually in the server container
docker-compose exec server ./server migrate up

# Rollback migrations
docker-compose exec server ./server migrate down
```

## Contributing

This project was created for BostonHacks 2025. Contributions, issues, and feature requests are welcome!

## License

MIT

## Authors

- **Seth Culberson**
- **Aden Lazarus**

Created for BostonHacks 2025

---

Built with passion for chess and computer science education.
