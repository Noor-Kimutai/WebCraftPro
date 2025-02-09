import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { GameCard } from "@/components/game/GameCard";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { subscribeToGame, makeMove, type Move, type GameState } from "@/lib/gameState";
import { auth } from "@/lib/firebase";

export default function Game() {
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);

  const gameId = params.id;

  useEffect(() => {
    if (!gameId || !auth.currentUser) {
      setLocation('/lobby');
      return;
    }

    const unsubscribe = subscribeToGame(gameId, (state) => {
      setGameState(state);

      // Reset selected move when round is complete
      if (state.roundComplete) {
        setSelectedMove(null);

        const message = state.regularRoundsComplete && state.isTieBreaker
          ? "Tie breaker round! First to win takes the game!"
          : "Round complete! Get ready for the next round...";

        toast({
          title: "Round Complete!",
          description: message,
        });
      }

      // Handle game completion
      if (state.status === 'complete' && state.winner) {
        const winnerName = state.winner === state.player1.id 
          ? state.player1.displayName 
          : state.player2.displayName;

        toast({
          title: "Game Over!",
          description: `${winnerName} wins the game!`,
          duration: 5000,
        });
        setTimeout(() => setLocation("/lobby"), 5000);
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  const handleMove = async (move: Move) => {
    if (!gameState || !auth.currentUser || !gameId) return;

    try {
      setSelectedMove(move);
      await makeMove(gameId, auth.currentUser.uid, move);

      toast({
        title: "Move Made",
        description: "Waiting for opponent...",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to make move",
      });
      setSelectedMove(null);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading game...</p>
      </div>
    );
  }

  const isPlayer1 = auth.currentUser?.uid === gameState.player1.id;
  const currentPlayer = isPlayer1 ? gameState.player1 : gameState.player2;
  const opponent = isPlayer1 ? gameState.player2 : gameState.player1;

  // Determine if player can make a move
  const canMove = !currentPlayer.move && !gameState.roundComplete && gameState.status === 'active';

  return (
    <div className="min-h-screen p-8 space-y-8">
      <ScoreBoard
        player1Score={gameState.player1.score}
        player2Score={gameState.player2.score}
        currentRound={gameState.currentRound}
        player1Name={gameState.player1.displayName}
        player2Name={gameState.player2.displayName}
        isTieBreaker={gameState.isTieBreaker}
      />

      <div className="text-center mb-4">
        {gameState.status === 'complete' ? (
          <div className="text-lg font-medium text-primary">
            Game Over! {gameState.winner === currentPlayer.id ? "You won!" : `${opponent.displayName} won!`}
          </div>
        ) : gameState.roundComplete ? (
          <div className="text-lg font-medium text-primary">
            {gameState.isTieBreaker ? "Tie breaker round!" : "Round complete! Next round starting soon..."}
          </div>
        ) : currentPlayer.move ? (
          <div className="text-lg text-muted-foreground">
            Waiting for {opponent.displayName}'s move...
          </div>
        ) : (
          <div className="text-lg font-medium">
            Your turn! Make your move
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        {(["rock", "paper", "scissors"] as Move[]).map((move) => (
          <GameCard
            key={move}
            move={move}
            selected={selectedMove === move}
            disabled={!canMove}
            onSelect={handleMove}
          />
        ))}
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => {
            if (window.confirm('Are you sure you want to leave the game?')) {
              setLocation("/lobby");
            }
          }}
        >
          Leave Game
        </Button>
      </div>
    </div>
  );
}