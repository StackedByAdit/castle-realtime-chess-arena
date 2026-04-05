export type Player = {
    id : string;
    rating : number;
}

export type CompletedGame = {
  gameId: string;
  players: Player[];
  pgn: string;
  moves: string[];
  createdAt: number;
  result: {
    winner: string | null;
    reason: string | null;
  };
};