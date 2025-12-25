import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useOnChainDiscussion } from '@/hooks/useOnChainDiscussion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  MessageCircle,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Users,
  Shield,
  Lock,
  Globe,
  Send,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ethers } from 'ethers';

interface DiscussionThreadProps {
  dappId: string;
}

export function DiscussionThread({ dappId }: DiscussionThreadProps) {
  const { address: walletAddress } = useWallet();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);

  const {
    roomInfo,
    onChainMessages,
    userStats,
    loading: onChainLoading,
    isOnChainAvailable,
    createRoom,
    postMessageOnChain,
    upvoteMessage,
    downvoteMessage,
  } = useOnChainDiscussion(dappId);

  const generateAnonymousId = (address: string) => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(address + dappId));
    return `Anon-${hash.slice(2, 6).toUpperCase()}`;
  };

  const renderOnChainMessage = (message: any) => {
    const anonymousId = generateAnonymousId(message.author);
    const isOwnMessage = message.author.toLowerCase() === walletAddress?.toLowerCase();
    
    return (
      <div key={message.hash} className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
          isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {anonymousId.slice(-2)}
        </div>
        
        <div className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-lg px-2.5 py-1.5 ${
            isOwnMessage 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted/50 border border-border/50'
          }`}>
            <div className={`flex items-center gap-1 mb-0.5 text-[9px] ${
              isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}>
              <span className="font-medium">{anonymousId}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(message.timestamp * 1000), { addSuffix: true })}</span>
              <span>•</span>
              {message.isEncrypted ? <Lock className="w-2 h-2" /> : <Globe className="w-2 h-2" />}
            </div>
            
            <p className={`text-[11px] break-all ${
              isOwnMessage ? 'text-primary-foreground/90' : 'text-foreground/80'
            }`}>
              {message.isEncrypted 
                ? `🔐 ${message.contentHash.slice(0, 16)}...` 
                : `📝 ${message.contentHash.slice(0, 16)}...`
              }
            </p>
          </div>
          
          <div className={`flex items-center gap-1.5 mt-0.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <button
              onClick={() => upvoteMessage(message.hash)}
              disabled={!walletAddress}
              className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors"
            >
              <ThumbsUp className="w-2 h-2" />
              <span>{message.upvotes}</span>
            </button>
            <button
              onClick={() => downvoteMessage(message.hash)}
              disabled={!walletAddress}
              className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
            >
              <ThumbsDown className="w-2 h-2" />
              <span>{message.downvotes}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handlePostOnChain = async () => {
    if (!newMessage.trim() || !walletAddress) return;

    setSending(true);
    try {
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes(newMessage.trim()));
      await postMessageOnChain(contentHash, ethers.ZeroHash, isPrivate);
      setNewMessage('');
      toast.success(isPrivate ? 'Private message sent!' : 'Public message sent!');
    } catch (error: any) {
      console.error('Failed to post:', error);
      toast.error(error.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!walletAddress) return;

    setSending(true);
    try {
      await createRoom();
      toast.success('Discussion room created!');
    } catch (error: any) {
      console.error('Failed to create room:', error);
      toast.error(error.message || 'Failed to create room');
    } finally {
      setSending(false);
    }
  };

  if (!isOnChainAvailable) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="py-2.5 px-3">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            On-Chain Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <Alert className="py-2">
            <AlertCircle className="w-3 h-3" />
            <AlertDescription className="text-[11px]">
              Connect to Sepolia to access on-chain discussions
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-2.5 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            On-Chain Discussion
          </CardTitle>
          {roomInfo && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Users className="w-2.5 h-2.5" />
              <span>{roomInfo.participantCount}</span>
              <span>•</span>
              <span>{roomInfo.messageCount} msgs</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {!roomInfo?.isActive ? (
          <div className="py-6 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-xs font-medium mb-1">Discussion Room</h3>
            <p className="text-[10px] text-muted-foreground mb-2">
              Create on-chain discussion
            </p>
            {walletAddress ? (
              <Button size="sm" onClick={handleCreateRoom} disabled={sending} className="h-7 text-xs">
                {sending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <MessageCircle className="w-3 h-3 mr-1" />}
                Create Room
              </Button>
            ) : (
              <p className="text-[10px] text-muted-foreground">Connect wallet first</p>
            )}
          </div>
        ) : onChainLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : onChainMessages.length === 0 ? (
          <div className="py-6 text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Start the conversation</p>
          </div>
        ) : (
          <div className="space-y-2">
            {onChainMessages.map((msg) => renderOnChainMessage(msg))}
          </div>
        )}

        {userStats?.banned && (
          <Alert variant="destructive" className="text-[10px] py-1.5">
            <AlertCircle className="w-2.5 h-2.5" />
            <AlertDescription className="text-[10px]">Banned</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <div className="p-2.5 border-t">
        {!walletAddress ? (
          <Alert className="py-1.5">
            <AlertCircle className="w-2.5 h-2.5" />
            <AlertDescription className="text-[10px]">Connect wallet to chat</AlertDescription>
          </Alert>
        ) : roomInfo?.isActive ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {isPrivate ? (
                  <Lock className="w-3 h-3 text-primary" />
                ) : (
                  <Globe className="w-3 h-3 text-muted-foreground" />
                )}
                <Label htmlFor="privacy-toggle" className="text-[10px] cursor-pointer">
                  {isPrivate ? 'Private (Hashed)' : 'Public'}
                </Label>
              </div>
              <Switch
                id="privacy-toggle"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                className="scale-75"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-muted/20 rounded-lg p-1.5">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isPrivate ? "🔐 Private message..." : "📝 Public message..."}
                className="flex-1 min-h-[28px] text-[11px] resize-none border-0 bg-transparent focus-visible:ring-0 py-1"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostOnChain();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePostOnChain}
                disabled={!newMessage.trim() || sending}
                className="shrink-0 h-6 w-6"
              >
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-0.5">
              {isPrivate ? <Lock className="w-2 h-2" /> : <Globe className="w-2 h-2" />}
              {isPrivate ? 'Hash stored on-chain • No decryption' : 'Public flag • Hash stored'}
              <span className="mx-1">•</span>
              Gas required
            </p>
          </>
        ) : null}
      </div>
    </Card>
  );
}