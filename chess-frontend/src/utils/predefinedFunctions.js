/**
 * Predefined Python functions that are available to users in the editor.
 * These functions provide access to chess game state and operations.
 *
 * Note: The 'board' object represents the current chess position and is
 * automatically initialized before your code runs.
 */

export const PREDEFINED_FUNCTIONS = `
# Chess API - Predefined functions for building your chess bot
# These functions interact with the current board state

import random

def legal_moves():
    """
    Get all legal moves in the current position.

    Returns:
        list: List of legal moves in standard algebraic notation (e.g., ['e2e4', 'g1f3'])
    """
    return board.legal_moves()

def is_checkmate():
    """
    Check if the current position is checkmate.

    Returns:
        bool: True if current position is checkmate, False otherwise
    """
    return board.is_checkmate()

def is_check():
    """
    Check if the current player's king is in check.

    Returns:
        bool: True if king is in check, False otherwise
    """
    return board.is_check()

def is_stalemate():
    """
    Check if the current position is stalemate.

    Returns:
        bool: True if stalemate, False otherwise
    """
    return board.is_stalemate()

def is_game_over():
    """
    Check if the game has ended (checkmate, stalemate, or draw).

    Returns:
        bool: True if game is over, False otherwise
    """
    return board.is_game_over()

def get_board():
    """
    Get the current board state as a 2D array.
    Each square contains a piece object or None.

    Returns:
        list: 8x8 array representing the board
              Format: board[row][col] where row 0 is rank 8, col 0 is file 'a'

    Example:
        board_state = get_board()
        piece = board_state[0][4]  # Piece at e8
    """
    return board.get_board()

def piece_at(square):
    """
    Get the piece at a specific square.

    Args:
        square (str): Square in algebraic notation (e.g., 'e4', 'a1')

    Returns:
        dict: Piece object with 'type' and 'color' keys, or None if square is empty
              Example: {'type': 'p', 'color': 'w'} for white pawn

    Piece types: 'p' (pawn), 'n' (knight), 'b' (bishop),
                 'r' (rook), 'q' (queen), 'k' (king)
    Colors: 'w' (white), 'b' (black)
    """
    return board.piece_at(square)

def turn():
    """
    Get whose turn it is to move.

    Returns:
        str: 'w' for white, 'b' for black
    """
    return board.current_turn

def get_board_after_move(current_board, move):
    """
    Simulate a move and get the resulting board state.
    This allows you to look ahead and analyze positions after potential moves.

    Args:
        current_board: The current board object
        move (tuple or str): The move to simulate, either as:
            - A tuple: ('e2', 'e4') for source and target squares
            - A string: 'e2e4' in UCI notation

    Returns:
        MockBoard: A new board object representing the position after the move

    Example:
        # Check if a move puts opponent in check
        moves = legal_moves()
        if moves:
            test_move = moves[0][:2], moves[0][2:4]  # Convert 'e2e4' to ('e2', 'e4')
            future_board = get_board_after_move(board, test_move)
            if future_board.is_check():
                print("This move gives check!")
    """
    # Convert move to UCI format if it's a tuple
    if isinstance(move, tuple):
        move_uci = move[0] + move[1]
    else:
        move_uci = move

    # Validate the move is legal
    legal = current_board.legal_moves()
    if move_uci not in legal:
        raise ValueError(f"Illegal move: {move_uci}. Legal moves: {legal}")

    # This will be replaced by the actual board simulation code
    # injected by the JavaScript bridge
    return _simulate_move(current_board, move_uci)

def get_available_functions():
    """List all available chess functions"""
    functions = [
        "legal_moves() - Get all legal moves in current position",
        "is_checkmate() - Check if position is checkmate",
        "is_check() - Check if king is in check",
        "is_stalemate() - Check if position is stalemate",
        "is_game_over() - Check if game has ended",
        "get_board() - Get board state as 2D array",
        "piece_at(square) - Get piece at specific square",
        "turn() - Get whose turn it is ('w' or 'b')",
        "get_board_after_move(board, move) - Simulate a move and get resulting board",
        "get_available_functions() - List all available functions"
    ]
    for func in functions:
        print(f"  • {func}")
    return functions

`;

/**
 * Get the complete code to execute, including predefined functions
 * @param {string} userCode - The code written by the user
 * @returns {string} - Complete code with predefined functions prepended
 */
export const getCompleteCode = (userCode) => {
  return PREDEFINED_FUNCTIONS + "\n\n# User code starts here:\n" + userCode;
};

/**
 * Add a new predefined function
 * This is a template for how you might extend this system
 */
export const addCustomFunction = (functionCode) => {
  // This would require state management to dynamically add functions
  // For now, add functions directly to PREDEFINED_FUNCTIONS above
  console.warn("To add functions, edit PREDEFINED_FUNCTIONS in predefinedFunctions.js");
};
