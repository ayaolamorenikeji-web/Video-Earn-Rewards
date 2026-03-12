import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Gift, Wallet, LogOut, Loader2, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  useGetMe,
  useEarnPoints,
  useClaimDailyBonus,
  useRequestCashout,
  getGetMeQueryKey,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Add global declaration for Monetag mockup/integration
declare global {
  interface Window {
    Monetag?: {
      showRewardedVideo: (options: { onSuccess: () => void; onSkip: () => void }) => void;
    };
  }
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { session, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isWatching, setIsWatching] = useState(false);

  // Redirect if not logged in
  if (!session) {
    setLocation("/");
    return null;
  }

  // Common request headers for auth
  const authHeaders = { 'x-user-id': session.userId };

  // Fetch real-time user profile
  const { data: profile, isLoading: isProfileLoading } = useGetMe({
    query: {
      enabled: !!session.userId,
      refetchInterval: 10000, // keep points synced
    },
    request: { headers: authHeaders }
  });

  // Mutations
  const earnMutation = useEarnPoints({
    request: { headers: authHeaders },
    mutation: {
      onSuccess: () => {
        toast({ title: "+10 Points!", description: "Video completed successfully." });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to credit points.", variant: "destructive" });
      }
    }
  });

  const dailyBonusMutation = useClaimDailyBonus({
    request: { headers: authHeaders },
    mutation: {
      onSuccess: () => {
        toast({ title: "Daily Bonus Claimed!", description: "+5 bonus points added to your balance." });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({
          title: "Already Claimed",
          description: err?.error || "You have already claimed your daily bonus today.",
          variant: "destructive"
        });
      }
    }
  });

  const cashoutMutation = useRequestCashout({
    request: { headers: authHeaders },
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Cashout Successful!",
          description: `${data.message}. You redeemed ${data.pointsRedeemed} points.`
        });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({
          title: "Cashout Failed",
          description: err?.error || "Not enough points to cash out (Minimum 100 required).",
          variant: "destructive"
        });
      }
    }
  });

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleWatchVideo = () => {
    // --------------------------------------------------------------------------------
    // INTEGRATION NOTE: Monetag Rewarded Video
    // Replace YOUR_MONETAG_TAG_ID with your actual Monetag publisher tag ID in index.html.
    // To whitelist your domain, go to Monetag dashboard > Sites > Add Site.
    // --------------------------------------------------------------------------------
    
    if (typeof window !== "undefined" && window.Monetag?.showRewardedVideo) {
      window.Monetag.showRewardedVideo({
        onSuccess: () => {
          earnMutation.mutate();
        },
        onSkip: () => {
          toast({ title: "Video skipped", description: "No points awarded.", variant: "destructive" });
        }
      });
    } else {
      // Development Mock / Fallback
      toast({ title: "Ad Simulated (Dev Mode)", description: "Watching video... please wait." });
      setIsWatching(true);
      setTimeout(() => {
        setIsWatching(false);
        earnMutation.mutate();
      }, 3000);
    }
  };

  const currentPoints = profile?.points ?? session.points;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Play className="w-4 h-4 text-white ml-0.5" />
            </div>
            <span className="font-display font-bold text-lg hidden sm:block">Watch & Earn</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden sm:block">
              {profile?.email || session.email}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground rounded-lg">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12">
        {/* Balance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm mb-4">
            Your Balance
          </p>
          <div className="flex items-center justify-center gap-4">
            <img 
              src={`${import.meta.env.BASE_URL}images/coin.png`} 
              alt="Coins" 
              className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl"
            />
            <div className="text-6xl sm:text-8xl font-display font-extrabold tracking-tighter bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
              {isProfileLoading ? (
                <span className="animate-pulse text-muted">...</span>
              ) : (
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={currentPoints}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block"
                  >
                    {currentPoints}
                  </motion.span>
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Watch Video Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-3 lg:col-span-2"
          >
            <Card className="h-full border-none shadow-xl bg-gradient-to-br from-primary to-indigo-700 text-primary-foreground overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1000')] opacity-10 bg-cover bg-center mix-blend-overlay" />
              <div className="relative p-8 flex flex-col justify-between h-full min-h-[240px]">
                <div>
                  <h2 className="text-2xl font-bold font-display mb-2">Watch Videos</h2>
                  <p className="text-primary-foreground/80 max-w-sm">
                    Watch short sponsored clips and earn 10 points for every completed video.
                  </p>
                </div>
                
                <div className="mt-8">
                  <Button 
                    size="lg" 
                    onClick={handleWatchVideo}
                    disabled={isWatching || earnMutation.isPending}
                    className="w-full sm:w-auto bg-white text-primary hover:bg-slate-50 text-lg rounded-xl h-14 px-8 shadow-lg shadow-black/10 transition-transform active:scale-95"
                  >
                    {isWatching || earnMutation.isPending ? (
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-6 h-6 mr-2 fill-primary" />
                    )}
                    {isWatching ? "Watching..." : "Watch & Earn +10"}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="flex flex-col gap-6 md:col-span-3 lg:col-span-1">
            {/* Daily Bonus Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1"
            >
              <Card className="p-6 h-full border border-border shadow-lg bg-card hover:shadow-xl transition-shadow flex flex-col justify-center items-center text-center rounded-2xl">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold text-lg mb-1">Daily Bonus</h3>
                <p className="text-sm text-muted-foreground mb-6">Claim 5 free points every 24 hours.</p>
                <Button 
                  onClick={() => dailyBonusMutation.mutate()}
                  disabled={dailyBonusMutation.isPending || profile?.canClaimDailyBonus === false}
                  className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {profile?.canClaimDailyBonus === false ? "Come back tomorrow" : "Claim +5 Points"}
                </Button>
              </Card>
            </motion.div>

            {/* Cashout Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1"
            >
              <Card className="p-6 h-full border border-border shadow-lg bg-card hover:shadow-xl transition-shadow flex flex-col justify-center items-center text-center rounded-2xl relative overflow-hidden">
                {currentPoints < 100 && (
                  <div className="absolute top-4 right-4 text-muted-foreground">
                    <Info className="w-4 h-4" />
                  </div>
                )}
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-1">Cash Out</h3>
                <p className="text-sm text-muted-foreground mb-6">Minimum 100 points required.</p>
                <Button 
                  onClick={() => cashoutMutation.mutate()}
                  disabled={cashoutMutation.isPending || currentPoints < 100}
                  variant={currentPoints >= 100 ? "default" : "outline"}
                  className="w-full rounded-xl"
                >
                  {cashoutMutation.isPending ? "Processing..." : "Request Cash Out"}
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
