import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Gift, Wallet, Loader2, Zap } from "lucide-react";
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

  if (!session) {
    setLocation("/");
    return null;
  }

  const authHeaders = { 'x-user-id': session.userId };

  const { data: profile, isLoading: isProfileLoading } = useGetMe({
    query: {
      enabled: !!session.userId,
      refetchInterval: 10000,
    },
    request: { headers: authHeaders }
  });

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
      toast({ title: "Ad Simulated (Dev Mode)", description: "Watching video... please wait." });
      setIsWatching(true);
      setTimeout(() => {
        setIsWatching(false);
        earnMutation.mutate();
      }, 3000);
    }
  };

  const currentPoints = profile?.points ?? session.points;
  const userEmail = profile?.email || session.email || "";
  const firstLetter = userEmail.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d3b5e] to-[#0a7575] pb-12 relative overflow-x-hidden text-white font-sans">
      <WaterDrops />
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass-nav h-[64px]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8 6 4 11 4 15C4 19.4183 7.58172 23 12 23C16.4183 23 20 19.4183 20 15C20 11 16 6 12 2Z" fill="#00d2ff" />
            </svg>
            <span className="font-semibold text-[16px]">Watch & Earn</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 hidden sm:flex">
              <span className="text-[14px] text-white/70">{userEmail}</span>
            </div>
            <div className="avatar-circle">{firstLetter}</div>
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              className="h-[36px] px-4 rounded-[12px] border border-white/10 text-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pt-[48px] relative z-10 px-6">
        {/* Balance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center flex flex-col items-center mb-16"
        >
          <div className="section-label mb-4">TOTAL BALANCE</div>
          <div 
            className="text-[72px] font-extrabold text-white glow-text leading-none mb-6"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
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
          
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <div className="badge-pill bg-white/10 text-white/60">
              <span className="w-2 h-2 rounded-full bg-[#00d2ff]"></span>
              +10 per video
            </div>
            <div className="badge-pill bg-white/10 text-white/60">
              <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>
              5 daily bonus
            </div>
            <div className="badge-pill bg-white/10 text-white/60">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              100 to cash out
            </div>
          </div>

          <div className="w-full max-w-[320px]">
            {currentPoints >= 100 ? (
              <div className="badge-pill bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 py-2 px-4 text-[13px] w-full justify-center">
                Ready to cash out! 🎉
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[12px] text-white/40">
                  <span>Progress to cashout</span>
                  <span>{currentPoints}/100 pts</span>
                </div>
                <div className="progress-track w-full">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${Math.min(100, (currentPoints / 100) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Watch Video Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="glass-card p-[40px] h-full flex flex-col relative overflow-hidden group">
              <div className="badge-pill bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/20 text-xs self-start mb-4">
                EARN POINTS
              </div>
              <h2 className="text-[32px] font-bold text-white mb-2">Watch & Earn</h2>
              <p className="text-[15px] text-white/60 leading-[1.6] max-w-sm">
                Complete sponsored video clips and earn 10 points instantly.
              </p>
              
              <hr className="glass-divider my-[32px]" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-auto relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00d2ff]/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#00d2ff]" />
                  </div>
                  <span className="text-[15px] font-medium text-white/80">10 points per video</span>
                </div>
                
                <Button 
                  onClick={handleWatchVideo}
                  disabled={isWatching || earnMutation.isPending}
                  className="h-[48px] px-8 rounded-[12px] bg-gradient-to-r from-[#00d2ff] to-[#0088ff] text-white text-[15px] font-semibold border-none hover:shadow-[0_0_20px_rgba(0,210,255,0.4)] transition-all disabled:opacity-70"
                >
                  {isWatching || earnMutation.isPending ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2 fill-white" />
                  )}
                  Watch & Earn +10
                </Button>
              </div>

              {/* Decorative Watermark */}
              <Play className="absolute -bottom-6 -right-6 w-[120px] h-[120px] text-white opacity-[0.04] pointer-events-none" />
            </div>
          </motion.div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Daily Bonus Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1"
            >
              <div className="glass-card p-[32px] h-full flex flex-col relative">
                <div className="w-12 h-12 rounded-xl bg-[#00d2ff]/10 border border-[#00d2ff]/20 flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-[#00d2ff]" />
                </div>
                <h3 className="text-[16px] font-semibold text-white">Daily Bonus</h3>
                <p className="text-[13px] text-white/50 mt-1">Free points every 24h</p>
                
                <div className="badge-pill bg-[#00d2ff]/20 text-[#00d2ff] self-start mt-2 mb-6">
                  +5 pts
                </div>

                <div className="mt-auto">
                  <Button 
                    onClick={() => dailyBonusMutation.mutate()}
                    disabled={dailyBonusMutation.isPending || profile?.canClaimDailyBonus === false}
                    className={`w-full h-[44px] rounded-xl text-[14px] font-medium transition-all ${
                      profile?.canClaimDailyBonus !== false
                        ? "bg-gradient-to-r from-[#00d2ff] to-[#0088ff] text-white border-none hover:shadow-[0_0_15px_rgba(0,210,255,0.3)]"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}
                  >
                    {profile?.canClaimDailyBonus === false ? "Come back tomorrow" : "Claim Bonus"}
                  </Button>
                  {profile?.canClaimDailyBonus === false && (
                    <p className="text-center text-[11px] text-white/30 mt-3">Resets at midnight UTC</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Cashout Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1"
            >
              <div className="glass-card p-[32px] h-full flex flex-col relative">
                <div className="absolute top-[32px] right-[32px]">
                  <div className="badge-pill bg-white/10 text-white/60 text-[11px]">
                    100 pts min
                  </div>
                </div>

                <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-[#10b981]" />
                </div>
                <h3 className="text-[16px] font-semibold text-white">Cash Out</h3>
                <p className="text-[13px] text-white/50 mt-1">Min. 100 points</p>
                
                <div className="mt-2 mb-6 h-[24px]">
                  {currentPoints < 100 && (
                    <span className="text-[12px] text-white/30">Need {100 - currentPoints} more points</span>
                  )}
                </div>

                <div className="mt-auto">
                  <Button 
                    onClick={() => cashoutMutation.mutate()}
                    disabled={cashoutMutation.isPending || currentPoints < 100}
                    className={`w-full h-[44px] rounded-xl text-[14px] font-medium transition-all ${
                      currentPoints >= 100 
                        ? "bg-gradient-to-r from-[#10b981] to-[#059669] text-white border-none hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}
                  >
                    {cashoutMutation.isPending ? "Processing..." : "Request Cash Out"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <footer className="mt-[48px] text-center">
          <p className="text-[12px] text-white/25">Points are non-transferable. Subject to terms.</p>
        </footer>
      </main>
    </div>
  );
}