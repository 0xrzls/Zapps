import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backend } from '@/services';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AnnouncementDialog } from '@/components/admin/AnnouncementDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type?: string;
  is_active?: boolean;
  display_on_all_pages?: boolean;
  display_on_pages?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export default function Announcements() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements-admin'],
    queryFn: async () => {
      const { data, error } = await backend.announcements.getAll({ orderBy: 'created_at', ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await backend.announcements.create(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcement'] });
      toast.success('Announcement created successfully');
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create announcement: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Announcement>;
    }) => {
      const { error } = await backend.announcements.update(id, data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcement'] });
      toast.success('Announcement updated successfully');
      setDialogOpen(false);
      setSelectedAnnouncement(null);
    },
    onError: (error) => {
      toast.error('Failed to update announcement: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await backend.announcements.delete(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcement'] });
      toast.success('Announcement deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
    },
    onError: (error) => {
      toast.error('Failed to delete announcement: ' + error.message);
    },
  });

  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDialogOpen(true);
  };

  const handleDelete = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (selectedAnnouncement) {
      await updateMutation.mutateAsync({ id: selectedAnnouncement.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'destructive';
      case 'update':
        return 'default';
      case 'news':
        return 'secondary';
      case 'learn':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
            <p className="text-muted-foreground">Manage running text announcements</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Display</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : announcements?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No announcements found
                  </TableCell>
                </TableRow>
              ) : (
                announcements?.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {announcement.message}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(announcement.announcement_type)}>
                        {announcement.announcement_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                        {announcement.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {announcement.display_on_all_pages ? (
                        <span className="text-sm">All pages</span>
                      ) : (
                        <span className="text-sm">
                          {announcement.display_on_pages?.length || 0} pages
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(announcement)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AnnouncementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={selectedAnnouncement as any}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the announcement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedAnnouncement && deleteMutation.mutate(selectedAnnouncement.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
