import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { backend } from "@/services";
import { FaXTwitter, FaDiscord } from "react-icons/fa6";
import { Shield, Zap } from "lucide-react";

interface SocialBindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: "twitter" | "discord";
  walletAddress: string;
  onBindSuccess?: () => void;
}

export const SocialBindingDialog = ({ 
  open, 
  onOpenChange, 
  platform, 
  walletAddress,
  onBindSuccess 
}: SocialBindingDialogProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      if (platform === 'twitter') {
        
        const { data, error } = await backend.functions.invoke('twitter-oauth-init', { 
          walletAddress,
          redirectOrigin: window.location.origin 
        });

        if (error) throw error;
        
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.authUrl,
          'Twitter Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        let checkPopup: number | undefined;

        const cleanup = () => {
          if (checkPopup) clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler as any);
          window.removeEventListener('storage', storageHandler as any);
          try { bc.close(); } catch {}
          setIsConnecting(false);
          popup?.close();
        };

        const onSuccess = async (data?: any) => {
          
          await backend.profiles.getByWallet(walletAddress);

          if (data?.transferredAchievements) {
            toast({
              title: "Achievements Transferred",
              description: "Your previous achievements have been moved to this wallet. The old wallet no longer has access to them.",
            });
          }

          toast({
            title: "Connected successfully!",
            description: "Your Twitter account has been linked for auto-verification",
          });
          onBindSuccess?.();
          onOpenChange(false);
        };

        const messageHandler = async (event: MessageEvent) => {
          
          const { type, success, error: errorMsg, transferredAchievements } = event.data || {};
          if (type === 'oauth:twitter:result') {
            if (success) {
              await onSuccess({ transferredAchievements });
            } else {
              toast({
                title: "Connection failed",
                description: errorMsg || 'Failed to connect Twitter account',
                variant: "destructive"
              });
            }
            cleanup();
          }
        };
        
        window.addEventListener('message', messageHandler);

        const storageHandler = async (e: StorageEvent) => {
          if (e.key === 'oauth:twitter:result' && e.newValue) {
            try {
              const data = JSON.parse(e.newValue);
              if (data?.success) {
                await onSuccess(data);
              } else {
                toast({
                  title: "Connection failed",
                  description: data?.error || 'Failed to connect Twitter account',
                  variant: "destructive"
                });
              }
            } catch {}
            cleanup();
          }
        };
        window.addEventListener('storage', storageHandler);

        const bc = new BroadcastChannel('oauth:channel');
        bc.onmessage = async (msg) => {
          const { platform: p, success, error: errorMsg, transferredAchievements } = (msg?.data || {}) as any;
          if (p === 'twitter') {
            if (success) {
              await onSuccess({ transferredAchievements });
            } else {
              toast({
                title: "Connection failed",
                description: errorMsg || 'Failed to connect Twitter account',
                variant: "destructive"
              });
            }
            cleanup();
          }
        };
        
        checkPopup = window.setInterval(() => {
          if (popup?.closed) {
            if (checkPopup) clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler as any);
            window.removeEventListener('storage', storageHandler as any);
            try { bc.close(); } catch {}
            setIsConnecting(false);
          }
        }, 500);

        setTimeout(() => {
          if (popup && !popup.closed) {
            popup.close();
            if (checkPopup) clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler as any);
            window.removeEventListener('storage', storageHandler as any);
            try { bc.close(); } catch {}
            setIsConnecting(false);
          }
        }, 120000); 

      } else if (platform === 'discord') {
        
        const { data, error } = await backend.functions.invoke('discord-oauth-init', { 
          walletAddress,
          redirectOrigin: window.location.origin 
        });

        if (error) throw error;
        
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.authUrl,
          'Discord Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        const messageHandler = async (event: MessageEvent) => {
          
          const { type, success, error: errorMsg, transferredAchievements } = event.data || {};
          
          if (type === 'oauth:discord:result') {
            if (success) {
              
              await backend.profiles.getByWallet(walletAddress);

              if (transferredAchievements) {
                toast({
                  title: "Achievements Transferred",
                  description: "Your previous achievements have been moved to this wallet. The old wallet no longer has access to them.",
                });
              }

              toast({
                title: "Connected successfully!",
                description: "Your Discord account has been linked for auto-verification",
              });
              onBindSuccess?.();
              onOpenChange(false);
            } else {
              toast({
                title: "Connection failed",
                description: errorMsg || 'Failed to connect Discord account',
                variant: "destructive"
              });
            }
            setIsConnecting(false);
            window.removeEventListener('message', messageHandler);
            popup?.close();
          }
        };
        
        window.addEventListener('message', messageHandler);

        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
            setIsConnecting(false);
          }
        }, 500);

        setTimeout(() => {
          if (popup && !popup.closed) {
            popup.close();
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
            setIsConnecting(false);
          }
        }, 120000); 
      }
    } catch (error: any) {
      console.error('Error connecting account:', error);
      toast({
        title: "Connection failed",
        description: error.message || `Failed to connect ${platform} account`,
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px] w-[90vw] max-h-[85vh] rounded-2xl p-5">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${platform === "twitter" ? "bg-black dark:bg-white" : "bg-[#5865F2]"}`}>
              {platform === "twitter" ? (
                <FaXTwitter className="w-6 h-6 text-white dark:text-black" />
              ) : (
                <FaDiscord className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <DialogTitle className="text-center text-base">
            Connect {platform === "twitter" ? "X (Twitter)" : "Discord"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Link your {platform === "twitter" ? "X" : "Discord"} account for automatic quest verification
            </p>
            
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-semibold">Secure OAuth 2.0</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-semibold">Auto Quest Completion</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Industry-standard authentication. We never store your password.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <Button
            onClick={handleConnect}
            className="w-full h-9"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                {platform === "twitter" ? (
                  <FaXTwitter className="w-3.5 h-3.5 mr-2" />
                ) : (
                  <FaDiscord className="w-3.5 h-3.5 mr-2" />
                )}
                Connect {platform === "twitter" ? "X Account" : "Discord"}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full h-9"
            disabled={isConnecting}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
