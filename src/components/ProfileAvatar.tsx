import { useWallet } from "@/contexts/WalletContext";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { backend } from "@/services";
import { SocialBindingDialog } from "./SocialBindingDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Wallet, LogOut, Copy, ExternalLink, Coins, User, Gift } from "lucide-react";
import { FaXTwitter, FaDiscord } from "react-icons/fa6";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getNetworkConfig } from "@/lib/wallet/config";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ProfileAvatar = () => {
  const { address, network, disconnectWallet, walletType, openClaimReferralModal } = useWallet();
  const { nativeBalance, rvpBalance } = useWalletBalance();
  const { toast } = useToast();
  const navigate = useNavigate();
  const networkConfig = getNetworkConfig(network);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showSocialBinding, setShowSocialBinding] = useState(false);
  const [bindingPlatform, setBindingPlatform] = useState<"twitter" | "discord">("twitter");
  const [showDisconnectDialog, setShowDisconnectDialog] = useState<"twitter" | "discord" | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!address) return;
      
      const { data } = await backend.profiles.getByWallet(address);
      
      if (data) {
        setUserProfile(data);
      }
    };
    
    fetchProfile();

    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const { type, success } = event.data;
      if ((type === 'oauth:twitter:result' || type === 'oauth:discord:result') && success) {
        setTimeout(() => fetchProfile(), 500);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [address]);

  if (!address) return null;

  const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
  const initials = address.slice(0, 2).toUpperCase();

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  const viewExplorer = () => {
    const explorerUrl = `${networkConfig.explorerUrl}/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  const handleDisconnect = async (platform: "twitter" | "discord") => {
    const updates = platform === "twitter" 
      ? {
          twitter_access_token: null,
          twitter_refresh_token: null,
          twitter_user_id: null,
          twitter_username: null,
          twitter_verified: false,
          twitter_connected_at: null,
          twitter_code_verifier: null,
          twitter_state: null
        }
      : {
          discord_access_token: null,
          discord_refresh_token: null,
          discord_user_id: null,
          discord_username: null,
          discord_verified: false,
          discord_connected_at: null,
          discord_token_expires_at: null
        };

    const { error } = await backend.profiles.update(address, updates);
    
    if (error) {
      toast({
        title: "Error",
        description: `Failed to disconnect ${platform === "twitter" ? "Twitter" : "Discord"}`,
        variant: "destructive"
      });
    } else {
      setUserProfile({ 
        ...userProfile, 
        [platform === "twitter" ? "twitter_username" : "discord_username"]: null 
      });
      toast({
        title: "Disconnected",
        description: `${platform === "twitter" ? "Twitter" : "Discord"} account disconnected successfully`
      });
    }
    setShowDisconnectDialog(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {walletType?.charAt(0).toUpperCase()}{walletType?.slice(1)} Wallet
              </span>
            </div>
            <p className="text-sm font-mono font-medium leading-none">
              {shortAddress}
            </p>
            <div className="text-xs text-muted-foreground">
              Network: {network}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-medium">
              {nativeBalance.toFixed(4)} {networkConfig.nativeToken}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Coins className="w-3 h-3" /> ZVP:
            </span>
            <span className="font-medium text-primary">
              {rvpBalance.toLocaleString()}
            </span>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Social Accounts</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaXTwitter className="w-4 h-4 text-blue-500" />
              <span className="text-sm">X (Twitter)</span>
            </div>
            {userProfile?.twitter_username ? (
              <Badge 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => setShowDisconnectDialog("twitter")}
              >
                {userProfile.twitter_username}
              </Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setBindingPlatform("twitter");
                  setShowSocialBinding(true);
                }}
              >
                Connect
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaDiscord className="w-4 h-4 text-indigo-500" />
              <span className="text-sm">Discord</span>
            </div>
            {userProfile?.discord_username ? (
              <Badge 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => setShowDisconnectDialog("discord")}
              >
                {userProfile.discord_username}
              </Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setBindingPlatform("discord");
                  setShowSocialBinding(true);
                }}
              >
                Connect
              </Button>
            )}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>View Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={viewExplorer} className="cursor-pointer">
          <ExternalLink className="mr-2 h-4 w-4" />
          <span>View in Explorer</span>
        </DropdownMenuItem>
        {userProfile?.referred_by && (
          <DropdownMenuItem onClick={() => openClaimReferralModal?.()} className="cursor-pointer">
            <Gift className="mr-2 h-4 w-4" />
            <span>Claim Referral Reward</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={disconnectWallet}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      
      <SocialBindingDialog
        open={showSocialBinding}
        onOpenChange={setShowSocialBinding}
        platform={bindingPlatform}
        walletAddress={address}
        onBindSuccess={() => {
          const refetch = async () => {
            const { data } = await backend.profiles.getByWallet(address);
            
            if (data) {
              setUserProfile(data);
            }
          };
          refetch();
        }}
      />

      <AlertDialog open={showDisconnectDialog !== null} onOpenChange={() => setShowDisconnectDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {showDisconnectDialog === "twitter" ? "Twitter" : "Discord"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your {showDisconnectDialog === "twitter" ? "Twitter" : "Discord"} account? 
              You can reconnect it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showDisconnectDialog && handleDisconnect(showDisconnectDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
};