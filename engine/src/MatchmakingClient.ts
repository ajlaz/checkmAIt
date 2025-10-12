import axios from 'axios';

export class MatchmakingClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Notify matchmaking service to clean up a match after game ends
   */
  async cleanupMatch(matchId: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/matchmaking/cleanup/match/${matchId}`);
      console.log(`Successfully cleaned up match: ${matchId}`);
    } catch (error) {
      console.error(`Failed to cleanup match ${matchId}:`, error);
    }
  }

  /**
   * Notify matchmaking service to clean up a player after disconnect
   */
  async cleanupPlayer(userId: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/matchmaking/cleanup/player/${userId}`);
      console.log(`Successfully cleaned up player: ${userId}`);
    } catch (error) {
      console.error(`Failed to cleanup player ${userId}:`, error);
    }
  }
}
