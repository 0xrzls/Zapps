import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Shield, 
  Lock, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Star,
  Zap,
  Vote,
  RefreshCw
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOnChainAnalytics } from '@/hooks/useOnChainAnalytics';
import { useState } from 'react';

const Analytics = () => {
  const { isConnected, network } = useWallet();
  const { analytics, loading, error, refresh } = useOnChainAnalytics();
  const [showCharts, setShowCharts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useIsMobile();

  const isFHENetwork = network === 'sepolia';

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="container relative py-6 sm:py-12 px-4">
          <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium">On-Chain Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Zapps Analytics
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl">
              Real-time on-chain voting metrics from the ZappsVoting smart contract
            </p>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Sepolia Network
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Data is fetched directly from the ZappsVoting contract on Sepolia testnet.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="container px-4 -mt-4 sm:-mt-8 mb-6 sm:mb-8">
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-3 sm:gap-4 min-w-max">
            <Card className="min-w-[240px] sm:min-w-[280px] bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total dApps</p>
                    <p className="text-2xl sm:text-3xl font-bold">{loading ? "..." : analytics?.totalDapps || 0}</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-full bg-primary/10 text-primary">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-[240px] sm:min-w-[280px] bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Avg Rating</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-2xl sm:text-3xl font-bold">
                        {loading ? "..." : (analytics?.averageRating || 0).toFixed(1)}
                      </p>
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">/5</span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-full bg-green-500/10 text-green-500">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-[240px] sm:min-w-[280px] bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">Encrypted Votes</p>
                      <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">
                      {loading ? "..." : (analytics?.totalEncryptedVotes || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-full bg-blue-500/10 text-blue-500">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-[240px] sm:min-w-[280px] bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Last Snapshot</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl sm:text-2xl font-bold">
                        {loading ? "..." : analytics?.lastSnapshotTime || "Never"}
                      </p>
                      {!loading && analytics?.lastSnapshotTime !== 'Never' && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-full bg-purple-500/10 text-purple-500">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {}
      <div className="container px-4 mb-6">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <Label htmlFor="show-charts" className="text-sm font-medium cursor-pointer">
                  Show Analytics Charts
                </Label>
              </div>
              <Switch
                id="show-charts"
                checked={showCharts}
                onCheckedChange={setShowCharts}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      {showCharts && (
        <div className="container px-4 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Weekly Activity
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Unique Voting Users (UVU) per day</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <ChartContainer
                  config={{
                    uniqueVoters: {
                      label: "Unique Voters",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[180px] sm:h-[220px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.weeklyActivity || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorVoters" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={isMobile ? 9 : 11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={isMobile ? 9 : 11} width={30} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="uniqueVoters" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorVoters)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  User Growth
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Daily new voting users</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <ChartContainer
                  config={{
                    newVoters: {
                      label: "New Voters",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[180px] sm:h-[220px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analytics?.userGrowth || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={isMobile ? 9 : 11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={isMobile ? 9 : 11} width={30} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="newVoters" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {}
      <div className="container px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Top Rated dApps
                <Badge variant="outline" className="ml-auto gap-1 text-xs">
                  <Vote className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">By Votes</span>
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">dApps with most on-chain votes</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {loading ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">Loading from contract...</div>
                ) : analytics?.topDapps && analytics.topDapps.length > 0 ? (
                  analytics.topDapps.map((dapp, index) => (
                    <div key={dapp.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm flex-shrink-0">
                            #{index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">{dapp.name}</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="truncate">{dapp.category}</span>
                              {dapp.rating > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                    <span>{dapp.rating.toFixed(1)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-base sm:text-lg">{dapp.voteCount}</p>
                            <Vote className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">votes</p>
                        </div>
                      </div>
                      {index < analytics.topDapps.length - 1 && <Separator />}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    No on-chain votes yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                On-chain Metrics
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Real-time data from smart contract</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base">Total Votes</p>
                      <p className="text-xs text-muted-foreground truncate">All on-chain votes</p>
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold flex-shrink-0">
                    {loading ? "..." : (analytics?.totalVotes || 0).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base">Unique Voters</p>
                      <p className="text-xs text-muted-foreground truncate">Total unique addresses</p>
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold flex-shrink-0">
                    {loading ? "..." : (analytics?.totalUniqueVoters || 0).toLocaleString()}
                  </p>
                </div>

                <Separator />

                <div className="p-3 sm:p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-green-500" />
                        <p className="font-medium text-xs sm:text-sm">FHE Protected Voting</p>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Votes encrypted with TFHE and decrypted via Zama Gateway
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 sm:p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm">Error fetching data</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {error.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {}
        {!isFHENetwork && isConnected && (
          <Card className="mt-4 sm:mt-6 bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Switch to Sepolia for FHE Voting</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    To cast encrypted votes, please switch to the Sepolia testnet network.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;
