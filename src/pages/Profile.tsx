import { useWallet } from "@/contexts/WalletContext";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useOnChainReputation } from "@/hooks/useOnChainReputation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { backend } from "@/services";
import { SocialBindingDialog } from "@/components/SocialBindingDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Wallet, Copy, ExternalLink, Coins, Twitter, MessageCircle, CheckCircle, Star, Shield, TrendingUp, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getNetworkConfig } from "@/lib/wallet/config";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { address, network, disconnectWallet, walletType, isConnected } = useWallet();
  const { nativeBalance, rvpBalance } = useWalletBalance();
  const { reputation, loading: reputationLoading, refresh: refreshReputation } = useOnChainReputation(address);
  const { toast } = useToast();
  const navigate = useNavigate();
  const networkConfig = getNetworkConfig(network);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showSocialBinding, setShowSocialBinding] = useState(false);
  const [bindingPlatform, setBindingPlatform] = useState<"twitter" | "discord">("twitter");
  const [showDisconnectDialog, setShowDisconnectDialog] = useState<"twitter" | "discord" | null>(null);

  useEffect(() => {
    if (!isConnected) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      if (!address) return;
      
      const { data } = await backend.profiles.getByWallet(address);
      if (data) {
        setUserProfile(data);
      }
    };
    
    fetchProfile();
  }, [address, isConnected, navigate]);

  if (!address) {
    return null;
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-6)}`;
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

  const handleDisconnect = () => {
    disconnectWallet();
    navigate("/");
  };

  const handleSocialDisconnect = async (platform: "twitter" | "discord") => {
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
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-4xl">
      {}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Profile</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Manage your wallet and social connections</p>
      </div>

      {}
      <Card className="mb-4 md:mb-6">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-bold text-base md:text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center gap-1.5 md:gap-2 text-sm md:text-lg">
                  <Wallet className="w-3.5 h-3.5 md:w-5 md:h-5" />
                  {walletType?.charAt(0).toUpperCase()}{walletType?.slice(1)} Wallet
                </CardTitle>
                <CardDescription className="font-mono text-xs md:text-sm mt-0.5 md:mt-1">
                  {shortAddress}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              size="sm"
              className="w-full md:w-auto text-xs md:text-sm"
            >
              Disconnect
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="p-3 md:p-4 rounded-lg bg-muted/50">
              <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Network</p>
              <p className="text-sm md:text-lg font-semibold truncate">{network}</p>
            </div>
            <div className="p-3 md:p-4 rounded-lg bg-muted/50">
              <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Balance</p>
              <p className="text-sm md:text-lg font-semibold truncate">
                {nativeBalance.toFixed(4)} {networkConfig.nativeToken}
              </p>
            </div>
          </div>

          <div className="p-3 md:p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Coins className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="text-xs md:text-sm font-semibold">ZVP Balance</span>
              </div>
              <span className="text-lg md:text-2xl font-bold text-primary">
                {rvpBalance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={copyAddress} 
              className="flex-1 text-xs md:text-sm h-9 md:h-10"
              size="sm"
            >
              <Copy className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              Copy Address
            </Button>
            <Button 
              variant="outline" 
              onClick={viewExplorer} 
              className="flex-1 text-xs md:text-sm h-9 md:h-10"
              size="sm"
            >
              <ExternalLink className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              View in Explorer
            </Button>
          </div>
        </CardContent>
      </Card>

      {}
      <Card className="mb-4 md:mb-6">
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                On-Chain Reputation
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">
                Your reputation score on Zapps network (FHE encrypted)
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refreshReputation()}
              disabled={reputationLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${reputationLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-4">
          {reputationLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : reputation ? (
            <>
              {}
              <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <Star className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Level</p>
                    <p className="text-lg md:text-xl font-bold text-primary">{reputation.level}</p>
                  </div>
                </div>
                <Badge variant={reputation.initialized ? "default" : "secondary"} className="text-xs">
                  {reputation.initialized ? "Active" : "Inactive"}
                </Badge>
              </div>

              {}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                  <p className="text-sm font-semibold">
                    {reputation.initialized ? "Initialized" : "Not Started"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Last Activity</p>
                  </div>
                  <p className="text-sm font-semibold">
                    {reputation.lastUpdate > 0 
                      ? new Date(reputation.lastUpdate * 1000).toLocaleDateString()
                      : "Never"
                    }
                  </p>
                </div>
              </div>

              {}
              <p className="text-xs text-muted-foreground text-center">
                Reputation is earned through voting, discussions, and community participation
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Connect to Sepolia network to view reputation
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Social Connections</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Connect your social accounts to participate in campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
          {}
          <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <div className="p-1.5 md:p-2 rounded-full bg-[#1DA1F2]/10 flex-shrink-0">
                <Twitter className="w-4 h-4 md:w-5 md:h-5 text-[#1DA1F2]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-semibold">Twitter</p>
                {userProfile?.twitter_username ? (
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    @{userProfile.twitter_username}
                  </p>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground">Not connected</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {userProfile?.twitter_username ? (
                <>
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
                    onClick={() => setShowDisconnectDialog("twitter")}
                  >
                    <span className="hidden md:inline">Connected</span>
                    <span className="md:hidden">✓</span>
                  </Badge>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs md:text-sm h-8 md:h-9"
                  onClick={() => {
                    setBindingPlatform("twitter");
                    setShowSocialBinding(true);
                  }}
                >
                  <span className="hidden md:inline">Connect Twitter</span>
                  <span className="md:hidden">Connect</span>
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {}
          <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <div className="p-1.5 md:p-2 rounded-full bg-[#5865F2]/10 flex-shrink-0">
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-[#5865F2]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-semibold">Discord</p>
                {userProfile?.discord_username ? (
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    {userProfile.discord_username}
                  </p>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground">Not connected</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {userProfile?.discord_username ? (
                <>
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
                    onClick={() => setShowDisconnectDialog("discord")}
                  >
                    <span className="hidden md:inline">Connected</span>
                    <span className="md:hidden">✓</span>
                  </Badge>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs md:text-sm h-8 md:h-9"
                  onClick={() => {
                    setBindingPlatform("discord");
                    setShowSocialBinding(true);
                  }}
                >
                  <span className="hidden md:inline">Connect Discord</span>
                  <span className="md:hidden">Connect</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
              onClick={() => showDisconnectDialog && handleSocialDisconnect(showDisconnectDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
