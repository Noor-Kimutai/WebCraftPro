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
  roundComplete?: boolean;
  roundInProgress?: boolean;
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
    const gameState = snapshot.val() as GameState;
    console.log("Game state updated:", gameState);
    callback(gameState);
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

  // Prevent moves during round transition
  if (game.roundInProgress) {
    throw new Error("Round is in progress");
  }

  // Start new round if needed
  if (!game.roundInProgress && !game[playerKey].move) {
    await update(gameRef, {
      roundInProgress: true,
      roundComplete: false,
      [`${playerKey}/move`]: null,
      [`${opponentKey}/move`]: null
    });
  }

  // Update the player's move
  const updates: any = {
    [`${playerKey}/move`]: move
  };

  // Check if opponent has moved
  if (game[opponentKey].move) {
    console.log("Both players have moved, determining winner");
    const winner = determineWinner(
      isPlayer1 ? move : game[opponentKey].move!,
      isPlayer1 ? game[opponentKey].move! : move
    );

    if (winner === 1) {
      updates[`${playerKey}/score`] = game[playerKey].score + 1;
    } else if (winner === 2) {
      updates[`${opponentKey}/score`] = game[opponentKey].score + 1;
    }

    // Mark round as complete
    updates.roundComplete = true;
    updates.roundInProgress = false;
    updates.currentRound = game.currentRound + 1;

    // Check if game is over (someone reached 3 points)
    if (game[playerKey].score + (winner === 1 ? 1 : 0) >= 3) {
      updates.winner = playerId;
    } else if (game[opponentKey].score + (winner === 2 ? 1 : 0) >= 3) {
      updates.winner = game[opponentKey].id;
    }

    // Auto-reset round state after delay
    setTimeout(async () => {
      console.log("Auto-resetting round state");
      await update(gameRef, {
        [`${playerKey}/move`]: null,
        [`${opponentKey}/move`]: null,
        roundComplete: false,
        roundInProgress: false
      });
    }, 2000);
  }

  // Update the game state
  console.log("Updating game state with:", updates);
  await update(gameRef, updates);
};