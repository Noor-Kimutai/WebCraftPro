import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PlayerList } from "@/components/lobby/PlayerList";
import { EmailSignup } from "@/components/lobby/EmailSignup";
import { subscribeToOnlineUsers, addToWaitingList, logoutUser } from "@/lib/firebase";
import type { User } from "@shared/schema";

export default function Lobby() {
  const [_, setLocation] = useLocation();
  const [onlinePlayers, setOnlinePlayers] = useState<User[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToOnlineUsers((users) => {
      setOnlinePlayers(Object.values(users || {}));
    });

    return () => unsubscribe();
  }, []);

  const handlePlayGame = async () => {
    setIsWaiting(true);
    try {
      await addToWaitingList("currentUserId"); // Replace with actual user ID
    } catch (error) {
      setIsWaiting(false);
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
