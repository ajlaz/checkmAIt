/**
 * Chess.js to Python Bridge
 * Converts chess.js board state into Python code that simulates the chess API
 */

import { Chess } from "chess.js";

/**
 * Generate Python code that creates a mock board object
 * This code will be injected before the predefined functions
 * @param {string} fen - FEN string representing the board position
 * @returns {string} - Python code that creates the board object
 */
export const generateBoardMock = (fen) => {
  const chess = new Chess(fen);

  // Get legal moves
  const moves = chess.moves({ verbose: false });

  // Get board as 2D array
  const board = chess.board();

  // Convert board to Python-compatible format
  const boardPython = board.map((row) =>
    row.map((square) => {
      if (square === null) return "None";
      return `{'type': '${square.type}', 'color': '${square.color}'}`;
    })
  );

  // Convert moves array to Python list
  const movesPython = moves.map((m) => `'${m}'`).join(", ");

  // Get game state
  const isCheck = chess.isCheck();
  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const isGameOver = chess.isGameOver();
  const turn = chess.turn();

  // Convert JavaScript booleans to Python booleans
  const toPython = (bool) => (bool ? "True" : "False");

  // Generate piece mapping
  const pieceMappings = generatePieceMapping(chess);

  // Create a Python class that mimics the board object
  const pythonCode = `
# Board state for FEN: ${fen}
class MockBoard:
    def __init__(self):
        self._moves = [${movesPython}]
        self._board = [
${boardPython.map((row) => `            [${row.join(", ")}]`).join(",\n")}
        ]
        self._is_check = ${toPython(isCheck)}
        self._is_checkmate = ${toPython(isCheckmate)}
        self._is_stalemate = ${toPython(isStalemate)}
        self._is_game_over = ${toPython(isGameOver)}
        self._turn = '${turn}'
        self._pieces = {}
${pieceMappings}

    def legal_moves(self):
        return self._moves.copy()

    def is_check(self):
        return self._is_check

    def is_checkmate(self):
        return self._is_checkmate

    def is_stalemate(self):
        return self._is_stalemate

    def is_game_over(self):
        return self._is_game_over

    def get_board(self):
        return [row.copy() for row in self._board]

    def piece_at(self, square):
        return self._pieces.get(square)

    def turn(self):
        return self._turn

# Initialize the board object
board = MockBoard()
`;

  return pythonCode;
};

/**
 * Generate piece mapping for all squares
 * @param {Chess} chess - Chess.js instance
 * @returns {string} - Python code for piece mapping
 */
const generatePieceMapping = (chess) => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];

  const mappings = [];
  for (const file of files) {
    for (const rank of ranks) {
      const square = file + rank;
      const piece = chess.get(square);
      if (piece) {
        mappings.push(
          `self._pieces['${square}'] = {'type': '${piece.type}', 'color': '${piece.color}'}`
        );
      } else {
        mappings.push(`self._pieces['${square}'] = None`);
      }
    }
  }

  return mappings.map((m) => `        ${m}`).join("\n");
};

/**
 * Get complete Python code for testing a bot
 * @param {string} userCode - User's bot code
 * @param {string} fen - FEN string for test position
 * @param {string} predefinedFunctions - Predefined chess functions
 * @returns {string} - Complete Python code ready for execution
 */
export const getTestCode = (userCode, fen, predefinedFunctions) => {
  const boardMock = generateBoardMock(fen);

  return `${boardMock}

${predefinedFunctions}

# User code starts here:
${userCode}

# Test execution
try:
    move = getMove()
    print(f"Bot chose move: {move}")

    # Validate the move
    legal = legal_moves()
    if move in legal:
        print(f"✓ Valid move! '{move}' is legal.")
    else:
        print(f"✗ Invalid move! '{move}' is not in legal moves: {legal}")
except NameError as e:
    if "getMove" in str(e):
        print("ERROR: getMove() function not defined. Please define a getMove() function.")
    else:
        print(f"ERROR: {e}")
except Exception as e:
    print(f"ERROR: {e}")
`;
};

/**
 * Validate that user code contains getMove function
 * @param {string} code - User's code
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateBotCode = (code) => {
  // Check if getMove function is defined
  const getMoveRegex = /def\s+getMove\s*\(/;

  if (!getMoveRegex.test(code)) {
    return {
      isValid: false,
      error: "Missing required function: getMove()\n\nYour bot must define a getMove() function that returns a move.",
    };
  }

  return { isValid: true, error: null };
};
