/**
 * Monaco Editor autocomplete configuration for predefined Python functions
 */

/**
 * Define your predefined functions with their signatures and documentation
 * These will appear in Monaco's IntelliSense autocomplete
 */
export const PREDEFINED_FUNCTION_COMPLETIONS = [
  {
    label: "getMove",
    kind: "Function",
    insertText: "def getMove():\n\t${1:# Your chess bot logic here}\n\treturn ${2:move}",
    insertTextRules: "InsertAsSnippet",
    documentation: "REQUIRED: Main function that returns your bot's chosen move.\n\nThis function is called when it's your turn to move.\nIt must return a move in standard algebraic notation (e.g., 'e2e4', 'g1f3').\n\nReturns:\n    str: Move in algebraic notation (e.g., 'e2e4')",
    detail: "def getMove() -> str  [REQUIRED]",
  },
  {
    label: "legal_moves",
    kind: "Function",
    insertText: "legal_moves()",
    insertTextRules: "InsertAsSnippet",
    documentation: "Get all legal moves in the current position.\n\nReturns:\n    list: List of legal moves in algebraic notation\n\nExample:\n    moves = legal_moves()\n    # ['e2e4', 'e2e3', 'g1f3', ...]",
    detail: "legal_moves() -> list[str]",
  },
  {
    label: "is_checkmate",
    kind: "Function",
    insertText: "is_checkmate()",
    insertTextRules: "InsertAsSnippet",
    documentation: "Check if the current position is checkmate.\n\nReturns:\n    bool: True if checkmate, False otherwise",
    detail: "is_checkmate() -> bool",
  },
  {
    label: "is_check",
    kind: "Function",
    insertText: "is_check()",
    insertTextRules: "InsertAsSnippet",
    documentation: "Check if the current player's king is in check.\n\nReturns:\n    bool: True if in check, False otherwise",
    detail: "is_check() -> bool",
  },
  {
    label: "is_stalemate",
    kind: "Function",
    insertText: "is_stalemate()",
    insertTextRules: "InsertAsSnippet",
    documentation: "Check if the current position is stalemate.\n\nReturns:\n    bool: True if stalemate, False otherwise",
    detail: "is_stalemate() -> bool",
  },
  {
    label: "is_game_over",
    kind: "Function",
    insertText: "is_game_over()",
    insertTextRules: "InsertAsSnippet",
    documentation: "Check if the game has ended (checkmate, stalemate, or draw).\n\nReturns:\n    bool: True if game over, False otherwise",
    detail: "is_game_over() -> bool",
  },
  {
    label: "get_board",
    kind: "Function",
    insertText: "get_board()",
    insertTextRules: "InsertAsSnippet",
    documentation: "Get the current board state as a 2D array.\n\nReturns:\n    list: 8x8 array where board[row][col] contains piece or None\n          Row 0 is rank 8, col 0 is file 'a'\n\nExample:\n    board = get_board()\n    piece = board[0][4]  # Piece at e8",
    detail: "get_board() -> list[list]",
  },
  {
    label: "piece_at",
    kind: "Function",
    insertText: "piece_at(${1:square})",
    insertTextRules: "InsertAsSnippet",
    documentation: "Get the piece at a specific square.\n\nArgs:\n    square (str): Square in algebraic notation (e.g., 'e4', 'a1')\n\nReturns:\n    dict | None: Piece with 'type' and 'color', or None if empty\n                 Example: {'type': 'p', 'color': 'w'}\n\nPiece types: 'p' (pawn), 'n' (knight), 'b' (bishop),\n             'r' (rook), 'q' (queen), 'k' (king)\nColors: 'w' (white), 'b' (black)",
    detail: "piece_at(square: str) -> dict | None",
  },
  {
    label: "turn",
    kind: "Function",
    insertText: "turn()",
    insertTextRules: "InsertAsSnippet",
    documentation: "Get whose turn it is to move.\n\nReturns:\n    str: 'w' for white, 'b' for black",
    detail: "turn() -> str",
  },
  {
    label: "get_available_functions",
    kind: "Function",
    insertText: "get_available_functions()",
    insertTextRules: "InsertAsSnippet",
    documentation: "List all available chess functions.\n\nReturns:\n    list: A list of all available function descriptions",
    detail: "get_available_functions() -> list",
  },
];

/**
 * Register completion provider for Monaco editor
 * @param {object} monaco - Monaco editor instance
 */
export const registerCompletionProvider = (monaco) => {
  monaco.languages.registerCompletionItemProvider("python", {
    provideCompletionItems: (model, position) => {
      // Word matching for filtering suggestions
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Convert our function definitions to Monaco completion items
      const suggestions = PREDEFINED_FUNCTION_COMPLETIONS.map((func) => ({
        label: func.label,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: func.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: func.documentation,
        detail: func.detail,
        range: range,
      }));

      return { suggestions };
    },
  });
};

/**
 * Template for adding a new function to autocomplete
 * Copy this and add to PREDEFINED_FUNCTION_COMPLETIONS array above
 */
export const FUNCTION_TEMPLATE = {
  label: "function_name",
  kind: "Function",
  insertText: "function_name(${1:param1}, ${2:param2})",
  insertTextRules: "InsertAsSnippet",
  documentation: "Brief description\n\nArgs:\n    param1 (type): Description\n    param2 (type): Description\n\nReturns:\n    type: Description",
  detail: "function_name(param1: type, param2: type) -> return_type",
};
