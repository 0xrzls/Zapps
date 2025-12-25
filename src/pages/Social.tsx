import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Send, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  UserMinus,
  Lock,
  Globe,
  Users,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Shield,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ZappsSocial, ZappsSocialReader, PrivacyMode, FollowMode, type Post, type SocialCounts } from '@/lib/contracts/zappsSocial';
import { ZappsReputationReader } from '@/lib/contracts/zappsReputation';
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';
import { ethers } from 'ethers';
import { Helmet } from 'react-helmet-async';

interface DisplayPost extends Post {
  authorReputation?: number;
  isOwnPost?: boolean;
}

export default function Social() {
  const { address, isConnected, network } = useWallet();
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>(PrivacyMode.Public);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [userSocialCounts, setUserSocialCounts] = useState<SocialCounts>({ followers: 0, following: 0 });
  const [userReputation, setUserReputation] = useState(0);
  const [activeTab, setActiveTab] = useState('feed');

  const isSepoliaNetwork = network === 'sepolia';

  const socialReader = new ZappsSocialReader();
  const reputationReader = new ZappsReputationReader();

  useEffect(() => {
    if (isSepoliaNetwork) {
      fetchUserData();
    }
    setLoading(false);
  }, [address, isSepoliaNetwork]);

  const fetchUserData = async () => {
    if (!address) return;

    try {
      const [counts, reputation] = await Promise.all([
        socialReader.getSocialCounts(address),
        reputationReader.getReputation(address),
      ]);
      setUserSocialCounts(counts);
      setUserReputation(reputation);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const getWalletAdapter = (): ZappsSocial | null => {
    const adapter = (window as any).__walletAdapter;
    if (!adapter || !(adapter instanceof EVMWalletAdapter)) {
      toast.error('Please connect your wallet');
      return null;
    }
    return new ZappsSocial(adapter);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    if (!isConnected || !isSepoliaNetwork) {
      toast.error('Please connect to Sepolia network');
      return;
    }

    const social = getWalletAdapter();
    if (!social) return;

    setPosting(true);
    try {
      const tx = await social.createPost(newPostContent, privacyMode, 0);
      toast.success('Post created! Waiting for confirmation...');
      await tx.wait();
      toast.success('Post confirmed on-chain!');
      setNewPostContent('');
      
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (postId: string, isUpvote: boolean) => {
    if (!isConnected || !isSepoliaNetwork) {
      toast.error('Please connect to Sepolia network');
      return;
    }

    const social = getWalletAdapter();
    if (!social) return;

    try {
      const tx = isUpvote 
        ? await social.upvote(postId)
        : await social.downvote(postId);
      toast.success(`${isUpvote ? 'Upvoted' : 'Downvoted'}! Waiting for confirmation...`);
      await tx.wait();
      toast.success('Vote confirmed!');
    } catch (error: any) {
      console.error('Failed to vote:', error);
      toast.error(error.message || 'Failed to vote');
    }
  };

  const handleFollow = async (targetAddress: string) => {
    if (!isConnected || !isSepoliaNetwork) {
      toast.error('Please connect to Sepolia network');
      return;
    }

    const social = getWalletAdapter();
    if (!social) return;

    try {
      const tx = await social.follow(targetAddress, FollowMode.Public);
      toast.success('Following! Waiting for confirmation...');
      await tx.wait();
      toast.success('Now following!');
      fetchUserData();
    } catch (error: any) {
      console.error('Failed to follow:', error);
      toast.error(error.message || 'Failed to follow');
    }
  };

  const getPrivacyIcon = (mode: PrivacyMode) => {
    switch (mode) {
      case PrivacyMode.Public:
        return <Globe className="w-4 h-4" />;
      case PrivacyMode.FollowersOnly:
        return <Users className="w-4 h-4" />;
      case PrivacyMode.Private:
        return <Lock className="w-4 h-4" />;
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isSepoliaNetwork) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Encrypted Social | Zapps</title>
          <meta name="description" content="Privacy-first encrypted social network powered by FHE" />
        </Helmet>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="w-16 h-16 text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Encrypted Social</h1>
          <p className="text-muted-foreground mb-6">
            Please switch to Sepolia network to access the encrypted social features
          </p>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Sepolia Testnet Required
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Encrypted Social | Zapps</title>
        <meta name="description" content="Privacy-first encrypted social network powered by FHE" />
      </Helmet>

      {}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Encrypted Social</h1>
          <p className="text-muted-foreground">
            Privacy-first social network powered by FHE
          </p>
        </div>
        <Badge className="ml-auto" variant="secondary">
          <Sparkles className="w-3 h-3 mr-1" />
          Beta
        </Badge>
      </div>

      {}
      {isConnected && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{userSocialCounts.followers}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{userSocialCounts.following}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{userReputation}</p>
              <p className="text-sm text-muted-foreground">Reputation</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="create">Create Post</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to create an encrypted post!
                </p>
                <Button onClick={() => setActiveTab('create')}>
                  Create Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {post.author.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">
                            {formatAddress(post.author)}
                          </span>
                          {getPrivacyIcon(post.privacyMode)}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(post.timestamp * 1000, { addSuffix: true })}
                          </span>
                          {post.authorReputation && post.authorReputation > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Rep: {post.authorReputation}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap mb-3">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleVote(post.id, true)}
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            {post.upvotes}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleVote(post.id, false)}
                          >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            {post.downvotes}
                          </Button>
                          {!post.isOwnPost && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleFollow(post.author)}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Follow
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Connect your wallet to create posts
                  </p>
                </div>
              ) : (
                <>
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your mind? (Encrypted on-chain)"
                    rows={4}
                    className="resize-none"
                  />

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Privacy:</span>
                    <div className="flex gap-2">
                      <Button
                        variant={privacyMode === PrivacyMode.Public ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPrivacyMode(PrivacyMode.Public)}
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        Public
                      </Button>
                      <Button
                        variant={privacyMode === PrivacyMode.FollowersOnly ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPrivacyMode(PrivacyMode.FollowersOnly)}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Followers
                      </Button>
                      <Button
                        variant={privacyMode === PrivacyMode.Private ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPrivacyMode(PrivacyMode.Private)}
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Private
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || posting}
                  >
                    {posting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Create Encrypted Post
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Connect your wallet to view your profile
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="text-lg">
                        {address?.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{formatAddress(address || '')}</p>
                      <p className="text-sm text-muted-foreground">
                        Reputation: {userReputation}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold">{userSocialCounts.followers}</p>
                      <p className="text-sm text-muted-foreground">Followers</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold">{userSocialCounts.following}</p>
                      <p className="text-sm text-muted-foreground">Following</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
