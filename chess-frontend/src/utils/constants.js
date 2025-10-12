export const LANGUAGE_VERSIONS = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  python: "3.10.0",
  java: "15.0.2",
  csharp: "6.12.0",
  php: "8.2.3",
};

export const CODE_SNIPPETS = {
  javascript: `\nfunction greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n`,
  typescript: `\ntype Params = {\n\tname: string;\n}\n\nfunction greet(data: Params) {\n\tconsole.log("Hello, " + data.name + "!");\n}\n\ngreet({ name: "Alex" });\n`,
  python: `"""
Chess Bot Template

Write your chess bot by implementing the getMove(board) function.
This function will be called when it's your turn to move.

Available methods on board object:
- board.legal_moves() - Get all legal moves as list of UCI strings (e.g., ['e2e4', 'g1f3'])
- board.is_check() - Check if king is in check
- board.is_checkmate() - Check if position is checkmate
- board.is_stalemate() - Check if position is stalemate
- board.is_game_over() - Check if game ended
- board.piece_at(square) - Get piece at a square (e.g., 'e4')
- board.get_board() - Get board as 2D array
- board.current_turn - Get current turn ('w' or 'b')

You can also use predefined helper functions like:
- legal_moves(), is_check(), is_checkmate(), turn(), etc.
- get_board_after_move(board, move) - Simulate a move and see the resulting board!
"""

def getMove(board):
    """
    REQUIRED: Return your bot's chosen move.

    Args:
        board: ChessBoard object representing current position

    Returns:
        tuple: (source_square, target_square) in algebraic notation
        Example: ('e2', 'e4') to move pawn from e2 to e4
    """
    # Get all legal moves in UCI format (e.g., 'e2e4')
    moves = board.legal_moves()

    # Example strategy: prefer moves that give check
    for move_str in moves:
        # Convert 'e2e4' to tuple ('e2', 'e4')
        move_tuple = (move_str[:2], move_str[2:4])

        # Simulate this move and check if it puts opponent in check
        future_board = get_board_after_move(board, move_tuple)
        if future_board.is_check():
            print(f"Found a checking move: {move_tuple}")
            return move_tuple

    # If no checking moves, pick a random move
    if len(moves) > 0:
        randomMove = moves[random.randint(0, len(moves) - 1)]
        return (randomMove[:2], randomMove[2:4])

    return None  # No legal moves available


# Test your bot logic here
print("Chess bot ready!")
print("Your getMove function will be called automatically during games.")
`,
  java: `\npublic class HelloWorld {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}\n`,
  csharp:
    'using System;\n\nnamespace HelloWorld\n{\n\tclass Hello { \n\t\tstatic void Main(string[] args) {\n\t\t\tConsole.WriteLine("Hello World in C#");\n\t\t}\n\t}\n}\n',
  php: "<?php\n\n$name = 'Alex';\necho $name;\n",
};
