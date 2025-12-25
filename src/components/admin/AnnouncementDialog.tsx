import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { backend } from '@/services';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  announcement_type: z.enum(['warning', 'update', 'news', 'learn']),
  is_active: z.boolean(),
  display_on_all_pages: z.boolean(),
  display_on_pages: z.array(z.string()).optional(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AnnouncementFormData) => Promise<void>;
  initialData?: Partial<AnnouncementFormData> & { id?: string };
  isLoading?: boolean;
}

const PAGE_OPTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'dapps', label: 'DApps Directory' },
  { id: 'dapp-detail', label: 'DApp Detail' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'campaign-detail', label: 'Campaign Detail' },
  { id: 'learn', label: 'Learn' },
  { id: 'news', label: 'News' },
  { id: 'profile', label: 'Profile' },
];

export function AnnouncementDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: AnnouncementDialogProps) {
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [availableDapps, setAvailableDapps] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDappIds, setSelectedDappIds] = useState<string[]>([]);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      message: '',
      announcement_type: 'warning',
      is_active: true,
      display_on_all_pages: true,
      display_on_pages: [],
    },
  });

  const displayOnAllPages = form.watch('display_on_all_pages');

  useEffect(() => {
    const fetchDapps = async () => {
      const { data, error } = await backend.dapps.getAll({ orderBy: 'name', ascending: true });
      
      if (!error && data) {
        setAvailableDapps(data.map(d => ({ id: d.id, name: d.name })));
      }
    };
    
    if (open) {
      fetchDapps();
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || '',
        message: initialData.message || '',
        announcement_type: initialData.announcement_type || 'warning',
        is_active: initialData.is_active ?? true,
        display_on_all_pages: initialData.display_on_all_pages ?? true,
        display_on_pages: initialData.display_on_pages || [],
      });
      
      const pages = initialData.display_on_pages || [];
      const basePages = pages.filter(p => !p.startsWith('dapp-detail:'));
      const dappPages = pages.filter(p => p.startsWith('dapp-detail:')).map(p => p.replace('dapp-detail:', ''));
      
      setSelectedPages(basePages);
      setSelectedDappIds(dappPages);
    } else {
      form.reset({
        title: '',
        message: '',
        announcement_type: 'warning',
        is_active: true,
        display_on_all_pages: true,
        display_on_pages: [],
      });
      setSelectedPages([]);
      setSelectedDappIds([]);
    }
  }, [initialData, form, open]);

  const handleSubmit = async (data: AnnouncementFormData) => {
    
    let finalPages = [...selectedPages];
    
    if (selectedPages.includes('dapp-detail') && selectedDappIds.length > 0) {
      
      finalPages = finalPages.filter(p => p !== 'dapp-detail');
      finalPages = [...finalPages, ...selectedDappIds.map(id => `dapp-detail:${id}`)];
    }
    
    const submissionData = {
      ...data,
      display_on_pages: displayOnAllPages ? null : finalPages,
    };
    await onSubmit(submissionData as AnnouncementFormData);
    form.reset();
    setSelectedPages([]);
    setSelectedDappIds([]);
  };

  const handlePageToggle = (pageId: string) => {
    setSelectedPages((prev) => {
      const newPages = prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId];
      
      if (pageId === 'dapp-detail' && !newPages.includes('dapp-detail')) {
        setSelectedDappIds([]);
      }
      
      return newPages;
    });
  };

  const handleDappToggle = (dappId: string) => {
    setSelectedDappIds((prev) =>
      prev.includes(dappId)
        ? prev.filter((id) => id !== dappId)
        : [...prev, dappId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? 'Edit Announcement' : 'Create Announcement'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter announcement message"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="announcement_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="learn">Learn</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Display this announcement to users
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="display_on_all_pages"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Display on All Pages</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Show this announcement on every page
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!displayOnAllPages && (
              <div className="space-y-3 rounded-lg border p-4">
                <FormLabel>Select Pages to Display</FormLabel>
                <div className="text-sm text-muted-foreground mb-2">
                  Choose which pages should show this announcement
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {PAGE_OPTIONS.map((page) => (
                    <div key={page.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={page.id}
                        checked={selectedPages.includes(page.id)}
                        onCheckedChange={() => handlePageToggle(page.id)}
                      />
                      <label
                        htmlFor={page.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {page.label}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedPages.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Selected: {selectedPages.length} page(s)
                  </div>
                )}
                
                {}
                {selectedPages.includes('dapp-detail') && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <FormLabel>Select Specific DApps (Optional)</FormLabel>
                    <div className="text-sm text-muted-foreground mb-2">
                      Choose specific DApp detail pages, or leave empty to show on all DApp detail pages
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto">
                      {availableDapps.map((dapp) => (
                        <div key={dapp.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dapp-${dapp.id}`}
                            checked={selectedDappIds.includes(dapp.id)}
                            onCheckedChange={() => handleDappToggle(dapp.id)}
                          />
                          <label
                            htmlFor={`dapp-${dapp.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {dapp.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedDappIds.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Selected: {selectedDappIds.length} DApp(s)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : initialData?.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
