import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ScoreBoardProps = {
  player1Score: number;
  player2Score: number;
  currentRound: number;
  player1Name: string;
  player2Name: string;
};

export function ScoreBoard({
  player1Score,
  player2Score,
  currentRound,
  player1Name,
  player2Name
}: ScoreBoardProps) {
  const maxScore = 3;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Round {currentRound}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>{player1Name}</span>
            <span>{player1Score}/{maxScore}</span>
          </div>
          <Progress value={(player1Score / maxScore) * 100} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>{player2Name}</span>
            <span>{player2Score}/{maxScore}</span>
          </div>
          <Progress value={(player2Score / maxScore) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
