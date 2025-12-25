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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';
import { z } from 'zod';
import { ImageInput } from '@/components/admin/ImageInput';

const dappSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().min(1, "Description is required").max(500),
  long_description: z.string().trim().optional().or(z.literal('')),
  category: z.enum(['defi', 'nft', 'gaming', 'social', 'dao', 'infrastructure', 'other']),
  logo_url: z.string().url().optional().or(z.literal('')),
  cover_image: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  contract_address: z.string().trim().max(100).optional().or(z.literal('')),
  twitter: z.string().trim().optional().or(z.literal('')),
  discord: z.string().trim().optional().or(z.literal('')),
  github: z.string().trim().optional().or(z.literal('')),
  tvl: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.number().min(0)).optional(),
  users_count: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.number().int().min(0)).optional(),
  rating: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.number().min(0).max(5)).optional(),
  badge: z.enum(['Hot', 'Featured', 'Latest', 'Upcoming', '']).optional(),
});

interface DAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dapp: any | null;
}

export function DAppDialog({ open, onOpenChange, dapp }: DAppDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    long_description: '',
    category: 'defi',
    logo_url: '',
    cover_image: '',
    website_url: '',
    contract_address: '',
    twitter: '',
    discord: '',
    github: '',
    tvl: '',
    users_count: '',
    screenshots: '',
    features: '',
    tags: '',
    rating: '',
    badge: '',
    is_featured: false,
  });

  const [desktopScreenshots, setDesktopScreenshots] = useState<string[]>(['', '', '']);
  const [mobileScreenshots, setMobileScreenshots] = useState<string[]>(['', '', '']);

  useEffect(() => {
    if (dapp) {
      const desktopUrls = dapp.desktop_screenshots ? 
        (Array.isArray(dapp.desktop_screenshots) ? 
          dapp.desktop_screenshots.map((s: any) => typeof s === 'string' ? s : s.url) : 
          []) : [];
      
      const mobileUrls = dapp.mobile_screenshots ? 
        (Array.isArray(dapp.mobile_screenshots) ? 
          dapp.mobile_screenshots.map((s: any) => typeof s === 'string' ? s : s.url) : 
          []) : [];

      setDesktopScreenshots(desktopUrls.length >= 3 ? desktopUrls : [...desktopUrls, '', '', ''].slice(0, 3));
      setMobileScreenshots(mobileUrls.length >= 3 ? mobileUrls : [...mobileUrls, '', '', ''].slice(0, 3));

      setFormData({
        name: dapp.name || '',
        description: dapp.description || '',
        long_description: dapp.long_description || '',
        category: dapp.category || 'defi',
        logo_url: dapp.logo_url || '',
        cover_image: dapp.cover_image || '',
        website_url: dapp.website_url || '',
        contract_address: dapp.contract_address || '',
        twitter: dapp.twitter || '',
        discord: dapp.discord || '',
        github: dapp.github || '',
        tvl: dapp.tvl?.toString() || '',
        users_count: dapp.users_count?.toString() || '0',
        screenshots: dapp.screenshots?.join(', ') || '',
        features: dapp.features?.join(', ') || '',
        tags: dapp.tags?.join(', ') || '',
        rating: dapp.rating?.toString() || '',
        badge: dapp.badge || '',
        is_featured: dapp.is_featured || false,
      });
    } else {
      setDesktopScreenshots(['', '', '']);
      setMobileScreenshots(['', '', '']);
      setFormData({
        name: '',
        description: '',
        long_description: '',
        category: 'defi',
        logo_url: '',
        cover_image: '',
        website_url: '',
        contract_address: '',
        twitter: '',
        discord: '',
        github: '',
        tvl: '',
        users_count: '0',
        screenshots: '',
        features: '',
        tags: '',
        rating: '',
        badge: '',
        is_featured: false,
      });
    }
  }, [dapp, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = dappSchema.parse({
        ...formData,
        tvl: formData.tvl && formData.tvl.trim() !== '' ? parseFloat(formData.tvl) : undefined,
        users_count: formData.users_count && formData.users_count.trim() !== '' ? parseInt(formData.users_count) : 0,
        rating: formData.rating && formData.rating.trim() !== '' ? parseFloat(formData.rating) : undefined,
        logo_url: formData.logo_url || undefined,
        cover_image: formData.cover_image || undefined,
        website_url: formData.website_url || undefined,
        contract_address: formData.contract_address || undefined,
        twitter: formData.twitter || undefined,
        discord: formData.discord || undefined,
        github: formData.github || undefined,
        long_description: formData.long_description || undefined,
      });

      setLoading(true);

      const screenshots = formData.screenshots
        ? formData.screenshots.split(',').map(s => s.trim()).filter(Boolean)
        : null;
      
      const desktopScreenshotsData = desktopScreenshots.filter(Boolean).map(url => ({ url }));
      const mobileScreenshotsData = mobileScreenshots.filter(Boolean).map(url => ({ url }));
      
      const features = formData.features
        ? formData.features.split(',').map(s => s.trim()).filter(Boolean)
        : null;

      const tags = formData.tags
        ? formData.tags.split(',').map(s => s.trim()).filter(Boolean)
        : null;

      const payload: any = {
        name: validated.name,
        description: validated.description,
        long_description: validated.long_description || null,
        category: validated.category,
        is_featured: formData.is_featured,
        logo_url: validated.logo_url || null,
        cover_image: validated.cover_image || null,
        website_url: validated.website_url || null,
        contract_address: validated.contract_address || null,
        twitter: validated.twitter || null,
        discord: validated.discord || null,
        github: validated.github || null,
        tvl: validated.tvl || null,
        users_count: validated.users_count || 0,
        rating: validated.rating || null,
        badge: validated.badge || null,
        screenshots,
        desktop_screenshots: desktopScreenshotsData,
        mobile_screenshots: mobileScreenshotsData,
        features,
        tags,
      };

      if (dapp) {
        const { error } = await backend.dapps.update(dapp.id, payload);

        if (error) throw error;
        toast({ title: 'DApp berhasil diupdate' });
      } else {
        const { error } = await backend.dapps.create(payload);

        if (error) throw error;
        toast({ title: 'DApp berhasil ditambahkan' });
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
          <DialogTitle>{dapp ? 'Edit DApp' : 'Tambah DApp Baru'}</DialogTitle>
          <DialogDescription>
            {dapp ? 'Update informasi DApp' : 'Tambahkan DApp baru ke platform'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defi">DeFi</SelectItem>
                  <SelectItem value="nft">NFT</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="dao">DAO</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="long_description">Long Description (About)</Label>
            <Textarea
              id="long_description"
              value={formData.long_description}
              onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
              rows={4}
            />
          </div>

          <ImageInput
            label="Logo DApp"
            value={formData.logo_url}
            onChange={(url) => setFormData({ ...formData, logo_url: url })}
            id="dapp-logo"
            helperText="Rekomendasi: 200x200px (1:1), PNG dengan background transparan"
          />

          <ImageInput
            label="Cover Image"
            value={formData.cover_image}
            onChange={(url) => setFormData({ ...formData, cover_image: url })}
            id="dapp-cover"
            helperText="Rekomendasi: 1200x400px (3:1), format JPG/PNG"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_address">Contract Address</Label>
              <Input
                id="contract_address"
                value={formData.contract_address}
                onChange={(e) => setFormData({ ...formData, contract_address: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter (@handle)</Label>
              <Input
                id="twitter"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="@username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discord">Discord (ID)</Label>
              <Input
                id="discord"
                value={formData.discord}
                onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                placeholder="invite-code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github">GitHub (repo)</Label>
              <Input
                id="github"
                value={formData.github}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                placeholder="username/repo"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Desktop Screenshots</Label>
                <p className="text-xs text-muted-foreground">Rekomendasi: 1920x1080px (16:9), format JPG/PNG</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDesktopScreenshots([...desktopScreenshots, ''])}
                disabled={desktopScreenshots.length >= 7}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-3">
              {desktopScreenshots.map((url, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <ImageInput
                      label={`Screenshot ${index + 1}`}
                      value={url}
                      onChange={(newUrl) => {
                        const newScreenshots = [...desktopScreenshots];
                        newScreenshots[index] = newUrl;
                        setDesktopScreenshots(newScreenshots);
                      }}
                      id={`desktop-screenshot-${index}`}
                    />
                  </div>
                  {desktopScreenshots.length > 3 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-8"
                      onClick={() => {
                        const newScreenshots = desktopScreenshots.filter((_, i) => i !== index);
                        setDesktopScreenshots(newScreenshots);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Mobile Screenshots</Label>
                <p className="text-xs text-muted-foreground">Rekomendasi: 750x1334px (9:16), format JPG/PNG</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMobileScreenshots([...mobileScreenshots, ''])}
                disabled={mobileScreenshots.length >= 7}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-3">
              {mobileScreenshots.map((url, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <ImageInput
                      label={`Screenshot ${index + 1}`}
                      value={url}
                      onChange={(newUrl) => {
                        const newScreenshots = [...mobileScreenshots];
                        newScreenshots[index] = newUrl;
                        setMobileScreenshots(newScreenshots);
                      }}
                      id={`mobile-screenshot-${index}`}
                    />
                  </div>
                  {mobileScreenshots.length > 3 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-8"
                      onClick={() => {
                        const newScreenshots = mobileScreenshots.filter((_, i) => i !== index);
                        setMobileScreenshots(newScreenshots);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Features (comma-separated)</Label>
            <Textarea
              id="features"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              rows={2}
              placeholder="Feature 1, Feature 2, Feature 3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Textarea
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              rows={2}
              placeholder="DEX, AMM, DeFi"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tvl">TVL ($)</Label>
              <Input
                id="tvl"
                type="number"
                step="0.01"
                value={formData.tvl}
                onChange={(e) => setFormData({ ...formData, tvl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="users_count">Users Count</Label>
              <Input
                id="users_count"
                type="number"
                value={formData.users_count}
                onChange={(e) => setFormData({ ...formData, users_count: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="badge">Badge</Label>
              <Select
                value={formData.badge || "none"}
                onValueChange={(value) => setFormData({ ...formData, badge: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select badge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Featured">Featured</SelectItem>
                  <SelectItem value="Latest">Latest</SelectItem>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label htmlFor="is_featured">Featured DApp</Label>
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
              {dapp ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}