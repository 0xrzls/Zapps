import { useEffect, useState } from 'react';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageInput } from '@/components/admin/ImageInput';
import type { News } from '@/services/types';

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    image_url: '',
    source: 'internal',
    author: '',
    category: '',
    tags: '',
  });
  const { toast } = useToast();

  const fetchNews = async () => {
    const { data, error } = await backend.news.getAll({ orderBy: 'published_at', ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setNews(data || []);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus berita ini?')) return;

    const { error } = await backend.news.delete(id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Berita berhasil dihapus' });
      fetchNews();
    }
  };

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      summary: newsItem.summary || '',
      image_url: newsItem.image_url || '',
      source: newsItem.source,
      author: newsItem.author || '',
      category: newsItem.category || '',
      tags: newsItem.tags?.join(', ') || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newsData = {
      title: formData.title,
      content: formData.content,
      summary: formData.summary || null,
      image_url: formData.image_url || null,
      source: formData.source,
      author: formData.author || null,
      category: formData.category || null,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
      published_at: new Date().toISOString(),
    };

    if (editingNews) {
      const { error } = await backend.news.update(editingNews.id, newsData);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Berita berhasil diupdate' });
        handleDialogClose();
      }
    } else {
      const { error } = await backend.news.create(newsData);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Berita berhasil ditambahkan' });
        handleDialogClose();
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingNews(null);
    setFormData({
      title: '',
      content: '',
      summary: '',
      image_url: '',
      source: 'internal',
      author: '',
      category: '',
      tags: '',
    });
    fetchNews();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">News Management</h2>
          <p className="text-muted-foreground">Kelola semua berita di platform</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Berita
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Penulis</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {item.title}
                </TableCell>
                <TableCell>
                  {item.category && <Badge variant="outline">{item.category}</Badge>}
                </TableCell>
                <TableCell>{item.author || '-'}</TableCell>
                <TableCell>
                  {new Date(item.published_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge>{item.source}</Badge>
                </TableCell>
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNews ? 'Edit Berita' : 'Tambah Berita Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Judul *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="summary">Ringkasan</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="content">Konten *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                required
              />
            </div>
            <ImageInput
              label="Gambar Berita"
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              id="news-image"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author">Penulis</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="DeFi, NFT, Gaming, dll"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="web3, blockchain, crypto"
              />
            </div>
            <div>
              <Label htmlFor="source">Sumber</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Batal
              </Button>
              <Button type="submit">
                {editingNews ? 'Update' : 'Tambah'} Berita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}