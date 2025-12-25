import { useWallet } from "@/contexts/WalletContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Network } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { WalletType } from "@/lib/wallet/types";
import metamaskLogo from "@/assets/metamask-fox.svg";
import walletConnectLogo from "@/assets/walletconnect-logo.svg";

const WalletModal = () => {
  const { showWalletModal, setShowWalletModal, connectWallet, isConnected, address, disconnectWallet, walletType, network, switchNetwork } = useWallet();
  const isMobile = useIsMobile();

  const handleConnect = (type: WalletType) => {
    connectWallet(type);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowWalletModal(false);
  };

  const walletContent = (
    <div className="space-y-4 py-4">
      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-xs font-semibold">Connected</div>
                <Badge variant="secondary" className="text-[10px] h-5">
                  {walletType?.charAt(0).toUpperCase()}{walletType?.slice(1)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground font-mono truncate">
                {address}
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold">Network</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={network === 'sepolia' ? 'default' : 'outline'}
                onClick={() => switchNetwork('sepolia')}
                className="text-xs h-8"
              >
                Sepolia
              </Button>
              <Button
                size="sm"
                variant={network === 'base-sepolia' ? 'default' : 'outline'}
                onClick={() => switchNetwork('base-sepolia')}
                className="text-xs h-8"
              >
                Base Sepolia
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleDisconnect}
            variant="outline" 
            className="w-full"
          >
            Disconnect Wallet
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground mb-2">Choose your wallet</div>
          
          <Button
            onClick={() => handleConnect('metamask')}
            className="w-full h-14 justify-start gap-3 text-left gradient-primary glow-effect"
          >
            <img src={metamaskLogo} alt="MetaMask" className="w-8 h-8 object-contain" />
            <div>
              <div className="text-sm font-semibold">MetaMask</div>
              <div className="text-xs opacity-80">Connect via browser extension</div>
            </div>
          </Button>

          <Button
            onClick={() => handleConnect('walletconnect')}
            variant="outline"
            className="w-full h-14 justify-start gap-3 text-left"
          >
            <img src={walletConnectLogo} alt="WalletConnect" className="w-8 h-8 object-contain" />
            <div className="text-left">
              <div className="text-sm font-semibold">WalletConnect</div>
              <div className="text-xs text-muted-foreground">Scan with mobile wallet</div>
            </div>
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {isConnected ? "Your Wallet" : "Connect Wallet"}
            </DrawerTitle>
            <DrawerDescription>
              {isConnected ? "Manage your connected wallet" : "Choose a wallet to connect"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {walletContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isConnected ? "Your Wallet" : "Connect Wallet"}
          </DialogTitle>
          <DialogDescription>
            {isConnected ? "Manage your connected wallet and network settings" : "Choose a wallet to connect to the dApp"}
          </DialogDescription>
        </DialogHeader>
        {walletContent}
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;