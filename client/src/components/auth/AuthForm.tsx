import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { loginUser, registerUser, setUserOnlineStatus } from "@/lib/firebase";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type AuthFormProps = {
  onSuccess: () => void;
};

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof authSchema>) => {
    try {
      const userCredential = isLogin 
        ? await loginUser(values.email, values.password)
        : await registerUser(values.email, values.password);

      // Set user as online in Firebase
      await setUserOnlineStatus(userCredential.user.uid, true);

      // Set up presence detection
      const handleUnload = () => {
        setUserOnlineStatus(userCredential.user.uid, false);
      };

      // Add presence event listeners
      window.addEventListener('beforeunload', handleUnload);
      window.addEventListener('unload', handleUnload);

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message,
      });
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <Button type="submit">{isLogin ? "Login" : "Register"}</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Need an account? Register" : "Have an account? Login"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}