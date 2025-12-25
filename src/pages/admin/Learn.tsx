import { useEffect, useState } from 'react';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LearnDialog } from '@/components/admin/LearnDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface LearnContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  author: string;
  difficulty?: string | null;
  read_time?: string | null;
  duration?: string | null;
  views?: number;
}

export default function Learn() {
  const [content, setContent] = useState<LearnContent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<LearnContent | null>(null);
  const { toast } = useToast();

  const fetchContent = async () => {
    const { data, error } = await backend.learn.getAll({ orderBy: 'created_at', ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setContent(data || []);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus konten ini?')) return;

    const { error } = await backend.learn.delete(id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Konten berhasil dihapus' });
      fetchContent();
    }
  };

  const handleEdit = (item: LearnContent) => {
    setEditingContent(item);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingContent(null);
    fetchContent();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide':
        return 'bg-blue-500/10 text-blue-500';
      case 'article':
        return 'bg-green-500/10 text-green-500';
      case 'video':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Learn Content Management</h2>
          <p className="text-muted-foreground">Kelola semua konten edukasi di platform</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Konten
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Views</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <Badge className={getTypeColor(item.content_type)}>
                    {item.content_type}
                  </Badge>
                </TableCell>
                <TableCell>{item.author}</TableCell>
                <TableCell>
                  {item.difficulty && <Badge variant="outline">{item.difficulty}</Badge>}
                </TableCell>
                <TableCell>{item.views || 0}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LearnDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        content={editingContent}
      />
    </div>
  );
}
