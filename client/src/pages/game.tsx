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

      if (state.winner) {
        toast({
          title: `Game Over!`,
          description: `Player ${state.winner} wins!`,
        });
        setTimeout(() => setLocation("/lobby"), 3000);
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  const handleMove = async (move: Move) => {
    if (!gameState || !auth.currentUser || !gameId) return;

    setSelectedMove(move);
    try {
      await makeMove(gameId, auth.currentUser.uid, move);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to make move. Please try again.",
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

  // Determine if current user is player1 or player2
  const isPlayer1 = auth.currentUser?.uid === gameState.player1.id;
  const currentPlayer = isPlayer1 ? gameState.player1 : gameState.player2;
  const opponent = isPlayer1 ? gameState.player2 : gameState.player1;

  return (
    <div className="min-h-screen p-8 space-y-8">
      <ScoreBoard
        player1Score={gameState.player1.score}
        player2Score={gameState.player2.score}
        currentRound={gameState.currentRound}
        player1Name={`Player ${isPlayer1 ? '(You)' : ''}`}
        player2Name={`Opponent ${!isPlayer1 ? '(You)' : ''}`}
      />

      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        {(["rock", "paper", "scissors"] as Move[]).map((move) => (
          <GameCard
            key={move}
            move={move}
            selected={selectedMove === move}
            disabled={!!selectedMove || !!currentPlayer.move}
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