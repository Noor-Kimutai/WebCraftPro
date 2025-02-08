import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { insertEmailSignupSchema } from "@shared/schema";

export function EmailSignup() {
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(insertEmailSignupSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: { email: string }) => {
    try {
      await fetch("/api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      
      toast({
        title: "Success!",
        description: "You've been signed up for notifications.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign up. Please try again.",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Get Notified About Cash Games!</CardTitle>
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
            <Button type="submit" className="w-full">Sign Up</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
