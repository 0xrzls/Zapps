import { useEffect, useState } from 'react';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DAppDialog } from '@/components/admin/DAppDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface DApp {
  id: string;
  name: string;
  description: string;
  category: string;
  logo_url?: string | null;
  website_url?: string | null;
  contract_address?: string | null;
  tvl?: number | null;
  users_count?: number;
  is_featured?: boolean;
  rating?: number | null;
  badge?: string | null;
  tags?: string[] | null;
}

export default function DApps() {
  const [dapps, setDapps] = useState<DApp[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDapp, setEditingDapp] = useState<DApp | null>(null);
  const { toast } = useToast();

  const fetchDapps = async () => {
    const { data, error } = await backend.dapps.getAll({ orderBy: 'created_at', ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setDapps(data || []);
    }
  };

  useEffect(() => {
    fetchDapps();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus DApp ini?')) return;

    const { error } = await backend.dapps.delete(id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'DApp berhasil dihapus' });
      fetchDapps();
    }
  };

  const handleEdit = (dapp: DApp) => {
    setEditingDapp(dapp);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingDapp(null);
    fetchDapps();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">DApps Management</h2>
          <p className="text-muted-foreground">Kelola semua DApps di platform</p>
          <p className="text-xs text-muted-foreground mt-2">
            FHE votes auto-initialize on first vote per dApp
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah DApp
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>TVL</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dapps.map((dapp) => (
              <TableRow key={dapp.id}>
                <TableCell className="font-medium">{dapp.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{dapp.category}</Badge>
                </TableCell>
                <TableCell>
                  {dapp.rating ? `⭐ ${dapp.rating}` : '-'}
                </TableCell>
                <TableCell>
                  {dapp.tvl ? `$${dapp.tvl.toLocaleString()}` : '-'}
                </TableCell>
                <TableCell>{(dapp.users_count || 0).toLocaleString()}</TableCell>
                <TableCell>
                  {dapp.badge && <Badge>{dapp.badge}</Badge>}
                  {dapp.is_featured && <Badge variant="outline">Featured</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(dapp)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(dapp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DAppDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        dapp={editingDapp}
      />
    </div>
  );
}
