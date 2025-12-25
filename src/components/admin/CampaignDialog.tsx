import { useState, useEffect } from 'react';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { ImageInput } from '@/components/admin/ImageInput';

const campaignSchema = z.object({
  dapp_id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(1000),
  category: z.string().trim().optional().or(z.literal('')),
  logo: z.string().url().optional().or(z.literal('')),
  cover_image: z.string().url().optional().or(z.literal('')),
  reward_amount: z.number().min(0).optional(),
  reward_token: z.string().trim().max(50).optional().or(z.literal('')),
  start_date: z.string(),
  end_date: z.string(),
  status: z.enum(['draft', 'active', 'upcoming', 'paused', 'ended']),
  max_participants: z.number().int().min(1).optional(),
});

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: any | null;
}

export function CampaignDialog({ open, onOpenChange, campaign }: CampaignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [dapps, setDapps] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    dapp_id: '',
    title: '',
    description: '',
    category: '',
    logo: '',
    cover_image: '',
    hosted_by: '',
    reward_amount: '',
    reward_token: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    max_participants: '',
  });

  useEffect(() => {
    async function fetchDapps() {
      const { data } = await backend.dapps.getAll({ orderBy: 'name', ascending: true });
      setDapps((data || []).map(d => ({ id: d.id, name: d.name })));
    }
    fetchDapps();
  }, []);

  useEffect(() => {
    if (campaign) {
      setFormData({
        dapp_id: campaign.dapp_id || '',
        title: campaign.title || '',
        description: campaign.description || '',
        category: campaign.category || '',
        logo: campaign.logo || '',
        cover_image: campaign.cover_image || '',
        hosted_by: campaign.hosted_by?.join(', ') || '',
        reward_amount: campaign.reward_amount?.toString() || '',
        reward_token: campaign.reward_token || '',
        start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().slice(0, 16) : '',
        end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().slice(0, 16) : '',
        status: campaign.status || 'draft',
        max_participants: campaign.max_participants?.toString() || '',
      });
    } else {
      setFormData({
        dapp_id: '',
        title: '',
        description: '',
        category: '',
        logo: '',
        cover_image: '',
        hosted_by: '',
        reward_amount: '',
        reward_token: '',
        start_date: '',
        end_date: '',
        status: 'draft',
        max_participants: '',
      });
    }
  }, [campaign, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = campaignSchema.parse({
        ...formData,
        dapp_id: formData.dapp_id || undefined,
        category: formData.category || undefined,
        logo: formData.logo || undefined,
        cover_image: formData.cover_image || undefined,
        reward_amount: formData.reward_amount ? parseFloat(formData.reward_amount) : undefined,
        reward_token: formData.reward_token || undefined,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
      });

      setLoading(true);

      const hosted_by = formData.hosted_by
        ? formData.hosted_by.split(',').map(s => s.trim()).filter(Boolean)
        : null;

      const payload: any = {
        title: validated.title,
        description: validated.description,
        category: validated.category || null,
        logo: validated.logo || null,
        cover_image: validated.cover_image || null,
        hosted_by,
        start_date: validated.start_date,
        end_date: validated.end_date,
        status: validated.status,
        dapp_id: validated.dapp_id || null,
        reward_amount: validated.reward_amount || null,
        reward_token: validated.reward_token || null,
        max_participants: validated.max_participants || null,
      };

      if (campaign) {
        const { error } = await backend.campaigns.update(campaign.id, payload);

        if (error) throw error;
        toast({ title: 'Campaign berhasil diupdate' });
      } else {
        const { error } = await backend.campaigns.create(payload);

        if (error) throw error;
        toast({ title: 'Campaign berhasil ditambahkan' });
      }

      onOpenChange(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: (err as Error).message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Tambah Campaign Baru'}</DialogTitle>
          <DialogDescription>
            {campaign ? 'Update informasi campaign' : 'Tambahkan campaign baru'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dapp_id">DApp (Optional)</Label>
            <Select
              value={formData.dapp_id}
              onValueChange={(value) => setFormData({ ...formData, dapp_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a DApp" />
              </SelectTrigger>
              <SelectContent>
                {dapps.map((dapp) => (
                  <SelectItem key={dapp.id} value={dapp.id}>
                    {dapp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="DeFi, NFT, Gaming, etc."
            />
          </div>

          <ImageInput
            label="Logo Campaign"
            value={formData.logo}
            onChange={(url) => setFormData({ ...formData, logo: url })}
            id="campaign-logo"
          />

          <ImageInput
            label="Cover Image"
            value={formData.cover_image}
            onChange={(url) => setFormData({ ...formData, cover_image: url })}
            id="campaign-cover"
          />

          <div className="space-y-2">
            <Label htmlFor="hosted_by">Hosted By (comma-separated logo URLs)</Label>
            <Textarea
              id="hosted_by"
              value={formData.hosted_by}
              onChange={(e) => setFormData({ ...formData, hosted_by: e.target.value })}
              rows={2}
              placeholder="https://example.com/logo1.png, https://example.com/logo2.png"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reward_amount">Reward Amount</Label>
              <Input
                id="reward_amount"
                type="number"
                step="0.01"
                value={formData.reward_amount}
                onChange={(e) => setFormData({ ...formData, reward_amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward_token">Reward Token</Label>
              <Input
                id="reward_token"
                value={formData.reward_token}
                onChange={(e) => setFormData({ ...formData, reward_token: e.target.value })}
                placeholder="e.g., USDC, ETH"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Hidden)</SelectItem>
                  <SelectItem value="active">Active (Published)</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Draft = hidden, Active = live now, Upcoming/Paused/Ended = manual control
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input
                id="max_participants"
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {campaign ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}