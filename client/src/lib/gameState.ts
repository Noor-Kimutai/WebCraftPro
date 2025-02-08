import { ref, onValue, off, get, update } from "firebase/database";
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
  const snapshot = await get(gameRef);
  const game = snapshot.val() as GameState;

  if (!game) throw new Error("Game not found");

  // Determine if the player is player1 or player2
  const isPlayer1 = playerId === game.player1.id;
  const playerKey = isPlayer1 ? "player1" : "player2";
  const opponentKey = isPlayer1 ? "player2" : "player1";

  // Update the player's move
  const updates: any = {
    [`${playerKey}/move`]: move
  };

  // If both players have moved, determine the winner
  if (game[opponentKey].move) {
    const winner = determineWinner(
      isPlayer1 ? move : game[opponentKey].move!,
      isPlayer1 ? game[opponentKey].move! : move
    );

    if (winner === 1) {
      updates[`${playerKey}/score`] = game[playerKey].score + 1;
    } else if (winner === 2) {
      updates[`${opponentKey}/score`] = game[opponentKey].score + 1;
    }

    // Clear moves for next round
    updates[`${playerKey}/move`] = null;
    updates[`${opponentKey}/move`] = null;
    updates.currentRound = game.currentRound + 1;

    // Check if game is over (someone reached 3 points)
    if (game[playerKey].score + (winner === 1 ? 1 : 0) >= 3) {
      updates.winner = playerId;
    } else if (game[opponentKey].score + (winner === 2 ? 1 : 0) >= 3) {
      updates.winner = game[opponentKey].id;
    }
  }

  // Update the game state
  await update(gameRef, updates);
};