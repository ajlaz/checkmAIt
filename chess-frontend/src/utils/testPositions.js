/**
 * Test chess positions for local bot testing
 * Each position includes a FEN string and description
 */

export const TEST_POSITIONS = [
  {
    id: "starting",
    name: "Starting Position",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    description: "Standard chess starting position",
  },
  {
    id: "middlegame",
    name: "Middlegame Position",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    description: "Italian Game opening, middlegame position",
  },
  {
    id: "endgame",
    name: "Endgame Position",
    fen: "8/5k2/3p4/1p1Pp2p/pP2Pp1P/P4P1K/8/8 b - - 99 50",
    description: "King and pawn endgame",
  },
  {
    id: "check",
    name: "King in Check",
    fen: "rnbqkb1r/pppp1ppp/5n2/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 3",
    description: "Black king is in check from white queen",
  },
  {
    id: "mate_in_one",
    name: "Mate in One (White)",
    fen: "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4",
    description: "White can deliver checkmate in one move",
  },
  {
    id: "stalemate_risk",
    name: "Stalemate Risk",
    fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
    description: "White must be careful not to stalemate",
  },
];

export const DEFAULT_TEST_POSITION = TEST_POSITIONS[0];
