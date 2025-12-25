import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { 
  createCampaign, 
  getCampaignInfo,
  getCampaignTask,
  getCampaignReward,
  getNextCampaignId,
  addTaskToCampaign,
  addRewardToCampaign,
  setDailyLoginReward,
  setReferralRewards,
  setCampaignPaused
} from '@/lib/contracts/rewardManagerV2';
import { Plus, Settings, Award, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { backend } from '@/services';

interface CampaignData {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  taskType: number;
  requiredTaskCount: number;
  totalParticipants: number;
  taskCount: number;
  rewardCount: number;
  isActive: boolean;
}

export default function ContractCampaigns() {
  const { toast } = useToast();
  const { isConnected, address, network } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [nextCampaignId, setNextCampaignId] = useState(0);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('0'); 
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [requiredTasks, setRequiredTasks] = useState('1');
  
  const [displayTarget, setDisplayTarget] = useState<'campaigns' | 'rewards_one_time' | 'draft'>(
    campaignType === '0' ? 'rewards_one_time' : 'draft'
  );
  const [displayTargets, setDisplayTargets] = useState<Record<number, 'campaigns' | 'rewards_one_time' | 'draft'>>({});
  
  useEffect(() => {
    setDisplayTarget(campaignType === '0' ? 'rewards_one_time' : 'draft');
  }, [campaignType]);
  
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskReward, setTaskReward] = useState('10');
  const [taskRequired, setTaskRequired] = useState(true);
  const [taskLink, setTaskLink] = useState('');
  
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [rewardType, setRewardType] = useState('0'); 
  const [rewardAmount, setRewardAmount] = useState('100');
  const [nftId, setNftId] = useState('0');
  const [tokenAddress, setTokenAddress] = useState(ethers.ZeroAddress);
  const [isSoulbound, setIsSoulbound] = useState(false);
  
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [dailyReward, setDailyReward] = useState('10');
  const [referrerReward, setReferrerReward] = useState('50');
  const [referredReward, setReferredReward] = useState('25');
  
  useEffect(() => {
    if (isConnected && address) {
      fetchCampaigns();
    }
  }, [isConnected, address, network]);

  const getProvider = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error('No ethereum provider found');
    return new ethers.BrowserProvider(ethereum);
  };

  const fetchCampaigns = async () => {
    try {
      const provider = await getProvider();
      const nextId = await getNextCampaignId(provider, network);
      setNextCampaignId(nextId);
      
      const campaignList: CampaignData[] = [];
      for (let i = 0; i < nextId; i++) {
        try {
          const info = await getCampaignInfo(provider, network, i);
          campaignList.push({ id: i, ...info });
        } catch (err) {
          console.error(`Error fetching campaign ${i}:`, err);
        }
      }
      
      setCampaigns(campaignList);
      
      const { data: dbCampaigns } = await backend.campaigns.getAllWithMetadata();
      const map: Record<number, 'campaigns' | 'rewards_one_time'> = {};
      dbCampaigns?.forEach((row: any) => {
        const onChainId = row?.campaign_metadata?.onChainId;
        if (typeof onChainId === 'number') {
          map[onChainId] = (row.display_target as 'campaigns' | 'rewards_one_time') || 'campaigns';
        }
      });
      setDisplayTargets(map);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch campaigns",
        variant: "destructive"
      });
    }
  };

  const handleUpdateDisplayTarget = async (
    onChainId: number,
    target: 'campaigns' | 'rewards_one_time' | 'draft'
  ) => {
    try {
      const { error } = await backend.campaigns.updateByOnChainId(onChainId, { display_target: target });

      if (error) throw error;

      setDisplayTargets((prev) => ({ ...prev, [onChainId]: target }));
      toast({ title: 'Updated', description: `Display set to ${target}` });
    } catch (error: any) {
      console.error('Error updating display target:', error);
      toast({ title: 'Failed', description: error.message || 'Update failed', variant: 'destructive' });
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !startTime || !endTime) {
      toast({ title: "Validation Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const provider = await getProvider();
      const start = Math.floor(new Date(startTime).getTime() / 1000);
      const end = Math.floor(new Date(endTime).getTime() / 1000);
      
      const currentCampaignId = nextCampaignId;
      
      toast({ title: "Creating Campaign...", description: "Confirm in wallet" });
      const tx = await createCampaign(provider, network, campaignName, start, end, Number(campaignType), Number(requiredTasks));
      await tx.wait();
      
      toast({ title: "Success!", description: `Campaign #${currentCampaignId} created on-chain` });
      
      await backend.campaigns.create({
        title: campaignName,
        description: `Campaign ${campaignName} (On-chain ID: ${currentCampaignId})`,
        start_date: startTime,
        end_date: endTime,
        status: 'active',
        participants_count: 0,
        display_target: displayTarget,
        campaign_metadata: {
          onChainId: currentCampaignId,
          taskType: Number(campaignType),
          requiredTasks: Number(requiredTasks)
        }
      });
      
      setCreateDialogOpen(false);
      setCampaignName('');
      setStartTime('');
      setEndTime('');
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({ title: "Failed", description: error.message || "Campaign creation failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskName || selectedCampaignId === null) {
      toast({ title: "Validation Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const provider = await getProvider();
      const rewardAmount = BigInt(taskReward);
      
      toast({ title: "Adding Task...", description: "Confirm in wallet" });
      const tx = await addTaskToCampaign(provider, network, selectedCampaignId, taskName, taskDescription, rewardAmount, taskRequired);
      await tx.wait();
      
      toast({ title: "Success!", description: "Task added to campaign" });
      
      const { data: campaignData } = await backend.campaigns.getByOnChainId(selectedCampaignId);
        
      if (campaignData) {
        await backend.quests.create({
          campaign_id: campaignData.id,
          title: taskName,
          description: taskDescription,
          points: Number(taskReward),
          quest_type: 'manual',
          verification_method: 'manual',
          link: taskLink,
          quest_metadata: {
            onChainTaskId: selectedCampaignId,
            isRequired: taskRequired
          }
        });
      }
      
      setTaskDialogOpen(false);
      setTaskName('');
      setTaskDescription('');
      setTaskLink('');
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({ title: "Failed", description: error.message || "Task addition failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReward = async () => {
    if (selectedCampaignId === null) {
      toast({ title: "Validation Error", description: "Please select a campaign", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const provider = await getProvider();
      
      const amountInWei = BigInt(rewardAmount) * BigInt(10);
      
      toast({ title: "Adding Reward...", description: "Confirm in wallet" });
      const tx = await addRewardToCampaign(
        provider, 
        network, 
        selectedCampaignId, 
        Number(rewardType), 
        amountInWei, 
        Number(nftId), 
        tokenAddress,
        isSoulbound
      );
      await tx.wait();
      
      toast({ title: "Success!", description: "Reward added to campaign" });
      
      const { data: campaignsData } = await backend.campaigns.getAll({ limit: 1 });
      if (campaignsData && campaignsData.length > 0) {
        await backend.rewards.create({
          campaign_id: campaignsData[0].id,
          reward_name: rewardType === '0' ? 'ZVP Tokens' : rewardType === '1' ? 'NFT' : 'Ecosystem Token',
          reward_type: rewardType === '0' ? 'token' : 'nft',
          reward_config: { amount: rewardAmount, type: rewardType }
        });
      }
      
      setRewardDialogOpen(false);
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error adding reward:', error);
      toast({ title: "Failed", description: error.message || "Reward addition failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      const provider = await getProvider();
      
      const dailyInWei = ethers.parseEther(dailyReward);
      toast({ title: "Updating Daily Reward...", description: "Confirm in wallet" });
      const tx1 = await setDailyLoginReward(provider, network, dailyInWei);
      await tx1.wait();
      
      toast({ title: "Updating Referral Rewards...", description: "Confirm in wallet" });
      const tx2 = await setReferralRewards(provider, network, Number(referrerReward), Number(referredReward));
      await tx2.wait();
      
      toast({ title: "Success!", description: "Reward settings updated" });
      setSettingsDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({ title: "Failed", description: error.message || "Settings update failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeName = (type: number) => {
    const types = ['OneTime', 'Quest', 'Task', 'Bounty'];
    return types[type] || 'Unknown';
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please connect your wallet to manage contract campaigns
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Contract Campaign Management</h2>
          <p className="text-muted-foreground">Manage on-chain campaigns & rewards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>On-Chain Campaigns (Total: {nextCampaignId})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Rewards</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Display</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>{campaign.id}</TableCell>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTaskTypeName(campaign.taskType)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(campaign.startTime * 1000).toLocaleDateString()} - {new Date(campaign.endTime * 1000).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{campaign.taskCount} / {campaign.requiredTaskCount}</TableCell>
                  <TableCell>{campaign.rewardCount}</TableCell>
                  <TableCell>{campaign.totalParticipants}</TableCell>
                  <TableCell>
                    <Badge className={campaign.isActive ? 'bg-green-500/10 text-green-500' : 'bg-muted'}>
                      {campaign.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={displayTargets[campaign.id] || 'draft'}
                      onValueChange={(val) => handleUpdateDisplayTarget(campaign.id, val as 'campaigns' | 'rewards_one_time' | 'draft')}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select display" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft (Not Published)</SelectItem>
                        <SelectItem value="campaigns">Campaigns Page</SelectItem>
                        <SelectItem value="rewards_one_time">Rewards: One-Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedCampaignId(campaign.id);
                          setTaskDialogOpen(true);
                        }}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Task
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedCampaignId(campaign.id);
                          setRewardDialogOpen(true);
                        }}
                      >
                        <Award className="h-3 w-3 mr-1" />
                        Reward
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Enter campaign name" />
            </div>
            <div>
              <Label>Campaign Type</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">OneTime (Rewards Page)</SelectItem>
                  <SelectItem value="1">Quest (Multi-step)</SelectItem>
                  <SelectItem value="2">Task (Single Task)</SelectItem>
                  <SelectItem value="3">Bounty (Competition)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Required Tasks to Complete</Label>
              <Input type="number" value={requiredTasks} onChange={(e) => setRequiredTasks(e.target.value)} placeholder="1" />
            </div>
            <Button onClick={handleCreateCampaign} disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Task to Campaign #{selectedCampaignId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Task Name</Label>
              <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="e.g. Follow on Twitter" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Task instructions..." />
            </div>
            <div>
              <Label>Task Link/URL</Label>
              <Input value={taskLink} onChange={(e) => setTaskLink(e.target.value)} placeholder="e.g. https://twitter.com/zamaverse" />
            </div>
            <div>
              <Label>Reward Amount (ZVP)</Label>
              <Input type="number" value={taskReward} onChange={(e) => setTaskReward(e.target.value)} placeholder="10" />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={taskRequired} 
                onChange={(e) => setTaskRequired(e.target.checked)}
                className="w-4 h-4"
              />
              <Label>Required Task (must complete to claim reward)</Label>
            </div>
            <Button onClick={handleAddTask} disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Reward to Campaign #{selectedCampaignId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reward Type</Label>
              <Select value={rewardType} onValueChange={setRewardType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">ZVP Token</SelectItem>
                  <SelectItem value="1">NFT</SelectItem>
                  <SelectItem value="2">Ecosystem Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} placeholder="100" />
            </div>
            {rewardType === '1' && (
              <div>
                <Label>NFT ID</Label>
                <Input type="number" value={nftId} onChange={(e) => setNftId(e.target.value)} placeholder="0" />
              </div>
            )}
            {rewardType === '2' && (
              <div>
                <Label>Token Address</Label>
                <Input value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} placeholder="0x..." />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={isSoulbound} 
                onChange={(e) => setIsSoulbound(e.target.checked)}
                className="w-4 h-4"
              />
              <Label>Soulbound (non-transferable)</Label>
            </div>
            <Button onClick={handleAddReward} disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'Add Reward'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reward Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Daily Login Reward (ZVP)</Label>
              <Input type="number" value={dailyReward} onChange={(e) => setDailyReward(e.target.value)} placeholder="10" />
            </div>
            <div>
              <Label>Referrer Reward (RVP)</Label>
              <Input type="number" value={referrerReward} onChange={(e) => setReferrerReward(e.target.value)} placeholder="50" />
            </div>
            <div>
              <Label>Referred User Reward (RVP)</Label>
              <Input type="number" value={referredReward} onChange={(e) => setReferredReward(e.target.value)} placeholder="25" />
            </div>
            <Button onClick={handleUpdateSettings} disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Update Settings'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
