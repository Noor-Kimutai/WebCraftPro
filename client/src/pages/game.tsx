import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { GameCard } from "@/components/game/GameCard";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { subscribeToGame, makeMove, type Move, type GameState } from "@/lib/gameState";

export default function Game() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  
  useEffect(() => {
    const gameId = "current-game-id"; // Replace with actual game ID
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
  }, []);

  const handleMove = async (move: Move) => {
    if (!gameState) return;
    
    setSelectedMove(move);
    await makeMove("current-game-id", "player1", move); // Replace with actual IDs
  };

  if (!gameState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8 space-y-8">
      <ScoreBoard
        player1Score={gameState.player1.score}
        player2Score={gameState.player2.score}
        currentRound={gameState.currentRound}
        player1Name="Player 1"
        player2Name="Player 2"
      />

      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        {(["rock", "paper", "scissors"] as Move[]).map((move) => (
          <GameCard
            key={move}
            move={move}
            selected={selectedMove === move}
            disabled={!!selectedMove}
            onSelect={handleMove}
          />
        ))}
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setLocation("/lobby")}
        >
          Leave Game
        </Button>
      </div>
    </div>
  );
}
