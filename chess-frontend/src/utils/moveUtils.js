export const convertMoveFormat = (move) => {
  if (!move || !Array.isArray(move) || move.length !== 2) {
    throw new Error('Invalid move format');
  }
  
  const [source, target] = move;
  if (typeof source !== 'string' || typeof target !== 'string') {
    throw new Error('Source and target squares must be strings');
  }
  
  // Validate square format (e.g., 'e2', 'e4')
  const squareRegex = /^[a-h][1-8]$/;
  if (!squareRegex.test(source) || !squareRegex.test(target)) {
    throw new Error('Invalid square notation');
  }
  
  return { sourceSquare: source, targetSquare: target };
};