import { useState, useEffect } from 'react';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  link: string | null;
  quest_order: number;
  quest_type: string;
  verification_method: string;
  verification_config: any;
}

interface QuestsManagerProps {
  campaignId: string;
}

export function QuestsManager({ campaignId }: QuestsManagerProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    points: string;
    link: string;
    quest_type: string;
    verification_method: string;
    verification_config: Record<string, any>;
    guide?: string;
  }>({
    title: '',
    description: '',
    points: '',
    link: '',
    quest_type: 'manual',
    verification_method: 'manual',
    verification_config: {},
    guide: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchQuests();
  }, [campaignId]);

  const fetchQuests = async () => {
    const { data, error } = await backend.quests.getByCampaign(campaignId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setQuests((data || []) as Quest[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const verificationConfig: any = {};
    
    if (formData.quest_type === 'twitter_follow' && formData.verification_config.twitter_username) {
      verificationConfig.twitter_username = formData.verification_config.twitter_username;
    } else if (formData.quest_type === 'twitter_tweet' && formData.verification_config.hashtags) {
      verificationConfig.hashtags = formData.verification_config.hashtags.split(',').map((h: string) => h.trim());
    } else if (formData.quest_type === 'twitter_retweet' && formData.verification_config.tweet_url) {
      verificationConfig.tweet_url = formData.verification_config.tweet_url;
    } else if (formData.quest_type === 'discord_join' && formData.verification_config.server_id) {
      verificationConfig.server_id = formData.verification_config.server_id;
    } else if (formData.quest_type === 'discord_role' && formData.verification_config.server_id && formData.verification_config.role_id) {
      verificationConfig.server_id = formData.verification_config.server_id;
      verificationConfig.role_id = formData.verification_config.role_id;
    } else if (formData.quest_type.startsWith('onchain_') && formData.verification_config.chain && formData.verification_config.contract_address) {
      verificationConfig.chain = formData.verification_config.chain;
      verificationConfig.contract_address = formData.verification_config.contract_address;
      if (formData.verification_config.min_amount) {
        verificationConfig.min_amount = formData.verification_config.min_amount;
      }
    }

    const payload = {
      campaign_id: campaignId,
      title: formData.title,
      description: formData.description,
      points: parseInt(formData.points) || 0,
      link: formData.link || null,
      quest_order: editingQuest ? editingQuest.quest_order : quests.length,
      quest_type: formData.quest_type as any,
      verification_method: formData.verification_method as any,
      verification_config: Object.keys(verificationConfig).length > 0 ? verificationConfig : null,
      guide: formData.guide || null,
    };

    if (editingQuest) {
      const { error } = await backend.quests.update(editingQuest.id, payload);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Quest updated successfully' });
        resetForm();
        fetchQuests();
      }
    } else {
      const { error } = await backend.quests.create(payload);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Quest added successfully' });
        resetForm();
        fetchQuests();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quest?')) return;

    const { error } = await backend.quests.delete(id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Quest deleted successfully' });
      fetchQuests();
    }
  };

  const handleEdit = (quest: Quest) => {
    setEditingQuest(quest);
    setFormData({
      title: quest.title,
      description: quest.description,
      points: quest.points.toString(),
      link: quest.link || '',
      quest_type: quest.quest_type || 'manual',
      verification_method: quest.verification_method || 'manual',
      verification_config: quest.verification_config || {},
      guide: (quest as any).guide || '',
    });
  };

  const resetForm = () => {
    setEditingQuest(null);
    setFormData({
      title: '',
      description: '',
      points: '',
      link: '',
      quest_type: 'manual',
      verification_method: 'manual',
      verification_config: {},
      guide: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Campaign Quests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quest-title">Quest Title *</Label>
              <Input
                id="quest-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quest-points">Points *</Label>
              <Input
                id="quest-points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quest-type">Quest Type *</Label>
              <Select
                value={formData.quest_type}
                onValueChange={(value) => setFormData({ ...formData, quest_type: value, verification_config: {} })}
              >
                <SelectTrigger id="quest-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Verification</SelectItem>
                  <SelectItem value="twitter_follow">Twitter Follow</SelectItem>
                  <SelectItem value="twitter_tweet">Twitter Tweet</SelectItem>
                  <SelectItem value="twitter_retweet">Twitter Retweet</SelectItem>
                  <SelectItem value="discord_join">Discord Join</SelectItem>
                  <SelectItem value="discord_role">Discord Role</SelectItem>
                  <SelectItem value="onchain_transaction">On-chain Transaction</SelectItem>
                  <SelectItem value="onchain_balance">On-chain Balance</SelectItem>
                  <SelectItem value="custom_link">Custom Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quest-description">Description *</Label>
            <Textarea
              id="quest-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quest-guide">Task Guide (Optional)</Label>
            <Textarea
              id="quest-guide"
              value={(formData as any).guide || ''}
              onChange={(e) => setFormData({ ...formData, guide: e.target.value } as any)}
              rows={3}
              placeholder="Step-by-step instructions for completing this task..."
            />
          </div>

          {}
          {formData.quest_type === 'twitter_follow' && (
            <div className="space-y-2">
              <Label>Twitter Username *</Label>
              <Input
                value={formData.verification_config.twitter_username || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  verification_config: { ...formData.verification_config, twitter_username: e.target.value }
                })}
                placeholder="@username"
                required
              />
            </div>
          )}

          {formData.quest_type === 'twitter_tweet' && (
            <div className="space-y-2">
              <Label>Required Hashtags (comma separated)</Label>
              <Input
                value={formData.verification_config.hashtags || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  verification_config: { ...formData.verification_config, hashtags: e.target.value }
                })}
                placeholder="#web3, #crypto"
              />
            </div>
          )}

          {formData.quest_type === 'twitter_retweet' && (
            <div className="space-y-2">
              <Label>Tweet URL *</Label>
              <Input
                value={formData.verification_config.tweet_url || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  verification_config: { ...formData.verification_config, tweet_url: e.target.value }
                })}
                placeholder="https://twitter.com/user/status/..."
                required
              />
            </div>
          )}

          {formData.quest_type === 'discord_join' && (
            <div className="space-y-2">
              <Label>Discord Server ID *</Label>
              <Input
                value={formData.verification_config.server_id || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  verification_config: { ...formData.verification_config, server_id: e.target.value }
                })}
                placeholder="123456789012345678"
                required
              />
            </div>
          )}

          {formData.quest_type === 'discord_role' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Discord Server ID *</Label>
                <Input
                  value={formData.verification_config.server_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    verification_config: { ...formData.verification_config, server_id: e.target.value }
                  })}
                  placeholder="123456789012345678"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Required Role ID *</Label>
                <Input
                  value={formData.verification_config.role_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    verification_config: { ...formData.verification_config, role_id: e.target.value }
                  })}
                  placeholder="987654321098765432"
                  required
                />
              </div>
            </div>
          )}

          {(formData.quest_type === 'onchain_transaction' || formData.quest_type === 'onchain_balance') && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Chain *</Label>
                <Select
                  value={formData.verification_config.chain || ''}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    verification_config: { ...formData.verification_config, chain: value }
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
                <Label>Contract Address *</Label>
                <Input
                  value={formData.verification_config.contract_address || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    verification_config: { ...formData.verification_config, contract_address: e.target.value }
                  })}
                  placeholder="0x..."
                  required
                />
              </div>
              {formData.quest_type === 'onchain_balance' && (
                <div className="space-y-2">
                  <Label>Min Amount</Label>
                  <Input
                    value={formData.verification_config.min_amount || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      verification_config: { ...formData.verification_config, min_amount: e.target.value }
                    })}
                    placeholder="0.1"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quest-link">External Link (Optional)</Label>
            <Input
              id="quest-link"
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://discord.gg/example or https://twitter.com/..."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm">
              {editingQuest ? 'Update Quest' : 'Add Quest'}
            </Button>
            {editingQuest && (
              <Button type="button" size="sm" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          {quests.map((quest, index) => (
            <div
              key={quest.id}
              className="flex items-start gap-2 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold">
                    {index + 1}. {quest.title}
                  </h4>
                  <span className="text-xs font-semibold text-primary flex-shrink-0">
                    +{quest.points} pts
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{quest.description}</p>
                {quest.link && (
                  <a
                    href={quest.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {quest.link}
                  </a>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(quest)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(quest.id)}
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
