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
import { WaterDrops } from "@/components/WaterDrops";

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d3b5e] to-[#0a7575] pb-12 relative overflow-x-hidden text-white font-sans">
      <WaterDrops />
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass-nav">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 flex items-center justify-center glow-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8 6 4 11 4 15C4 19.4183 7.58172 23 12 23C16.4183 23 20 19.4183 20 15C20 11 16 6 12 2Z" fill="#00d2ff" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl tracking-wide hidden sm:block glow-text">Watch & Earn</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-white/70 hidden sm:block">
              {profile?.email || session.email}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-white hover:bg-white/10 hover:text-white rounded-lg border border-transparent transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2 opacity-80" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 relative z-10">
        {/* Balance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20 relative"
        >
          {/* Subtle pulse glow behind points */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#00d2ff]/20 rounded-full blur-[60px] animate-pulse -z-10" />

          <p className="text-white/60 font-medium uppercase tracking-[0.2em] text-sm mb-6">
            Your Balance
          </p>
          <div className="flex items-center justify-center gap-6">
            <img 
              src={`${import.meta.env.BASE_URL}images/coin.png`} 
              alt="Coins" 
              className="w-16 h-16 sm:w-24 sm:h-24 drop-shadow-[0_0_15px_rgba(0,230,255,0.6)]"
            />
            <div className="text-7xl sm:text-9xl font-display font-extrabold tracking-tighter text-white glow-text">
              {isProfileLoading ? (
                <span className="animate-pulse opacity-50">...</span>
              ) : (
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={currentPoints}
                    initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Watch Video Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-3 lg:col-span-2"
          >
            <div className="glass-card h-full p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00d2ff] to-[#0088ff]" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                  <Play className="w-6 h-6 text-[#00d2ff] ml-1" />
                </div>
                <h2 className="text-3xl font-bold font-display mb-3 text-white">Watch Videos</h2>
                <p className="text-white/70 max-w-sm text-lg leading-relaxed">
                  Dive into short sponsored clips and earn 10 points for every completed video.
                </p>
              </div>
              
              <div className="mt-10 relative z-10">
                <Button 
                  size="lg" 
                  onClick={handleWatchVideo}
                  disabled={isWatching || earnMutation.isPending}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#00d2ff] to-[#0088ff] text-white border-none rounded-2xl h-16 px-10 text-xl font-semibold btn-ripple hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {isWatching || earnMutation.isPending ? (
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  ) : (
                    <Play className="w-6 h-6 mr-3 fill-white" />
                  )}
                  {isWatching ? "Watching..." : "Watch & Earn +10"}
                </Button>
              </div>

              {/* Decorative wave background shape */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#00d2ff]/10 rounded-full blur-[40px] group-hover:bg-[#00d2ff]/20 transition-colors duration-700" />
            </div>
          </motion.div>

          <div className="flex flex-col gap-8 md:col-span-3 lg:col-span-1">
            {/* Daily Bonus Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1"
            >
              <div className="glass-card p-8 h-full flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="w-14 h-14 rounded-2xl bg-[#00d2ff]/20 border border-[#00d2ff]/30 flex items-center justify-center mb-5 glow-icon">
                  <Gift className="w-7 h-7 text-[#00d2ff]" />
                </div>
                <h3 className="font-bold text-xl mb-2 text-white">Daily Bonus</h3>
                <p className="text-white/60 mb-8">Claim 5 free points every 24 hours.</p>
                <Button 
                  onClick={() => dailyBonusMutation.mutate()}
                  disabled={dailyBonusMutation.isPending || profile?.canClaimDailyBonus === false}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 h-14 text-lg font-medium transition-all"
                >
                  {profile?.canClaimDailyBonus === false ? "Come back tomorrow" : "Claim +5 Points"}
                </Button>
              </div>
            </motion.div>

            {/* Cashout Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1"
            >
              <div className="glass-card p-8 h-full flex flex-col justify-center items-center text-center relative overflow-hidden">
                {currentPoints < 100 && (
                  <div className="absolute top-5 right-5 text-white/40">
                    <Info className="w-5 h-5" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                  <Wallet className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="font-bold text-xl mb-2 text-white">Cash Out</h3>
                <p className="text-white/60 mb-8">Minimum 100 points required.</p>
                <Button 
                  onClick={() => cashoutMutation.mutate()}
                  disabled={cashoutMutation.isPending || currentPoints < 100}
                  className={`w-full rounded-xl h-14 text-lg font-medium transition-all ${
                    currentPoints >= 100 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none hover:scale-[1.02] btn-ripple shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                      : "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed"
                  }`}
                >
                  {cashoutMutation.isPending ? "Processing..." : "Request Cash Out"}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
