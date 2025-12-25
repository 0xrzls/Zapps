import { useState } from 'react';
import { Share2, Twitter } from 'lucide-react';
import { FaXTwitter } from "react-icons/fa6";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { toast } from '@/hooks/use-toast';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dappName: string;
  dappDescription: string;
  dappUrl?: string;
  dappCategory?: string;
  dappTwitter?: string;
}

export const ShareDialog = ({ isOpen, onClose, dappName, dappDescription, dappUrl, dappCategory, dappTwitter }: ShareDialogProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const generateTweetText = () => {
    const projectHashtag = `#${dappName.replace(/[^\w\s]/g, '').replace(/\s+/g, '')}`;
    const projectTwitter = dappTwitter || '';
    const description = dappDescription.length > 100 ? dappDescription.substring(0, 100) + '...' : dappDescription;
    return `Check out ${dappName}! ${description}\n\n@zapps #ZamaFHE @zama_FHE ${projectHashtag} ${projectTwitter}`;
  };

  const handleTwitterShare = () => {
    const tweetText = generateTweetText();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}${dappUrl ? `&url=${encodeURIComponent(dappUrl)}` : ''}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    toast({
      title: "Opening Twitter",
      description: "Share this dApp with your followers!",
    });
  };

  const handleCopyLink = async () => {
    const currentUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast({
        title: "Link Copied",
        description: "The link has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy link to clipboard",
        variant: "destructive"
      });
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="space-y-3">
        <Button 
          onClick={handleTwitterShare}
          className="w-full flex items-center justify-center gap-2"
          variant="default"
        >
          <FaXTwitter className="w-4 h-4" />
          Post on Twitter
        </Button>
        
        <Button 
          onClick={handleCopyLink}
          className="w-full"
          variant="outline"
        >
          Copy Link
        </Button>
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground mb-2">Preview Tweet:</p>
        <div className="bg-muted p-3 rounded-lg text-sm">
          {generateTweetText()}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Share {dappName}</DrawerTitle>
            <DrawerDescription>
              Share this dApp with your network
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {dappName}</DialogTitle>
          <DialogDescription>
            Share this dApp with your network
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
