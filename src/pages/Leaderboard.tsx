import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Gavel,
  Loader2,
  Crown,
  Medal,
  Star
} from 'lucide-react';
import { ZappsAuction, ZappsAuctionReader, type Auction, type LeaderboardEntry } from '@/lib/contracts/zappsAuction';
import { ZappsReputationReader } from '@/lib/contracts/zappsReputation';
import { Helmet } from 'react-helmet-async';

interface UserStats {
  address: string;
  reputation: number;
  auctionsCreated: number;
  auctionsWon: number;
  totalBids: number;
}

export default function Leaderboard() {
  const { address, isConnected, network } = useWallet();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reputation');
  const [auctionStats, setAuctionStats] = useState<Auction[]>([]);
  const [reputationLeaders, setReputationLeaders] = useState<UserStats[]>([]);

  const isSepoliaNetwork = network === 'sepolia';
  const auctionReader = new ZappsAuctionReader();
  const reputationReader = new ZappsReputationReader();

  useEffect(() => {
    if (isSepoliaNetwork) {
      fetchLeaderboardData();
    } else {
      setLoading(false);
    }
  }, [isSepoliaNetwork]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      
      const activeAuctions = await auctionReader.getActiveAuctions();
      const auctionDetails: Auction[] = [];

      for (const id of activeAuctions.slice(0, 10)) {
        const auction = await auctionReader.getAuction(id);
        if (auction) auctionDetails.push(auction);
      }

      setAuctionStats(auctionDetails);
    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-muted-foreground">#{rank}</span>;
    }
  };

  if (!isSepoliaNetwork) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Leaderboard | Zapps</title>
          <meta name="description" content="Top users and analytics dashboard" />
        </Helmet>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Trophy className="w-16 h-16 text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground mb-6">
            Please switch to Sepolia network to view the leaderboard
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
        <title>Leaderboard | Zapps</title>
        <meta name="description" content="Top users and analytics dashboard" />
      </Helmet>

      {}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">
            Top performers and analytics
          </p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{auctionStats.length}</p>
            <p className="text-sm text-muted-foreground">Active Auctions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{reputationLeaders.length || '-'}</p>
            <p className="text-sm text-muted-foreground">Top Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Gavel className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">
              {auctionStats.reduce((sum, a) => sum + a.bidCount, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Bids</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">
              {auctionStats.filter(a => a.finalized).length}
            </p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="reputation">By Reputation</TabsTrigger>
          <TabsTrigger value="auctions">Active Auctions</TabsTrigger>
          <TabsTrigger value="winners">Recent Winners</TabsTrigger>
        </TabsList>

        <TabsContent value="reputation">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Reputation leaderboard data loading...</p>
                  <p className="text-sm mt-2">Connect wallet to see your rank</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="auctions">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : auctionStats.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gavel className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No active auctions</h3>
                <p className="text-muted-foreground">
                  Check back later for new auctions
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {auctionStats.map((auction, index) => (
                <Card key={auction.id.toString()}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        {getRankIcon(index + 1)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{auction.itemName || `Auction #${auction.id}`}</h3>
                        <p className="text-sm text-muted-foreground">
                          By: {formatAddress(auction.seller)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {auction.bidCount} bids
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ends: {new Date(auction.endTime * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="winners">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {auctionStats
                    .filter(a => a.finalized && a.winner !== '0x0000000000000000000000000000000000000000')
                    .slice(0, 10)
                    .map((auction, index) => (
                      <div key={auction.id.toString()} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {auction.winner.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{formatAddress(auction.winner)}</p>
                          <p className="text-sm text-muted-foreground">
                            Won: {auction.itemName || `Auction #${auction.id}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {Number(auction.winningBid)} tokens
                          </p>
                        </div>
                      </div>
                    ))}

                  {auctionStats.filter(a => a.finalized).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No completed auctions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
