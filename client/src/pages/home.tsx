import { AuthForm } from "@/components/auth/AuthForm";
import { useLocation } from "wouter";

export default function Home() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-background p-4">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Rock Paper Scissors</h1>
          <p className="text-muted-foreground">Challenge players worldwide!</p>
        </div>
        <AuthForm onSuccess={() => setLocation("/lobby")} />
      </div>
    </div>
  );
}
