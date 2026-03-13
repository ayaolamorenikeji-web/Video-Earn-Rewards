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
    <div className="min-h-screen w-full flex">
      {/* Left Panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#0a0f1e] via-[#0d3b5e] to-[#0a7575] relative overflow-hidden items-center justify-center">
        <WaterDrops />
        
        <div className="relative z-10 flex flex-col items-center max-w-sm px-8">
          <div className="relative mb-12">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-[#00d2ff] to-[#0088ff] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,210,255,0.4)] rotate-12 z-20">
              <span className="text-white font-display font-extrabold text-3xl">10</span>
            </div>
            <div className="w-48 h-48 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center relative z-10">
               <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8 6 4 11 4 15C4 19.4183 7.58172 23 12 23C16.4183 23 20 19.4183 20 15C20 11 16 6 12 2Z" fill="url(#paint0_linear_hero)" />
                <defs>
                  <linearGradient id="paint0_linear_hero" x1="12" y1="2" x2="12" y2="23" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E6FF" />
                    <stop offset="1" stopColor="#0088FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="space-y-6 w-full">
            {[
              { icon: "🎬", text: "Watch short videos" },
              { icon: "✨", text: "Earn points instantly" },
              { icon: "💸", text: "Cash out anytime" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl shadow-inner">
                  {feature.icon}
                </div>
                <span className="text-white font-medium text-lg">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 bg-[rgba(5,10,25,0.95)] flex items-center justify-center p-6 md:p-0 relative overflow-hidden">
        {/* On mobile only, add background behind the form */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#0d3b5e] to-[#0a7575] z-0" />
        <div className="md:hidden absolute inset-0 z-0"><WaterDrops /></div>
        
        <div className="w-full max-w-md bg-[rgba(5,10,25,0.95)] md:bg-transparent rounded-3xl p-8 md:p-10 relative z-10 shadow-2xl md:shadow-none border border-white/10 md:border-none">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d2ff33] to-[#0088ff33] border border-white/20 flex items-center justify-center mb-6 backdrop-blur-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8 6 4 11 4 15C4 19.4183 7.58172 23 12 23C16.4183 23 20 19.4183 20 15C20 11 16 6 12 2Z" fill="#00d2ff" />
              </svg>
            </div>
            <h1 className="text-[28px] font-display font-semibold text-white tracking-tight mb-2">Watch & Earn</h1>
            <p className="text-[14px] text-white/40">Sign in to your account</p>
          </div>

          <div className="flex border-b border-white/10 mb-8">
            <button
              type="button"
              className={`flex-1 pb-3 text-sm font-medium transition-all ${activeTab === 'login' ? 'text-white border-b-2 border-[#00d2ff]' : 'text-white/40 hover:text-white/60'}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 pb-3 text-sm font-medium transition-all ${activeTab === 'signup' ? 'text-white border-b-2 border-[#00d2ff]' : 'text-white/40 hover:text-white/60'}`}
              onClick={() => setActiveTab('signup')}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex flex-col">
              <Label htmlFor="email" className="text-[13px] font-medium text-white/60 mb-2">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border border-white/10 text-white px-4 focus:border-[#00d2ff]/50 focus:ring-0 focus:shadow-[0_0_0_3px_rgba(0,210,255,0.1)] transition-all placeholder:text-white/30"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-[13px] text-red-400 mt-2">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col">
              <Label htmlFor="password" className="text-[13px] font-medium text-white/60 mb-2">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12 rounded-xl bg-[rgba(255,255,255,0.06)] border border-white/10 text-white px-4 focus:border-[#00d2ff]/50 focus:ring-0 focus:shadow-[0_0_0_3px_rgba(0,210,255,0.1)] transition-all placeholder:text-white/30"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-[13px] text-red-400 mt-2">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#0066ff] text-white font-semibold text-[15px] border-none hover:shadow-[0_0_20px_rgba(0,210,255,0.4)] transition-all"
              disabled={isPending}
            >
              {isPending ? "Please wait..." : activeTab === "login" ? "Sign In" : "Create Account"}
            </Button>
            
            <div className="text-center mt-6">
              <button 
                type="button"
                onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
                className="text-[13px] text-white/50 hover:text-white transition-colors"
              >
                {activeTab === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}