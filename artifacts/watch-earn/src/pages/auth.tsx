import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";

import { useLogin, useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { setSession } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const loginMutation = useLogin();
  const signupMutation = useSignup();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: AuthFormValues) => {
    try {
      let response;
      if (activeTab === "login") {
        response = await loginMutation.mutateAsync({ data });
        toast({ title: "Welcome back!", description: "Successfully logged in." });
      } else {
        response = await signupMutation.mutateAsync({ data });
        toast({ title: "Account created!", description: "Welcome to Watch Video & Earn." });
      }
      setSession(response);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        title: "Authentication Failed",
        description: err?.error || err?.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  const isPending = loginMutation.isPending || signupMutation.isPending;

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Abstract background"
          className="w-full h-full object-cover opacity-60 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
      </div>

      <div className="z-10 w-full max-w-md px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground">Watch & Earn</h1>
            <p className="text-muted-foreground mt-2">Get paid for your attention.</p>
          </div>

          <Card className="border-white/20 shadow-2xl backdrop-blur-md bg-white/90 dark:bg-card/90">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="login" className="rounded-lg">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg">Sign Up</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-background/50 rounded-xl"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-background/50 rounded-xl"
                      {...form.register("password")}
                    />
                    {form.formState.errors.password && (
                      <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl mt-4 h-12 text-md font-semibold bg-gradient-to-r from-primary to-primary/80 hover:to-primary shadow-lg hover:shadow-primary/25 transition-all"
                    disabled={isPending}
                  >
                    {isPending ? "Please wait..." : activeTab === "login" ? "Sign In" : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
