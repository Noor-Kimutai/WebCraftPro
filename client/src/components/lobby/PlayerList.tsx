import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@shared/schema";

type PlayerListProps = {
  players: User[];
};

export function PlayerList({ players }: PlayerListProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Online Players ({players.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary"
              >
                <span>{player.displayName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Games: {player.gamesPlayed}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
