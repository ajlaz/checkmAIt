export const getTestCode = (sourceCode, fen, predefinedFunctions) => {
  return `
# Lightweight Chess Board Implementation
class ChessBoard:
    def __init__(self, fen):
        self.fen = fen
        self._parse_fen(fen)

    def _parse_fen(self, fen):
        parts = fen.split(' ')
        self.board_str = parts[0]
        self.current_turn = parts[1]  # 'w' or 'b'
        self.castling = parts[2] if len(parts) > 2 else '-'
        self.en_passant = parts[3] if len(parts) > 3 else '-'

        # Parse board into 8x8 array
        self.board = []
        rows = self.board_str.split('/')
        for row in rows:
            board_row = []
            for char in row:
                if char.isdigit():
                    board_row.extend([None] * int(char))
                else:
                    board_row.append(char)
            self.board.append(board_row)

    def piece_at(self, square):
        """Get piece at square (e.g., 'e4')"""
        file = ord(square[0]) - ord('a')
        rank = 8 - int(square[1])
        if 0 <= rank < 8 and 0 <= file < 8:
            piece = self.board[rank][file]
            if piece:
                color = 'w' if piece.isupper() else 'b'
                return {'type': piece.lower(), 'color': color}
        return None

    def get_board(self):
        """Get the full board as 8x8 array"""
        return [row[:] for row in self.board]

    def legal_moves(self):
        """Get list of legal moves in UCI format (e.g., 'e2e4')"""
        moves = []
        for rank in range(8):
            for file in range(8):
                piece = self.board[rank][file]
                if piece and ((self.current_turn == 'w' and piece.isupper()) or (self.current_turn == 'b' and piece.islower())):
                    from_sq = chr(file + ord('a')) + str(8 - rank)
                    moves.extend(self._get_piece_moves(from_sq, piece, rank, file))
        return moves

    def _get_piece_moves(self, from_sq, piece, rank, file):
        """Get possible moves for a piece (simplified)"""
        moves = []
        piece_type = piece.lower()

        # Pawn moves
        if piece_type == 'p':
            direction = -1 if piece.isupper() else 1
            # Move forward
            if 0 <= rank + direction < 8 and self.board[rank + direction][file] is None:
                to_sq = chr(file + ord('a')) + str(8 - (rank + direction))
                moves.append(from_sq + to_sq)
                # Double move from starting position
                if (rank == 6 and piece.isupper()) or (rank == 1 and piece.islower()):
                    if self.board[rank + 2*direction][file] is None:
                        to_sq = chr(file + ord('a')) + str(8 - (rank + 2*direction))
                        moves.append(from_sq + to_sq)
            # Captures
            for df in [-1, 1]:
                new_file = file + df
                new_rank = rank + direction
                if 0 <= new_file < 8 and 0 <= new_rank < 8:
                    target = self.board[new_rank][new_file]
                    if target and ((piece.isupper() and target.islower()) or (piece.islower() and target.isupper())):
                        to_sq = chr(new_file + ord('a')) + str(8 - new_rank)
                        moves.append(from_sq + to_sq)

        # Knight moves
        elif piece_type == 'n':
            knight_moves = [(-2,-1),(-2,1),(-1,-2),(-1,2),(1,-2),(1,2),(2,-1),(2,1)]
            for dr, df in knight_moves:
                new_rank, new_file = rank + dr, file + df
                if 0 <= new_rank < 8 and 0 <= new_file < 8:
                    target = self.board[new_rank][new_file]
                    if target is None or ((piece.isupper() and target.islower()) or (piece.islower() and target.isupper())):
                        to_sq = chr(new_file + ord('a')) + str(8 - new_rank)
                        moves.append(from_sq + to_sq)

        # King moves
        elif piece_type == 'k':
            for dr in [-1, 0, 1]:
                for df in [-1, 0, 1]:
                    if dr == 0 and df == 0:
                        continue
                    new_rank, new_file = rank + dr, file + df
                    if 0 <= new_rank < 8 and 0 <= new_file < 8:
                        target = self.board[new_rank][new_file]
                        if target is None or ((piece.isupper() and target.islower()) or (piece.islower() and target.isupper())):
                            to_sq = chr(new_file + ord('a')) + str(8 - new_rank)
                            moves.append(from_sq + to_sq)

        # Rook, Bishop, Queen (sliding pieces)
        else:
            directions = []
            if piece_type in ['r', 'q']:  # Rook and Queen
                directions.extend([(0,1), (0,-1), (1,0), (-1,0)])
            if piece_type in ['b', 'q']:  # Bishop and Queen
                directions.extend([(1,1), (1,-1), (-1,1), (-1,-1)])

            for dr, df in directions:
                for dist in range(1, 8):
                    new_rank = rank + dr * dist
                    new_file = file + df * dist
                    if not (0 <= new_rank < 8 and 0 <= new_file < 8):
                        break
                    target = self.board[new_rank][new_file]
                    to_sq = chr(new_file + ord('a')) + str(8 - new_rank)
                    if target is None:
                        moves.append(from_sq + to_sq)
                    else:
                        if (piece.isupper() and target.islower()) or (piece.islower() and target.isupper()):
                            moves.append(from_sq + to_sq)
                        break

        return moves

    def is_check(self):
        """Simplified check detection"""
        return False  # Simplified for now

    def is_checkmate(self):
        """Simplified checkmate detection"""
        return len(self.legal_moves()) == 0

    def is_stalemate(self):
        """Simplified stalemate detection"""
        return False  # Simplified for now

    def is_game_over(self):
        """Check if game is over"""
        return len(self.legal_moves()) == 0

# Initialize the chess board with the current position
board = ChessBoard('${fen}')

${predefinedFunctions}

${sourceCode}

# Test the getMove function with the given position
move = getMove(board)

# Validate move format
if not isinstance(move, tuple) or len(move) != 2:
    print("Error: Move must be a tuple of (source_square, target_square)")
    exit(1)

source_square, target_square = move
print(f"Move: {source_square} -> {target_square}")
`;
};

export const validateBotCode = (sourceCode) => {
  // Check if getMove function exists and returns source-target format
  if (!sourceCode.includes('def getMove(')) {
    return {
      isValid: false,
      error: 'Missing getMove(board) function. Function should return (source_square, target_square)'
    };
  }
  return { isValid: true };
};

export const CODE_SNIPPETS = {
  python: `def getMove(board):
    """
    Input: board - a ChessBoard object with the current position
    Output: tuple of (source_square, target_square)
    Example: return ('e2', 'e4')  # moves pawn from e2 to e4
    """
    # Get all legal moves (returns list of UCI strings like ['e2e4', 'g1f3'])
    moves = board.legal_moves()

    if not moves:
        return None

    # Get the first legal move
    first_move = moves[0]

    # Convert UCI format 'e2e4' to tuple ('e2', 'e4')
    source_square = first_move[:2]  # First 2 characters (e.g., 'e2')
    target_square = first_move[2:4]  # Next 2 characters (e.g., 'e4')

    return (source_square, target_square)
`
};