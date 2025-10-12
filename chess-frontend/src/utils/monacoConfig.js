export const PREDEFINED_FUNCTION_COMPLETIONS = [
  {
    label: "getMove",
    kind: "Function",
    insertText: "def getMove(board):\n\t\"\"\"Get next move for the bot\n\tArgs:\n\t\tboard: chess.Board object\n\tReturns:\n\t\ttuple: (source_square, target_square) e.g. ('e2', 'e4')\n\t\"\"\"\n\t${1:# Your chess bot logic here}\n\treturn ${2:('e2', 'e4')}  # Example move",
    insertTextRules: "InsertAsSnippet",
    documentation: "REQUIRED: Main function that returns your bot's chosen move.\n\nThis function is called when it's your turn to move.\nIt must return a tuple of (source_square, target_square).\n\nArgs:\n    board: chess.Board object representing current position\n\nReturns:\n    tuple: Source and target squares (e.g., ('e2', 'e4'))",
    detail: "def getMove(board) -> tuple[str, str]  [REQUIRED]",
  },
  {
    label: "board.legal_moves",
    kind: "Method",
    insertText: "board.legal_moves()",
    insertTextRules: "InsertAsSnippet",
    documentation: "Get all legal moves in UCI format.\n\nReturns a list of move strings like ['e2e4', 'g1f3', 'a2a3']\n\nExample:\n    moves = board.legal_moves()\n    if moves:\n        first_move = moves[0]  # e.g., 'e2e4'\n        source = first_move[:2]  # 'e2'\n        target = first_move[2:4]  # 'e4'\n        return (source, target)",
    detail: "board.legal_moves() -> list[str]",
  },
  {
    label: "board.is_checkmate",
    kind: "Property",
    insertText: "board.is_checkmate()",
    insertTextRules: "InsertAsSnippet",
    documentation: "Check if the current position is checkmate.\n\nReturns:\n    bool: True if checkmate, False otherwise",
    detail: "board.is_checkmate() -> bool",
  },
  {
    label: "board.is_check",
    kind: "Property", 
    insertText: "board.is_check()",
    insertTextRules: "InsertAsSnippet",
    documentation: "Check if the current player's king is in check.\n\nReturns:\n    bool: True if in check, False otherwise",
    detail: "board.is_check() -> bool",
  },
  {
    label: "chess.square_name",
    kind: "Function",
    insertText: "chess.square_name(${1:square})",
    insertTextRules: "InsertAsSnippet", 
    documentation: "Convert a square number to algebraic notation.\n\nArgs:\n    square: Integer square index (0-63)\n\nReturns:\n    str: Square name in algebraic notation (e.g. 'e4')",
    detail: "chess.square_name(square: int) -> str",
  }
];