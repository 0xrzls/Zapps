import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Coins, Crown, Image as ImageIcon, ExternalLink, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";

interface Reward {
  type: string;
  value: string;
}

interface ClaimRewardsModalProps {
  open: boolean;
  onClose: () => void;
  rewards: Reward[];
  totalPoints: number;
  onClaim: () => void;
}

const ClaimRewardsModal = ({ open, onClose, rewards, totalPoints, onClaim }: ClaimRewardsModalProps) => {
  const { isConnected, publicKey, setShowWalletModal } = useWallet();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDiscordConnected, setIsDiscordConnected] = useState(false);
  const [nftAction, setNftAction] = useState<'now' | 'later' | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  
  const safeRewards = Array.isArray(rewards) ? rewards : [];
  const totalSteps = Math.max(safeRewards.length, 1);
  const currentReward = safeRewards[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const getRewardIcon = (type: string) => {
    switch(type) {
      case "POINT": return <Coins className="w-12 h-12 text-primary" />;
      case "NFT": return <ImageIcon className="w-12 h-12 text-primary" />;
      case "ROLE": return <Crown className="w-12 h-12 text-primary" />;
      default: return <Trophy className="w-12 h-12 text-primary" />;
    }
  };

  const handleClaimPoint = async () => {
    if (!isConnected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      setShowWalletModal?.(true);
      return;
    }

    setIsClaiming(true);
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Points Claimed!",
        description: `${totalPoints} points have been added to your account.`,
      });
      nextStep();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleConnectDiscord = () => {
    window.open('https://discord.com/oauth2/authorize', '_blank');
    setTimeout(() => {
      setIsDiscordConnected(true);
      toast({
        title: "Discord Connected!",
        description: "You can now claim your Discord role.",
      });
    }, 2000);
  };

  const handleClaimRole = () => {
    toast({
      title: "Role Claimed!",
      description: "Your Discord role has been updated.",
    });
    nextStep();
  };

  const handleClaimNFT = async (action: 'now' | 'later') => {
    if (!isConnected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      setShowWalletModal?.(true);
      return;
    }

    setIsClaiming(true);
    setNftAction(action);
    
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: action === 'now' ? "NFT Minting..." : "NFT Saved!",
        description: action === 'now' 
          ? "Your NFT is being minted to your wallet." 
          : "You can mint your NFT anytime from your profile.",
      });
      nextStep();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process NFT. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const nextStep = () => {
    if (currentStep < safeRewards.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      
      onClaim();
      onClose();
      
      setTimeout(() => {
        setCurrentStep(0);
        setIsDiscordConnected(false);
        setNftAction(null);
      }, 300);
    }
  };

  if (!currentReward) return null;

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b pb-3">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4 text-primary" />
            Claim Your Rewards
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto">
          {}
          <div className="space-y-1.5 pt-4 pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Step {currentStep + 1} of {safeRewards.length}</span>
              <span className="font-medium text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {}
          <div className="py-4 space-y-5">
            {}
            <div className="text-center space-y-2.5">
              <div className="flex justify-center">
                {getRewardIcon(currentReward.type)}
              </div>
              <div>
                <h3 className="text-base font-bold mb-1">{currentReward.type}</h3>
                <p className="text-sm text-muted-foreground">{currentReward.value}</p>
              </div>
            </div>

            {}
            <div className="space-y-3">
              {currentReward.type === 'POINT' && (
                <Button 
                  onClick={handleClaimPoint}
                  className="w-full h-11 gradient-primary glow-effect"
                  size="lg"
                  disabled={isClaiming || !isConnected}
                >
                  <Coins className="w-4 h-4" />
                  {isClaiming ? "Claiming..." : `Claim ${totalPoints} Points`}
                  {!isClaiming && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Button>
              )}

              {currentReward.type === 'ROLE' && (
                <div className="space-y-3">
                  {!isDiscordConnected ? (
                    <>
                      <div className="bg-muted/50 rounded-lg p-3.5 text-center">
                        <p className="text-xs text-muted-foreground mb-3">
                          Connect your Discord account to receive your exclusive role
                        </p>
                        <Button 
                          onClick={handleConnectDiscord}
                          className="w-full h-10"
                          variant="outline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Connect Discord
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button 
                      onClick={handleClaimRole}
                      className="w-full h-11 gradient-primary glow-effect"
                      size="lg"
                    >
                      <Crown className="w-4 h-4" />
                      Claim Discord Role
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  )}
                </div>
              )}

              {currentReward.type === 'NFT' && (
                <div className="space-y-3">
                  {}
                  <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-background via-primary/5 to-accent/10 p-4">
                    {}
                    <div className="absolute inset-0 opacity-20" 
                         style={{
                           backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)',
                           backgroundSize: '20px 20px'
                         }} 
                    />
                    
                    {}
                    <div className="relative aspect-square max-w-[200px] mx-auto rounded-lg overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-accent/30 border border-primary/30 glow-effect">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-primary/60" strokeWidth={1.5} />
                      </div>
                      {}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-pulse" />
                    </div>
                    
                    {}
                    <div className="relative mt-3 text-center space-y-1">
                      <p className="text-sm font-bold text-foreground">{currentReward.value}</p>
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs text-muted-foreground">Limited Edition</p>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button 
                      onClick={() => handleClaimNFT('now')}
                      className="h-10 gradient-primary glow-effect"
                      disabled={isClaiming || !isConnected}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      {isClaiming ? "Processing..." : "Mint Now"}
                    </Button>
                    <Button 
                      onClick={() => handleClaimNFT('later')}
                      className="h-10"
                      variant="outline"
                      disabled={isClaiming || !isConnected}
                    >
                      Save for Later
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ClaimRewardsModal;
