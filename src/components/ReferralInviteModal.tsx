import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Users, Sparkles } from "lucide-react";

interface ReferralInviteModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: () => void;
  referralReward: number;
}

export const ReferralInviteModal = ({
  open,
  onClose,
  onConnect,
  referralReward = 20,
}: ReferralInviteModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-2 border-background">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Congrats! 🎉
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You were invited to explore the Zapps ecosystem
            </p>
            
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Referral Reward</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                +{referralReward} ZVP
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Users className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Join the Community</p>
                <p className="text-xs text-muted-foreground">
                  Tap Claim to get your reward
                </p>
              </div>
            </div>
          </div>
          
          <Button onClick={onConnect} className="w-full">
            Claim Reward
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
