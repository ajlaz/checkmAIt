import { executeCode } from '../services/api';
import { getTestCode } from './codeUtils';
import { PREDEFINED_FUNCTIONS } from './predefinedFunctions';

/**
 * Execute bot code to get next move
 * @param {string} botCode - The Python bot code
 * @param {string} fen - Current board position in FEN
 * @returns {Promise<[string, string]>} Promise resolving to [sourceSquare, targetSquare]
 */
export const getBotMove = async (botCode, fen) => {
  // Generate complete test code with current board
  const completeCode = getTestCode(botCode, fen, PREDEFINED_FUNCTIONS);

  // Execute via API
  const { run: result } = await executeCode('python', completeCode);

  if (result.stderr) {
    throw new Error(`Bot error: ${result.stderr}`);
  }

  // Parse move from output
  const output = result.output.trim();
  if (!output.startsWith('Move:')) {
    throw new Error('Invalid bot output format');
  }

  // Extract source and target squares
  const moveMatch = output.match(/Move: (\w+) -> (\w+)/);
  if (!moveMatch) {
    throw new Error('Could not parse move from bot output');
  }

  return [moveMatch[1], moveMatch[2]];
};