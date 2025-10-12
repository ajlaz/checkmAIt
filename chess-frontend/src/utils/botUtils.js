// Chess bot template with utility functions
export const DEFAULT_BOT_CODE = `def getMove(board):
    """Get next move for the bot

    Args:
        board: ChessBoard object representing current position

    Returns:
        tuple: (source_square, target_square) e.g. ('e2', 'e4')
    """
    # Get all legal moves in UCI format (e.g., ['e2e4', 'g1f3'])
    moves = board.legal_moves()
    if not moves:
        return None

    # Simple strategy - pick first legal move
    # TODO: Implement your strategy here!
    first_move = moves[0]

    # Convert UCI format 'e2e4' to tuple ('e2', 'e4')
    source_square = first_move[:2]  # First 2 characters
    target_square = first_move[2:4]  # Next 2 characters

    # Return move as (source, target) tuple
    return (source_square, target_square)
`;

// Python utility functions available to the bot
export const PREDEFINED_FUNCTIONS = `
# Python-chess utility functions
import chess

def is_valid_square(square):
    """Check if a string represents a valid chess square
    
    Args:
        square: String like 'e4' or 'a1'
        
    Returns:
        bool: True if valid square, False otherwise
    """
    if not isinstance(square, str):
        return False
    if len(square) != 2:
        return False
    file = square[0]
    rank = square[1]
    return (
        file in 'abcdefgh' and
        rank in '12345678'
    )

def validate_move(move):
    """Validate a move tuple
    
    Args:
        move: Tuple of (source_square, target_square)
        
    Returns:
        bool: True if valid move format, False otherwise
    """
    if not isinstance(move, tuple):
        return False
    if len(move) != 2:
        return False
    source, target = move
    return is_valid_square(source) and is_valid_square(target)
`;