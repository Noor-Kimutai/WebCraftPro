import { ref, onValue, off } from "firebase/database";
import { db } from "./firebase";

export type Move = "rock" | "paper" | "scissors";
export type GameState = {
  currentRound: number;
  player1: {
    id: string;
    score: number;
    move?: Move;
  };
  player2: {
    id: string;
    score: number;
    move?: Move;
  };
  winner?: string;
};

export const determineWinner = (move1: Move, move2: Move): number => {
  if (move1 === move2) return 0;
  if (
    (move1 === "rock" && move2 === "scissors") ||
    (move1 === "paper" && move2 === "rock") ||
    (move1 === "scissors" && move2 === "paper")
  ) {
    return 1;
  }
  return 2;
};

export const subscribeToGame = (gameId: string, callback: (state: GameState) => void) => {
  const gameRef = ref(db, `games/${gameId}`);
  onValue(gameRef, (snapshot) => {
    callback(snapshot.val() as GameState);
  });

  return () => {
    off(gameRef);
  };
};

export const makeMove = async (gameId: string, playerId: string, move: Move) => {
  const gameRef = ref(db, `games/${gameId}`);
  const playerKey = `player${playerId === "1" ? "1" : "2"}.move`;
  await gameRef.update({ [playerKey]: move });
};
