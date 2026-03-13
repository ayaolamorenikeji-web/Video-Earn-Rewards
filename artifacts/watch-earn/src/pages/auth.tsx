import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";

import { useLogin, useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WaterDrops } from "@/components/WaterDrops";

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
    <div className="min-h-screen w-full flex items-center justify-center relative bg-gradient-to-br from-[#0a0f1e] via-[#0d3b5e] to-[#0a7575] overflow-hidden">
      <WaterDrops />
      
      <div className="z-10 w-full max-w-md px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-6 glow-icon backdrop-blur-md">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8 6 4 11 4 15C4 19.4183 7.58172 23 12 23C16.4183 23 20 19.4183 20 15C20 11 16 6 12 2Z" fill="url(#paint0_linear)" />
                <path d="M15 15C15 15 14.5 13 12 13C9.5 13 9 15 9 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="paint0_linear" x1="12" y1="2" x2="12" y2="23" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E6FF" />
                    <stop offset="1" stopColor="#0088FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="text-4xl font-display font-bold text-white glow-text tracking-wider">Watch & Earn</h1>
            <p className="text-white/60 mt-2">Dive in and get paid for your attention.</p>
          </div>

          <div className="glass-card p-6 pb-8">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <div className="mb-6">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 p-1 rounded-xl">
                  <TabsTrigger 
                    value="login" 
                    className="rounded-lg text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="rounded-lg text-white data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80 ml-1">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="glass-input rounded-xl h-12 px-4"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-300 ml-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80 ml-1">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="glass-input rounded-xl h-12 px-4"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-300 ml-1">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl mt-6 h-12 text-md font-semibold bg-gradient-to-r from-[#00d2ff] to-[#0088ff] text-white border-none btn-ripple transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isPending}
                >
                  {isPending ? "Please wait..." : activeTab === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
