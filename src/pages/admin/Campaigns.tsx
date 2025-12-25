import { useEffect, useState } from 'react';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, List, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CampaignDialog } from '@/components/admin/CampaignDialog';
import { QuestsManager } from '@/components/admin/QuestsManager';
import { RewardsManager } from '@/components/admin/RewardsManager';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Campaign {
  id: string;
  title: string;
  description: string;
  reward_amount?: number | null;
  reward_token?: string | null;
  start_date: string;
  end_date: string;
  status: string;
  participants_count?: number;
  max_participants?: number | null;
  dapp_id?: string | null;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [questsDialogOpen, setQuestsDialogOpen] = useState(false);
  const [rewardsDialogOpen, setRewardsDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    const { data, error } = await backend.campaigns.getAll({ orderBy: 'created_at', ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setCampaigns(data || []);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus campaign ini?')) return;

    const { error } = await backend.campaigns.delete(id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Campaign berhasil dihapus' });
      fetchCampaigns();
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsDialogOpen(true);
  };

  const handleManageQuests = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setQuestsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCampaign(null);
    fetchCampaigns();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Campaigns Management</h2>
          <p className="text-muted-foreground">Kelola semua campaigns</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Campaign
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Quests</TableHead>
              <TableHead>Rewards</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.title}</TableCell>
                <TableCell>
                  {campaign.reward_amount
                    ? `${campaign.reward_amount} ${campaign.reward_token || ''}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {new Date(campaign.start_date).toLocaleDateString()} -{' '}
                  {new Date(campaign.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {campaign.participants_count || 0}
                  {campaign.max_participants && ` / ${campaign.max_participants}`}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageQuests(campaign.id)}
                  >
                    <List className="h-4 w-4 mr-1" />
                    Quests
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCampaignId(campaign.id);
                      setRewardsDialogOpen(true);
                    }}
                  >
                    <Gift className="h-4 w-4 mr-1" />
                    Rewards
                  </Button>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(campaign)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CampaignDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        campaign={editingCampaign}
      />

      <Dialog open={questsDialogOpen} onOpenChange={setQuestsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Campaign Quests</DialogTitle>
          </DialogHeader>
          {selectedCampaignId && <QuestsManager campaignId={selectedCampaignId} />}
        </DialogContent>
      </Dialog>

      <Dialog open={rewardsDialogOpen} onOpenChange={setRewardsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Campaign Rewards</DialogTitle>
          </DialogHeader>
          {selectedCampaignId && <RewardsManager campaignId={selectedCampaignId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}