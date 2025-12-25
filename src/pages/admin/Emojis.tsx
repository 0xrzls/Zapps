import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Emoji {
  id: string;
  emoji_code: string;
  emoji_label: string;
  is_active: boolean;
  display_order: number;
}

export default function Emojis() {
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{ open: boolean; emoji: Emoji | null }>({
    open: false,
    emoji: null,
  });
  const [formData, setFormData] = useState({ emoji_code: '', emoji_label: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEmojis();
  }, []);

  const fetchEmojis = async () => {
    try {
      const { data, error } = await backend.emojis.getAll();

      if (error) throw error;
      
      const sorted = (data || []).sort((a, b) => a.display_order - b.display_order);
      setEmojis(sorted);
    } catch (error: any) {
      toast.error('Failed to fetch emojis: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.emoji_code || !formData.emoji_label) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      if (editDialog.emoji) {
        const { error } = await backend.emojis.update(editDialog.emoji.id, {
          emoji_code: formData.emoji_code,
          emoji_label: formData.emoji_label,
        });

        if (error) throw error;
        toast.success('Emoji updated');
      } else {
        const maxOrder = Math.max(...emojis.map(e => e.display_order), 0);
        const { error } = await backend.emojis.create({
          emoji_code: formData.emoji_code,
          emoji_label: formData.emoji_label,
          display_order: maxOrder + 1,
        });

        if (error) throw error;
        toast.success('Emoji added');
      }

      setEditDialog({ open: false, emoji: null });
      setFormData({ emoji_code: '', emoji_label: '' });
      fetchEmojis();
    } catch (error: any) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await backend.emojis.update(id, { is_active: !currentStatus });

      if (error) throw error;
      toast.success(`Emoji ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchEmojis();
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emoji?')) return;

    try {
      const { error } = await backend.emojis.delete(id);

      if (error) throw error;
      toast.success('Emoji deleted');
      fetchEmojis();
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const handleReorder = async (id: string, newOrder: number) => {
    try {
      const { error } = await backend.emojis.update(id, { display_order: newOrder });

      if (error) throw error;
      fetchEmojis();
    } catch (error: any) {
      toast.error('Failed to reorder: ' + error.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Emoji Settings
            </h2>
            <p className="text-muted-foreground mt-2">
              Manage reaction emojis for discussions
            </p>
          </div>
          <Button
            onClick={() => {
              setFormData({ emoji_code: '', emoji_label: '' });
              setEditDialog({ open: true, emoji: null });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Emoji
          </Button>
        </div>

        <div className="grid gap-4">
          {emojis.map((emoji, index) => (
            <Card key={emoji.id} className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                <div className="text-3xl">{emoji.emoji_code}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{emoji.emoji_label}</h3>
                  <p className="text-sm text-muted-foreground">Order: {emoji.display_order}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={emoji.is_active}
                    onCheckedChange={() => handleToggleActive(emoji.id, emoji.is_active)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {emoji.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {index > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(emoji.id, emoji.display_order - 1.5)}
                    >
                      ↑
                    </Button>
                  )}
                  {index < emojis.length - 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(emoji.id, emoji.display_order + 1.5)}
                    >
                      ↓
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        emoji_code: emoji.emoji_code,
                        emoji_label: emoji.emoji_label,
                      });
                      setEditDialog({ open: true, emoji });
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(emoji.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {emojis.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">😊</div>
              <h3 className="text-lg font-semibold mb-2">No emojis configured</h3>
              <p className="text-muted-foreground mb-4">
                Add emojis that users can use to react to discussions
              </p>
              <Button
                onClick={() => {
                  setFormData({ emoji_code: '', emoji_label: '' });
                  setEditDialog({ open: true, emoji: null });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Emoji
              </Button>
            </Card>
          )}
        </div>
      </div>

      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => {
          setEditDialog({ open, emoji: null });
          setFormData({ emoji_code: '', emoji_label: '' });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editDialog.emoji ? 'Edit Emoji' : 'Add Emoji'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Emoji Character
              </label>
              <Input
                value={formData.emoji_code}
                onChange={(e) => setFormData({ ...formData, emoji_code: e.target.value })}
                placeholder="👍"
                className="text-2xl"
                maxLength={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Label
              </label>
              <Input
                value={formData.emoji_label}
                onChange={(e) => setFormData({ ...formData, emoji_label: e.target.value })}
                placeholder="Thumbs Up"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialog({ open: false, emoji: null });
                setFormData({ emoji_code: '', emoji_label: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
