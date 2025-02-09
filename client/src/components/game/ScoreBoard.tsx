import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, X, Circle, Minus } from "lucide-react";

type ScoreBoardProps = {
  player1Score: number;
  player2Score: number;
  currentRound: number;
  player1Name: string;
  player2Name: string;
  isTieBreaker?: boolean;
};

export function ScoreBoard({
  player1Score,
  player2Score,
  currentRound,
  player1Name,
  player2Name,
  isTieBreaker
}: ScoreBoardProps) {
  const maxScore = 3;
  const renderScore = (score: number, isPlayer1: boolean) => {
    return Array.from({ length: maxScore }, (_, i) => {
      if (currentRound <= i + 1) {
        // Future rounds shown as circles
        return <Circle key={i} className="w-5 h-5 text-muted-foreground inline-block" />;
      }

      // For completed rounds
      const roundResult = getRoundResult(i, isPlayer1);
      switch (roundResult) {
        case 'win':
          return <Check key={i} className="w-5 h-5 text-green-500 inline-block" />;
        case 'loss':
          return <X key={i} className="w-5 h-5 text-red-500 inline-block opacity-50" />;
        case 'tie':
          return <Minus key={i} className="w-5 h-5 text-yellow-500 inline-block" />;
        default:
          return <Circle key={i} className="w-5 h-5 text-muted-foreground inline-block" />;
      }
    });
  };

  // Helper function to determine the result of a specific round
  const getRoundResult = (roundIndex: number, isPlayer1: boolean) => {
    if (roundIndex >= currentRound - 1) return 'pending';

    const p1Score = player1Score > roundIndex;
    const p2Score = player2Score > roundIndex;

    if (p1Score === p2Score) return 'tie';
    return isPlayer1 ? (p1Score ? 'win' : 'loss') : (p2Score ? 'win' : 'loss');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">
          {isTieBreaker ? "Tie Breaker" : `Round ${currentRound}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{player1Name}</span>
            <div className="flex gap-1">{renderScore(player1Score, true)}</div>
          </div>
          <Progress value={(player1Score / maxScore) * 100} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{player2Name}</span>
            <div className="flex gap-1">{renderScore(player2Score, false)}</div>
          </div>
          <Progress value={(player2Score / maxScore) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}