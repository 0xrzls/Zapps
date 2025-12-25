import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, CheckCircle2, Loader2 } from "lucide-react";

interface ClaimReferralRewardModalProps {
  open: boolean;
  onClose: () => void;
  onClaim: () => Promise<void>;
  referralReward: number;
}

export const ClaimReferralRewardModal = ({
  open,
  onClose,
  onClaim,
  referralReward = 20,
}: ClaimReferralRewardModalProps) => {
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    setLoading(true);
    try {
      await onClaim();
      setClaimed(true);
      setTimeout(() => {
        onClose();
        setClaimed(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to claim reward:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              {claimed ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <Gift className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {claimed ? 'Reward Claimed! 🎉' : 'Claim Your Referral Reward'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {claimed ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Your referral reward has been successfully claimed!
              </p>
              <div className="text-2xl font-bold text-green-500">
                +{referralReward} ZVP
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  You're eligible to claim your referral reward
                </p>
                
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Referral Bonus</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    +{referralReward} ZVP
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Encrypted on-chain with FHE
                  </p>
                </div>
              </div>
              
              <Button onClick={handleClaim} className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Claim Reward
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
