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
  status: 'waiting' | 'active' | 'complete';
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

  const unsubscribe = onValue(gameRef, (snapshot) => {
    const gameState = snapshot.val() as GameState;
    if (gameState) {
      // Ensure default values
      gameState.currentRound = gameState.currentRound || 1;
      gameState.player1.score = gameState.player1.score || 0;
      gameState.player2.score = gameState.player2.score || 0;
      gameState.status = gameState.status || 'active';
      callback(gameState);
    }
  });

  return unsubscribe;
};

export const makeMove = async (gameId: string, playerId: string, move: Move) => {
  const gameRef = ref(db, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val() as GameState;

  if (!game) throw new Error("Game not found");
  if (game.status !== 'active') throw new Error("Game is not active");

  // Determine if the player is player1 or player2
  const isPlayer1 = playerId === game.player1.id;
  const playerKey = isPlayer1 ? "player1" : "player2";
  const opponentKey = isPlayer1 ? "player2" : "player1";

  // Validate move
  if (game[playerKey].move) {
    throw new Error("You've already made your move for this round");
  }

  if (game.roundComplete) {
    throw new Error("Waiting for next round to start");
  }

  // Make the move
  const updates: any = {
    [`${playerKey}/move`]: move,
    roundInProgress: true
  };

  // If opponent has moved, calculate round result
  if (game[opponentKey].move) {
    const winner = determineWinner(
      isPlayer1 ? move : game[opponentKey].move!,
      isPlayer1 ? game[opponentKey].move! : move
    );

    // Update scores
    if (winner === 1) {
      updates[`${playerKey}/score`] = (game[playerKey].score || 0) + 1;
    } else if (winner === 2) {
      updates[`${opponentKey}/score`] = (game[opponentKey].score || 0) + 1;
    }

    // Mark round as complete
    updates.roundComplete = true;
    updates.roundInProgress = false;
    updates.currentRound = (game.currentRound || 1) + 1;

    // Check for game winner
    const playerNewScore = winner === 1 ? (game[playerKey].score || 0) + 1 : game[playerKey].score || 0;
    const opponentNewScore = winner === 2 ? (game[opponentKey].score || 0) + 1 : game[opponentKey].score || 0;

    if (playerNewScore >= 3) {
      updates.winner = playerId;
      updates.status = 'complete';
    } else if (opponentNewScore >= 3) {
      updates.winner = game[opponentKey].id;
      updates.status = 'complete';
    }

    // Schedule round reset after delay
    setTimeout(async () => {
      if (updates.status !== 'complete') {
        const resetUpdates = {
          [`${playerKey}/move`]: null,
          [`${opponentKey}/move`]: null,
          roundComplete: false,
          roundInProgress: false
        };
        await update(gameRef, resetUpdates);
      }
    }, 3000);
  }

  // Update game state
  await update(gameRef, updates);
};