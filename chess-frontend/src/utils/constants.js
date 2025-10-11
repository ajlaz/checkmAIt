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

Write your chess bot by implementing the getMove() function.
This function will be called when it's your turn to move.

Available functions:
- legal_moves() - Get all legal moves
- is_check() - Check if king is in check
- is_checkmate() - Check if position is checkmate
- is_stalemate() - Check if position is stalemate
- is_game_over() - Check if game ended
- piece_at(square) - Get piece at a square (e.g., 'e4')
- get_board() - Get board as 2D array
- turn() - Get current turn ('w' or 'b')
"""

def getMove():
    """
    REQUIRED: Return your bot's chosen move.

    Returns:
        str: Move in algebraic notation (e.g., 'e2e4', 'g1f3')
    """
    # Get all legal moves
    moves = legal_moves()

    # Example: Simple strategy - just pick the first legal move
    # TODO: Implement your own chess strategy here!

    if len(moves) > 0:
        return moves[0]

    return None  # No legal moves available


# Test your bot logic here
print("Available functions:")
get_available_functions()

print("\\nTesting getMove()...")
# When you click 'Run Code', this will test your bot
`,
  java: `\npublic class HelloWorld {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}\n`,
  csharp:
    'using System;\n\nnamespace HelloWorld\n{\n\tclass Hello { \n\t\tstatic void Main(string[] args) {\n\t\t\tConsole.WriteLine("Hello World in C#");\n\t\t}\n\t}\n}\n',
  php: "<?php\n\n$name = 'Alex';\necho $name;\n",
};
