import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PlayerList } from "@/components/lobby/PlayerList";
import { EmailSignup } from "@/components/lobby/EmailSignup";
import { subscribeToOnlineUsers, addToWaitingList, logoutUser, subscribeToMatches } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Lobby() {
  const [_, setLocation] = useLocation();
  const [onlinePlayers, setOnlinePlayers] = useState<User[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeUsers = subscribeToOnlineUsers((users) => {
      setOnlinePlayers(Object.values(users || {}));
    });

    // Set up match subscription
    const unsubscribeMatches = auth.currentUser 
      ? subscribeToMatches(auth.currentUser.uid, (gameId) => {
          toast({
            title: "Match Found!",
            description: "Starting game...",
          });
          setIsWaiting(false);
          setLocation(`/game/${gameId}`);
        })
      : undefined;

    return () => {
      unsubscribeUsers();
      if (unsubscribeMatches) unsubscribeMatches();
    };
  }, []);

  const handlePlayGame = async () => {
    if (!auth.currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to play",
      });
      return;
    }

    setIsWaiting(true);
    try {
      await addToWaitingList(auth.currentUser.uid);
      toast({
        title: "Looking for match",
        description: "Please wait while we find another player...",
      });
    } catch (error) {
      setIsWaiting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join waiting list. Please try again.",
      });
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setLocation("/");
  };

  return (
    <div className="min-h-screen p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Game Lobby</h1>
        <Button variant="outline" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <PlayerList players={onlinePlayers} />
          <Button
            className="w-full"
            size="lg"
            disabled={isWaiting}
            onClick={handlePlayGame}
          >
            {isWaiting ? "Finding Match..." : "Play Game"}
          </Button>
        </div>
        <EmailSignup />
      </div>
    </div>
  );
}