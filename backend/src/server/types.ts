export type Player = {
    id : string;
    rating : number;
}

export type CompletedGame = {
  gameId: string;
  players: Player[];
  pgn: string;
  moves: Move[];
  createdAt: number;
  result: {
    winner: string | null;
    reason: string | null;
  };
};

export type Move = {
  color: string;
  from: string;
  to: string;
  piece: string;
  san: string;
};