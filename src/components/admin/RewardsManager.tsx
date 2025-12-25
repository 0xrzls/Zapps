import { useState, useEffect } from 'react';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Reward {
  id: string;
  reward_type: string;
  reward_name: string;
  reward_config: any;
}

interface RewardsManagerProps {
  campaignId: string;
}

export function RewardsManager({ campaignId }: RewardsManagerProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState<{
    reward_type: string;
    reward_name: string;
    reward_config: Record<string, any>;
  }>({
    reward_type: 'points',
    reward_name: '',
    reward_config: {},
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRewards();
  }, [campaignId]);

  const fetchRewards = async () => {
    const { data, error } = await backend.rewards.getByCampaign(campaignId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setRewards(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rewardConfig: any = {};
    
    if (formData.reward_type === 'discord_role') {
      rewardConfig.server_id = formData.reward_config.server_id;
      rewardConfig.role_id = formData.reward_config.role_id;
    } else if (formData.reward_type === 'nft') {
      rewardConfig.contract_address = formData.reward_config.contract_address;
      rewardConfig.chain = formData.reward_config.chain;
    } else if (formData.reward_type === 'token') {
      rewardConfig.token_symbol = formData.reward_config.token_symbol;
      rewardConfig.amount = formData.reward_config.amount;
      rewardConfig.chain = formData.reward_config.chain;
    } else if (formData.reward_type === 'points') {
      rewardConfig.points = formData.reward_config.points;
    }

    const payload = {
      campaign_id: campaignId,
      reward_type: formData.reward_type as any,
      reward_name: formData.reward_name,
      reward_config: rewardConfig,
    };

    if (editingReward) {
      const { error } = await backend.rewards.update(editingReward.id, payload);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Reward updated successfully' });
        resetForm();
        fetchRewards();
      }
    } else {
      const { error } = await backend.rewards.create(payload);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Reward added successfully' });
        resetForm();
        fetchRewards();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    const { error } = await backend.rewards.delete(id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Reward deleted successfully' });
      fetchRewards();
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      reward_type: reward.reward_type,
      reward_name: reward.reward_name,
      reward_config: reward.reward_config || {},
    });
  };

  const resetForm = () => {
    setEditingReward(null);
    setFormData({
      reward_type: 'points',
      reward_name: '',
      reward_config: {},
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Campaign Rewards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reward-name">Reward Name *</Label>
              <Input
                id="reward-name"
                value={formData.reward_name}
                onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
                required
                placeholder="e.g., Premium Member Role"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward-type">Reward Type *</Label>
              <Select
                value={formData.reward_type}
                onValueChange={(value) => setFormData({ ...formData, reward_type: value, reward_config: {} })}
              >
                <SelectTrigger id="reward-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="discord_role">Discord Role</SelectItem>
                  <SelectItem value="nft">NFT</SelectItem>
                  <SelectItem value="token">Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.reward_type === 'discord_role' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Discord Server ID *</Label>
                <Input
                  value={formData.reward_config.server_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    reward_config: { ...formData.reward_config, server_id: e.target.value }
                  })}
                  placeholder="123456789012345678"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Discord Role ID *</Label>
                <Input
                  value={formData.reward_config.role_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    reward_config: { ...formData.reward_config, role_id: e.target.value }
                  })}
                  placeholder="987654321098765432"
                  required
                />
              </div>
            </div>
          )}

          {formData.reward_type === 'nft' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Chain *</Label>
                <Select
                  value={formData.reward_config.chain || ''}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    reward_config: { ...formData.reward_config, chain: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select chain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="bsc">BSC</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>NFT Contract Address *</Label>
                <Input
                  value={formData.reward_config.contract_address || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    reward_config: { ...formData.reward_config, contract_address: e.target.value }
                  })}
                  placeholder="0x..."
                  required
                />
              </div>
            </div>
          )}

          {formData.reward_type === 'token' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Token Symbol *</Label>
                <Input
                  value={formData.reward_config.token_symbol || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    reward_config: { ...formData.reward_config, token_symbol: e.target.value }
                  })}
                  placeholder="USDC"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  value={formData.reward_config.amount || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    reward_config: { ...formData.reward_config, amount: e.target.value }
                  })}
                  placeholder="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Chain *</Label>
                <Select
                  value={formData.reward_config.chain || ''}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    reward_config: { ...formData.reward_config, chain: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select chain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="bsc">BSC</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formData.reward_type === 'points' && (
            <div className="space-y-2">
              <Label>Points Amount *</Label>
              <Input
                type="number"
                value={formData.reward_config.points || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  reward_config: { ...formData.reward_config, points: e.target.value }
                })}
                placeholder="100"
                required
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm">
              {editingReward ? 'Update Reward' : 'Add Reward'}
            </Button>
            {editingReward && (
              <Button type="button" size="sm" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="flex items-start gap-2 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
            >
              <Gift className="w-4 h-4 text-primary mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold">{reward.reward_name}</h4>
                  <span className="text-xs font-semibold text-primary flex-shrink-0 capitalize">
                    {reward.reward_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {reward.reward_type === 'discord_role' && (
                    <p>Server: {reward.reward_config.server_id}, Role: {reward.reward_config.role_id}</p>
                  )}
                  {reward.reward_type === 'nft' && (
                    <p>{reward.reward_config.chain}: {reward.reward_config.contract_address}</p>
                  )}
                  {reward.reward_type === 'token' && (
                    <p>{reward.reward_config.amount} {reward.reward_config.token_symbol} on {reward.reward_config.chain}</p>
                  )}
                  {reward.reward_type === 'points' && (
                    <p>{reward.reward_config.points} points</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(reward)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(reward.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}