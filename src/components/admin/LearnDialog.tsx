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

const learnSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(500),
  content_type: z.enum(['guide', 'article', 'video']),
  author: z.string().trim().min(1, "Author is required").max(100),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  read_time: z.string().trim().optional().or(z.literal('')),
  duration: z.string().trim().optional().or(z.literal('')),
  content_url: z.string().url().optional().or(z.literal('')),
});

interface LearnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: any | null;
}

export function LearnDialog({ open, onOpenChange, content }: LearnDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'guide',
    author: '',
    thumbnail_url: '',
    difficulty: '',
    read_time: '',
    duration: '',
    content_url: '',
  });

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        description: content.description || '',
        content_type: content.content_type || 'guide',
        author: content.author || '',
        thumbnail_url: content.thumbnail_url || '',
        difficulty: content.difficulty || '',
        read_time: content.read_time || '',
        duration: content.duration || '',
        content_url: content.content_url || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        content_type: 'guide',
        author: '',
        thumbnail_url: '',
        difficulty: '',
        read_time: '',
        duration: '',
        content_url: '',
      });
    }
  }, [content, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = learnSchema.parse({
        ...formData,
        difficulty: formData.difficulty || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        read_time: formData.read_time || undefined,
        duration: formData.duration || undefined,
        content_url: formData.content_url || undefined,
      });

      setLoading(true);

      const payload: any = {
        title: validated.title,
        description: validated.description,
        content_type: validated.content_type,
        author: validated.author,
        thumbnail_url: validated.thumbnail_url || null,
        difficulty: validated.difficulty || null,
        read_time: validated.read_time || null,
        duration: validated.duration || null,
        content_url: validated.content_url || null,
      };

      if (content) {
        const { error } = await backend.learn.update(content.id, payload);

        if (error) throw error;
        toast({ title: 'Konten berhasil diupdate' });
      } else {
        const { error } = await backend.learn.create(payload);

        if (error) throw error;
        toast({ title: 'Konten berhasil ditambahkan' });
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
          <DialogTitle>{content ? 'Edit Konten' : 'Tambah Konten Baru'}</DialogTitle>
          <DialogDescription>
            {content ? 'Update informasi konten' : 'Tambahkan konten edukasi baru'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="content_type">Type *</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value) => setFormData({ ...formData, content_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty (for guides)</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ImageInput
            label="Thumbnail"
            value={formData.thumbnail_url}
            onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
            id="learn-thumbnail"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="read_time">Read Time (for guides/articles)</Label>
              <Input
                id="read_time"
                value={formData.read_time}
                onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                placeholder="e.g., 15 min read"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (for videos)</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 8:45"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_url">Content URL</Label>
            <Input
              id="content_url"
              type="url"
              value={formData.content_url}
              onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
              placeholder="Link to full content"
            />
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
              {content ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
