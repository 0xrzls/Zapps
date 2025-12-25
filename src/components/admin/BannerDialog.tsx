import { useState, useEffect } from 'react';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ImageInput } from './ImageInput';
import { Switch } from '@/components/ui/switch';

interface BannerDialogProps {
  open: boolean;
  onClose: () => void;
  banner?: {
    id: string;
    title: string;
    subtitle: string | null;
    cta_text: string | null;
    cta_link: string | null;
    cta_text_2: string | null;
    cta_link_2: string | null;
    image_url: string;
    banner_type: string;
    display_order: number;
    is_active: boolean;
  } | null;
}

export function BannerDialog({ open, onClose, banner }: BannerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    cta_text: '',
    cta_link: '',
    cta_text_2: '',
    cta_link_2: '',
    image_url: '',
    banner_type: 'home',
    display_order: 1,
    is_active: true,
  });

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        cta_text: banner.cta_text || '',
        cta_link: banner.cta_link || '',
        cta_text_2: banner.cta_text_2 || '',
        cta_link_2: banner.cta_link_2 || '',
        image_url: banner.image_url,
        banner_type: banner.banner_type,
        display_order: banner.display_order,
        is_active: banner.is_active,
      });
    } else {
      setFormData({
        title: '',
        subtitle: '',
        cta_text: '',
        cta_link: '',
        cta_text_2: '',
        cta_link_2: '',
        image_url: '',
        banner_type: 'home',
        display_order: 1,
        is_active: true,
      });
    }
  }, [banner, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (banner) {
        const { error } = await backend.banners.update(banner.id, formData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Banner updated successfully',
        });
      } else {
        const { error } = await backend.banners.create(formData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Banner created successfully',
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save banner',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="banner_type">Banner Type</Label>
            <Select
              value={formData.banner_type}
              onValueChange={(value) =>
                setFormData({ ...formData, banner_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home Page</SelectItem>
                <SelectItem value="dapps">DApps Page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) =>
                setFormData({ ...formData, subtitle: e.target.value })
              }
              rows={2}
            />
          </div>

          <ImageInput
            label="Banner Image *"
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
            id="image_url"
            helperText="Recommended size: 1920x600px"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cta_text">Primary Button Text</Label>
              <Input
                id="cta_text"
                value={formData.cta_text}
                onChange={(e) =>
                  setFormData({ ...formData, cta_text: e.target.value })
                }
                placeholder="e.g., Learn More"
              />
            </div>

            <div>
              <Label htmlFor="cta_link">Primary Button Link</Label>
              <Input
                id="cta_link"
                value={formData.cta_link}
                onChange={(e) =>
                  setFormData({ ...formData, cta_link: e.target.value })
                }
                placeholder="/campaigns or https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="cta_text_2">Secondary Button Text</Label>
              <Input
                id="cta_text_2"
                value={formData.cta_text_2}
                onChange={(e) =>
                  setFormData({ ...formData, cta_text_2: e.target.value })
                }
                placeholder="e.g., View Demo"
              />
            </div>

            <div>
              <Label htmlFor="cta_link_2">Secondary Button Link</Label>
              <Input
                id="cta_link_2"
                value={formData.cta_link_2}
                onChange={(e) =>
                  setFormData({ ...formData, cta_link_2: e.target.value })
                }
                placeholder="/demo or https://example.com"
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Use internal paths (/campaigns) or external URLs (https:
          </p>

          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  display_order: parseInt(e.target.value) || 1,
                })
              }
              min={1}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : banner ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
