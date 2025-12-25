import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { ZVP_ABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';
import RewardManagerABI from '@/lib/contracts/abis-json/RewardManager.json';
import { Wallet, Shield, TrendingUp, RefreshCw, CheckCircle, AlertTriangle, ExternalLink, Plus, Zap, BarChart, ListPlus, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function RewardManagerAdmin() {
  const { toast } = useToast();
  const { isConnected, address, network } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [contractAddresses, setContractAddresses] = useState<any>(null);
  const [treasuryAddress, setTreasuryAddress] = useState<string>('');
  const [dailyReward, setDailyReward] = useState<string>('0');
  const [referrerReward, setReferrerReward] = useState<string>('0');
  const [referredReward, setReferredReward] = useState<string>('0');
  const [maxReferrals, setMaxReferrals] = useState<number>(0);
  const [paused, setPausedState] = useState<boolean>(false);
  const [oracleAddress, setOracleAddress] = useState<string>('');
  const [ownerAddress, setOwnerAddress] = useState<string>('');
  
  const [treasuryBalance, setTreasuryBalance] = useState<string>('0');
  const [allowance, setAllowance] = useState<string>('0');
  const [isAllowanceSufficient, setIsAllowanceSufficient] = useState(false);
  
  const [approvalAmount, setApprovalAmount] = useState<string>('1000');
  
  const [newTreasury, setNewTreasury] = useState<string>('');
  const [newOracle, setNewOracle] = useState<string>('');
  const [newOwner, setNewOwner] = useState<string>('');

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [nextCampaignId, setNextCampaignId] = useState<number>(0);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  
  const [decTotalPaid, setDecTotalPaid] = useState<string>('0');
  const [decTotalDailyClaims, setDecTotalDailyClaims] = useState<string>('0');
  const [decTotalReferrals, setDecTotalReferrals] = useState<string>('0');

  useEffect(() => {
    if (isConnected && address) {
      fetchContractInfo();
      fetchCampaigns();
      fetchAnalytics();
    }
  }, [isConnected, address, network]);

  const getProvider = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error('No ethereum provider found');
    }
    return new ethers.BrowserProvider(ethereum);
  };

  const fetchContractInfo = async () => {
    setRefreshing(true);
    try {
      const provider = await getProvider();
      const addresses = await getContractAddresses(network);
      setContractAddresses(addresses);

      const rewardManager = new ethers.Contract(
        addresses.REWARD_MANAGER,
        RewardManagerABI.abi,
        provider
      );

      const zvpToken = new ethers.Contract(
        addresses.ZVP_TOKEN,
        ZVP_ABI,
        provider
      );

      const [
        treasury,
        dailyRewardRaw,
        referrerRewardRaw,
        referredRewardRaw,
        maxReferralsRaw,
        pausedRaw,
        ownerRaw,
        oracleRaw,
        decimals
      ] = await Promise.all([
        rewardManager.treasury(),
        rewardManager.DAILY_REWARD(),
        rewardManager.REFERRER_REWARD(),
        rewardManager.REFERRED_REWARD(),
        rewardManager.MAX_REFERRALS(),
        rewardManager.paused(),
        rewardManager.owner(),
        rewardManager.oracle(),
        zvpToken.decimals()
      ]);

      setTreasuryAddress(treasury);
      setDailyReward(ethers.formatUnits(dailyRewardRaw, decimals));
      setReferrerReward(ethers.formatUnits(referrerRewardRaw, decimals));
      setReferredReward(ethers.formatUnits(referredRewardRaw, decimals));
      setMaxReferrals(Number(maxReferralsRaw));
      setPausedState(Boolean(pausedRaw));
      setOracleAddress(oracleRaw);
      setOwnerAddress(ownerRaw);

      const [balance, allowanceRaw] = await Promise.all([
        zvpToken.balanceOf(treasury),
        zvpToken.allowance(treasury, addresses.REWARD_MANAGER)
      ]);

      const balanceFormatted = ethers.formatUnits(balance, decimals);
      const allowanceFormatted = ethers.formatUnits(allowanceRaw, decimals);

      setTreasuryBalance(balanceFormatted);
      setAllowance(allowanceFormatted);
      
      const dailyRewardNum = Number(ethers.formatUnits(dailyRewardRaw, decimals));
      const allowanceNum = Number(allowanceFormatted);
      setIsAllowanceSufficient(allowanceNum >= dailyRewardNum);

      const nextId = await rewardManager.nextCampaignId();
      setNextCampaignId(Number(nextId));

      toast({
        title: "Contract Info Loaded",
        description: "Successfully fetched RewardManager details"
      });
    } catch (error: any) {
      console.error('Error fetching contract info:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch contract info",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async () => {
    if (!isConnected || !contractAddresses) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!approvalAmount || Number(approvalAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid approval amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      const zvpToken = new ethers.Contract(
        contractAddresses.ZVP_TOKEN,
        ZVP_ABI,
        signer
      );

      const decimals = await zvpToken.decimals();
      const amountInWei = ethers.parseUnits(approvalAmount, decimals);

      toast({
        title: "Approving...",
        description: "Please confirm the transaction in your wallet"
      });

      const tx = await zvpToken.approve(contractAddresses.REWARD_MANAGER, amountInWei);
      
      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation..."
      });

      await tx.wait();

      toast({
        title: "Success!",
        description: `Approved ${approvalAmount} ZVP to RewardManager`,
      });

      await fetchContractInfo();
    } catch (error: any) {
      console.error('Error approving:', error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve tokens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = (addr: string) => {
    try { return ethers.isAddress(addr); } catch { return false; }
  };

  const handleSetTreasury = async () => {
    if (!isConnected || !contractAddresses) {
      toast({ title: "Not Connected", description: "Connect wallet terlebih dulu", variant: "destructive" });
      return;
    }
    if (!validateAddress(newTreasury)) {
      toast({ title: "Alamat tidak valid", description: "Masukkan alamat treasury yang benar" , variant: "destructive"});
      return;
    }
    setLoading(true);
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const rm = new ethers.Contract(contractAddresses.REWARD_MANAGER, RewardManagerABI.abi, signer);
      const tx = await rm.setTreasury(newTreasury);
      toast({ title: "Submitting...", description: "Konfirmasi di wallet" });
      await tx.wait();
      toast({ title: "Treasury diupdate", description: newTreasury });
      setNewTreasury('');
      await fetchContractInfo();
    } catch (error: any) {
      console.error('Error setTreasury:', error);
      toast({ title: "Gagal update treasury", description: error.message || 'Tx gagal', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleSetOracle = async () => {
    if (!isConnected || !contractAddresses) {
      toast({ title: "Not Connected", description: "Connect wallet terlebih dulu", variant: "destructive" });
      return;
    }
    if (!validateAddress(newOracle)) {
      toast({ title: "Alamat tidak valid", description: "Masukkan alamat oracle yang benar", variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const rm = new ethers.Contract(contractAddresses.REWARD_MANAGER, RewardManagerABI.abi, signer);
      const tx = await rm.setOracle(newOracle);
      toast({ title: "Submitting...", description: "Konfirmasi di wallet" });
      await tx.wait();
      toast({ title: "Oracle diupdate", description: newOracle });
      setNewOracle('');
      await fetchContractInfo();
    } catch (error: any) {
      console.error('Error setOracle:', error);
      toast({ title: "Gagal update oracle", description: error.message || 'Tx gagal', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleTogglePaused = async () => {
    if (!isConnected || !contractAddresses) {
      toast({ title: "Not Connected", description: "Connect wallet terlebih dulu", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const rm = new ethers.Contract(contractAddresses.REWARD_MANAGER, RewardManagerABI.abi, signer);
      const tx = await rm.setPaused(!paused);
      toast({ title: "Submitting...", description: "Konfirmasi di wallet" });
      await tx.wait();
      toast({ title: !paused ? "Contract Paused" : "Contract Unpaused", description: '' });
      await fetchContractInfo();
    } catch (error: any) {
      console.error('Error setPaused:', error);
      toast({ title: "Gagal update pause", description: error.message || 'Tx gagal', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleTransferOwnership = async () => {
    if (!isConnected || !contractAddresses) {
      toast({ title: "Not Connected", description: "Connect wallet terlebih dulu", variant: "destructive" });
      return;
    }
    if (!validateAddress(newOwner)) {
      toast({ title: "Alamat tidak valid", description: "Masukkan alamat owner baru yang benar", variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const rm = new ethers.Contract(contractAddresses.REWARD_MANAGER, RewardManagerABI.abi, signer);
      const tx = await rm.transferOwnership(newOwner);
      toast({ title: "Submitting...", description: "Konfirmasi di wallet" });
      await tx.wait();
      toast({ title: "Owner ditransfer", description: newOwner });
      setNewOwner('');
      await fetchContractInfo();
    } catch (error: any) {
      console.error('Error transferOwnership:', error);
      toast({ title: "Gagal transfer owner", description: error.message || 'Tx gagal', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const copyAddress = (addr: string, label: string) => {
    navigator.clipboard.writeText(addr);
    toast({
      title: "Copied!",
      description: `${label} address copied to clipboard`
    });
  };

  const fetchCampaigns = async () => {
    try {
      const provider = await getProvider();
      const addresses = await getContractAddresses(network);
      const rewardManager = new ethers.Contract(addresses.REWARD_MANAGER, RewardManagerABI.abi, provider);
      
      const nextId = await rewardManager.nextCampaignId();
      const campaignList = [];
      
      for (let i = 0; i < Number(nextId); i++) {
        try {
          const campaign = await rewardManager.campaigns(i);
          if (campaign.exists) {
            const typeNames = ['OTHER', 'QUEST', 'TASK', 'BOUNTY'];
            campaignList.push({
              id: i,
              name: campaign.name,
              type: typeNames[campaign.rtype] || 'OTHER',
              rewardAmount: ethers.formatEther(campaign.rewardAmount),
              claimStart: Number(campaign.claimStart),
              claimEnd: Number(campaign.claimEnd),
              active: campaign.active,
              needsOracle: campaign.needsOracle,
              requirements: campaign.reqs
            });
          }
        } catch (err) {
          console.error(`Error fetching campaign ${i}:`, err);
        }
      }
      
      setCampaigns(campaignList);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const provider = await getProvider();
      const addresses = await getContractAddresses(network);
      const rewardManager = new ethers.Contract(addresses.REWARD_MANAGER, RewardManagerABI.abi, provider);
      
      const [paid, daily, referrals] = await Promise.all([
        rewardManager.decTotalPaid(),
        rewardManager.decTotalDailyClaims(),
        rewardManager.decTotalReferrals()
      ]);
      
      setDecTotalPaid(paid.toString());
      setDecTotalDailyClaims(daily.toString());
      setDecTotalReferrals(referrals.toString());
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleRequestSnapshot = async (type: 'paid' | 'daily' | 'referrals' | 'campaign', campaignId?: number) => {
    if (!isConnected || !contractAddresses) {
      toast({ title: "Not Connected", description: "Connect wallet first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const rm = new ethers.Contract(contractAddresses.REWARD_MANAGER, RewardManagerABI.abi, signer);
      
      let tx;
      if (type === 'paid') tx = await rm.requestSnapshotGlobalPaid();
      else if (type === 'daily') tx = await rm.requestSnapshotGlobalDailyClaims();
      else if (type === 'referrals') tx = await rm.requestSnapshotGlobalReferrals();
      else if (type === 'campaign' && campaignId !== undefined) tx = await rm.requestSnapshotCampaignClaims(campaignId);
      
      toast({ title: "Snapshot Requested", description: "Wait for FHE gateway callback" });
      await tx.wait();
      toast({ title: "Success", description: "Snapshot request submitted" });
      
      setTimeout(() => fetchAnalytics(), 5000);
    } catch (error: any) {
      console.error('Error requesting snapshot:', error);
      toast({ title: "Failed", description: error.message || 'Snapshot request failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateCampaign = async (data: any) => {
    if (!isConnected || !contractAddresses) {
      toast({ title: "Not Connected", description: "Connect wallet first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const rm = new ethers.Contract(contractAddresses.REWARD_MANAGER, RewardManagerABI.abi, signer);
      
      const typeIndex = ['OTHER', 'QUEST', 'TASK', 'BOUNTY'].indexOf(data.type);
      const reqs = {
        requiredNft721: data.nftContract || ethers.ZeroAddress,
        requiredBadge1155: data.badgeContract || ethers.ZeroAddress,
        badgeId: data.badgeId || 0,
        requiredRoleACL: data.aclContract || ethers.ZeroAddress,
        roleId: data.roleId || ethers.ZeroHash
      };
      
      let tx;
      if (editingCampaign) {
        tx = await rm.updateCampaign(
          editingCampaign.id,
          data.name,
          typeIndex,
          ethers.parseEther(data.rewardAmount),
          data.claimStart,
          data.claimEnd,
          data.active,
          data.needsOracle,
          reqs
        );
        toast({ title: "Updating Campaign...", description: "Confirm in wallet" });
      } else {
        tx = await rm.createCampaign(
          data.name,
          typeIndex,
          ethers.parseEther(data.rewardAmount),
          data.claimStart,
          data.claimEnd,
          data.active,
          data.needsOracle,
          reqs
        );
        toast({ title: "Creating Campaign...", description: "Confirm in wallet" });
      }
      
      await tx.wait();
      toast({ title: "Success!", description: editingCampaign ? "Campaign updated" : "Campaign created" });
      
      setShowCampaignDialog(false);
      setEditingCampaign(null);
      await fetchCampaigns();
      await fetchContractInfo();
    } catch (error: any) {
      console.error('Error with campaign:', error);
      toast({ title: "Failed", description: error.message || 'Campaign operation failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RewardManager</h1>
          <p className="text-muted-foreground mt-1">
            Manage campaigns, rewards, analytics & treasury
          </p>
        </div>
        <Button
          onClick={() => {
            fetchContractInfo();
            fetchCampaigns();
            fetchAnalytics();
          }}
          disabled={refreshing || !isConnected}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {!isConnected && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>Please connect your wallet to manage the RewardManager contract</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isConnected && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {}
          <TabsContent value="overview" className="space-y-6">
            {}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Contract Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">ZVP Token</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono break-all">
                      {contractAddresses?.ZVP_TOKEN || 'Loading...'}
                    </code>
                    {contractAddresses?.ZVP_TOKEN && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyAddress(contractAddresses.ZVP_TOKEN, 'ZVP Token')}
                        >
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={`https://sepolia.etherscan.io/address/${contractAddresses.ZVP_TOKEN}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">RewardManager</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono break-all">
                      {contractAddresses?.REWARD_MANAGER || 'Loading...'}
                    </code>
                    {contractAddresses?.REWARD_MANAGER && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyAddress(contractAddresses.REWARD_MANAGER, 'RewardManager')}
                        >
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={`https://sepolia.etherscan.io/address/${contractAddresses.REWARD_MANAGER}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Treasury</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono break-all">
                      {treasuryAddress || 'Loading...'}
                    </code>
                    {treasuryAddress && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyAddress(treasuryAddress, 'Treasury')}
                        >
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={`https://sepolia.etherscan.io/address/${treasuryAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Reward Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Daily Reward</span>
                    <Badge variant="secondary" className="font-mono">
                      {dailyReward} ZVP
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Referrer Reward</span>
                    <Badge variant="secondary" className="font-mono">
                      {referrerReward} ZVP
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Referred Reward</span>
                    <Badge variant="secondary" className="font-mono">
                      {referredReward} ZVP
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Max Referrals</span>
                    <Badge variant="secondary" className="font-mono">
                      {maxReferrals}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Treasury Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <Badge variant="secondary" className="font-mono">
                      {Number(treasuryBalance).toFixed(2)} ZVP
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Allowance</span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isAllowanceSufficient ? "default" : "destructive"}
                        className="font-mono"
                      >
                        {Number(allowance).toFixed(2)} ZVP
                      </Badge>
                      {isAllowanceSufficient ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Admin Controls</CardTitle>
                <p className="text-sm text-muted-foreground">Kelola parameter RewardManager</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={paused ? 'destructive' : 'default'} className="font-mono">
                      {paused ? 'Paused' : 'Active'}
                    </Badge>
                  </div>
                  <Button size="sm" onClick={handleTogglePaused} disabled={loading}>
                    {paused ? 'Unpause' : 'Pause'}
                  </Button>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-3 items-end">
                  <div className="space-y-2">
                    <Label>Treasury (current)</Label>
                    <code className="block px-3 py-2 bg-muted rounded text-xs font-mono break-all">{treasuryAddress || '—'}</code>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="0x..." value={newTreasury} onChange={(e) => setNewTreasury(e.target.value)} />
                    <Button onClick={handleSetTreasury} disabled={loading || !newTreasury}>Update</Button>
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-3 items-end">
                  <div className="space-y-2">
                    <Label>Oracle (current)</Label>
                    <code className="block px-3 py-2 bg-muted rounded text-xs font-mono break-all">{oracleAddress || '—'}</code>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="0x..." value={newOracle} onChange={(e) => setNewOracle(e.target.value)} />
                    <Button onClick={handleSetOracle} disabled={loading || !newOracle}>Update</Button>
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-3 items-end">
                  <div className="space-y-2">
                    <Label>Owner (current)</Label>
                    <code className="block px-3 py-2 bg-muted rounded text-xs font-mono break-all">{ownerAddress || '—'}</code>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="0x..." value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
                    <Button variant="outline" onClick={handleTransferOwnership} disabled={loading || !newOwner}>Transfer</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Approve ZVP Tokens</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Grant allowance from treasury to RewardManager contract
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAllowanceSufficient && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">Insufficient Allowance</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        The treasury needs to approve at least {dailyReward} ZVP for daily claims to work.
                        Current allowance: {Number(allowance).toFixed(2)} ZVP
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="approval-amount">Approval Amount (ZVP)</Label>
                  <Input
                    id="approval-amount"
                    type="number"
                    value={approvalAmount}
                    onChange={(e) => setApprovalAmount(e.target.value)}
                    placeholder="1000"
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the amount of ZVP tokens to approve for the RewardManager contract.
                    Recommended: Set a high amount (e.g., 10000) to avoid frequent approvals.
                  </p>
                </div>

                <Button
                  onClick={handleApprove}
                  disabled={loading || !approvalAmount}
                  className="w-full"
                >
                  {loading ? "Approving..." : "Approve Tokens"}
                </Button>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Make sure you're connected with the treasury wallet address ({treasuryAddress ? `${treasuryAddress.slice(0, 6)}...${treasuryAddress.slice(-4)}` : 'loading...'}) before approving.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ListPlus className="h-5 w-5" />
                      Campaigns (Quest/Task/Bounty)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Next Campaign ID: {nextCampaignId}
                    </p>
                  </div>
                  <CampaignDialog
                    open={showCampaignDialog}
                    onOpenChange={setShowCampaignDialog}
                    onSubmit={handleCreateOrUpdateCampaign}
                    editingCampaign={editingCampaign}
                    loading={loading}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No campaigns yet. Create one to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map((c) => (
                      <Card key={c.id} className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={c.active ? 'default' : 'secondary'}>
                                  {c.active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline">{c.type}</Badge>
                                <span className="font-semibold">#{c.id}</span>
                              </div>
                              <h4 className="font-bold text-lg">{c.name}</h4>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Reward:</span>{' '}
                                  <span className="font-mono">{c.rewardAmount} ZVP</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Oracle:</span>{' '}
                                  {c.needsOracle ? 'Required' : 'Not Required'}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Start:</span>{' '}
                                  {new Date(c.claimStart * 1000).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">End:</span>{' '}
                                  {new Date(c.claimEnd * 1000).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCampaign(c);
                                setShowCampaignDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total ZVP Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">{decTotalPaid}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => handleRequestSnapshot('paid')}
                    disabled={loading}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Request Snapshot
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Daily Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">{decTotalDailyClaims}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => handleRequestSnapshot('daily')}
                    disabled={loading}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Request Snapshot
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">{decTotalReferrals}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => handleRequestSnapshot('referrals')}
                    disabled={loading}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Request Snapshot
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  FHE Privacy Analytics
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Request snapshot untuk decrypt data agregat dari FHE. Gateway callback akan update nilai setelah beberapa saat.
                </p>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Data di atas terenkripsi dengan FHE. Klik "Request Snapshot" untuk meminta dekripsi dari gateway.
                    Hasil akan muncul setelah callback (biasanya 30-60 detik). Refresh page untuk melihat update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Campaign Dialog Component
function CampaignDialog({
  open,
  onOpenChange,
  onSubmit,
  editingCampaign,
  loading
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  editingCampaign: any;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'QUEST',
    rewardAmount: '100',
    claimStart: Math.floor(Date.now() / 1000),
    claimEnd: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    active: true,
    needsOracle: false,
    nftContract: '',
    badgeContract: '',
    badgeId: '',
    aclContract: '',
    roleId: ''
  });

  useEffect(() => {
    if (editingCampaign) {
      setFormData({
        name: editingCampaign.name,
        type: editingCampaign.type,
        rewardAmount: editingCampaign.rewardAmount,
        claimStart: editingCampaign.claimStart,
        claimEnd: editingCampaign.claimEnd,
        active: editingCampaign.active,
        needsOracle: editingCampaign.needsOracle,
        nftContract: editingCampaign.requirements.requiredNft721 || '',
        badgeContract: editingCampaign.requirements.requiredBadge1155 || '',
        badgeId: editingCampaign.requirements.badgeId?.toString() || '',
        aclContract: editingCampaign.requirements.requiredRoleACL || '',
        roleId: editingCampaign.requirements.roleId || ''
      });
    } else {
      setFormData({
        name: '',
        type: 'QUEST',
        rewardAmount: '100',
        claimStart: Math.floor(Date.now() / 1000),
        claimEnd: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        active: true,
        needsOracle: false,
        nftContract: '',
        badgeContract: '',
        badgeId: '',
        aclContract: '',
        roleId: ''
      });
    }
  }, [editingCampaign, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Complete Tutorial Quest"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUEST">Quest</SelectItem>
                  <SelectItem value="TASK">Task</SelectItem>
                  <SelectItem value="BOUNTY">Bounty</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reward Amount (ZVP)</Label>
              <Input
                type="number"
                value={formData.rewardAmount}
                onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Claim Start (Unix timestamp)</Label>
              <Input
                type="number"
                value={formData.claimStart}
                onChange={(e) => setFormData({ ...formData, claimStart: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Claim End (Unix timestamp)</Label>
              <Input
                type="number"
                value={formData.claimEnd}
                onChange={(e) => setFormData({ ...formData, claimEnd: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.active}
                onCheckedChange={(v) => setFormData({ ...formData, active: v })}
              />
              <Label>Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.needsOracle}
                onCheckedChange={(v) => setFormData({ ...formData, needsOracle: v })}
              />
              <Label>Needs Oracle Signature</Label>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">Requirements (Optional)</h4>
            
            <div className="space-y-2">
              <Label>Required NFT (ERC721) Contract</Label>
              <Input
                value={formData.nftContract}
                onChange={(e) => setFormData({ ...formData, nftContract: e.target.value })}
                placeholder="0x..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Required Badge (ERC1155) Contract</Label>
                <Input
                  value={formData.badgeContract}
                  onChange={(e) => setFormData({ ...formData, badgeContract: e.target.value })}
                  placeholder="0x..."
                />
              </div>

              <div className="space-y-2">
                <Label>Badge ID</Label>
                <Input
                  type="number"
                  value={formData.badgeId}
                  onChange={(e) => setFormData({ ...formData, badgeId: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Required Role ACL Contract</Label>
                <Input
                  value={formData.aclContract}
                  onChange={(e) => setFormData({ ...formData, aclContract: e.target.value })}
                  placeholder="0x..."
                />
              </div>

              <div className="space-y-2">
                <Label>Role ID (bytes32)</Label>
                <Input
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  placeholder="0x..."
                />
              </div>
            </div>
          </div>

          <Button
            onClick={() => onSubmit(formData)}
            disabled={loading || !formData.name || !formData.rewardAmount}
            className="w-full"
          >
            {loading ? 'Processing...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
