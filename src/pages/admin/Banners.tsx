import { useState, useEffect } from 'react';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/AdminLayout';
import { BannerDialog } from '@/components/admin/BannerDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Banner } from '@/services/types';

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    
    const types = ['hero', 'dapps', 'campaigns'];
    const allBanners: Banner[] = [];
    
    for (const type of types) {
      const { data, error } = await backend.banners.getByType(type);
      if (!error && data) {
        allBanners.push(...data);
      }
    }
    
    allBanners.sort((a, b) => {
      if (a.banner_type !== b.banner_type) {
        return a.banner_type.localeCompare(b.banner_type);
      }
      return a.display_order - b.display_order;
    });
    
    setBanners(allBanners);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    const { error } = await backend.banners.delete(id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete banner',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Banner deleted successfully',
    });
    fetchBanners();
  };

  const handleToggleActive = async (banner: Banner) => {
    const { error } = await backend.banners.update(banner.id, { is_active: !banner.is_active });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update banner status',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Banner status updated',
    });
    fetchBanners();
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    fetchBanners();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Banner Management</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Banner
          </Button>
        </div>

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{banner.title}</div>
                      {banner.subtitle && (
                        <div className="text-sm text-muted-foreground">
                          {banner.subtitle}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{banner.banner_type}</Badge>
                  </TableCell>
                  <TableCell>{banner.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(banner)}
                      >
                        {banner.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(banner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <BannerDialog
          open={isDialogOpen}
          onClose={handleDialogClose}
          banner={editingBanner as any}
        />
      </div>
    </AdminLayout>
  );
}