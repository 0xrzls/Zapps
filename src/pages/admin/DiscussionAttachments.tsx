import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileIcon, Check, X, Download, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { DiscussionAttachment } from '@/services/types';

export default function DiscussionAttachments() {
  const [attachments, setAttachments] = useState<DiscussionAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; attachmentId: string | null }>({
    open: false,
    attachmentId: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchAttachments();

    const subscription = backend.realtime.subscribe(
      'discussion_attachments',
      '*',
      () => {
        fetchAttachments();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAttachments = async () => {
    try {
      const { data, error } = await backend.attachments.getAll({ orderBy: 'created_at', ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch attachments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await backend.attachments.update(id, {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success('Attachment approved');
    } catch (error: any) {
      toast.error('Failed to approve: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.attachmentId) return;
    
    setProcessingId(rejectDialog.attachmentId);
    try {
      const { error } = await backend.attachments.update(rejectDialog.attachmentId, {
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      });

      if (error) throw error;
      toast.success('Attachment rejected');
      setRejectDialog({ open: false, attachmentId: null });
      setRejectionReason('');
    } catch (error: any) {
      toast.error('Failed to reject: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
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
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Discussion Attachments
          </h2>
          <p className="text-muted-foreground mt-2">
            Review and manage file attachments from discussions
          </p>
        </div>

        <div className="grid gap-4">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-muted rounded-lg">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{attachment.file_name}</h3>
                      {getStatusBadge(attachment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {attachment.file_type} • {formatFileSize(attachment.file_size)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploaded: {new Date(attachment.created_at).toLocaleString()}
                    </p>
                    {attachment.rejection_reason && (
                      <p className="text-sm text-red-500 mt-2">
                        Rejection reason: {attachment.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(attachment.file_url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {attachment.status === 'pending' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(attachment.id)}
                        disabled={processingId === attachment.id}
                      >
                        {processingId === attachment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRejectDialog({ open: true, attachmentId: attachment.id })}
                        disabled={processingId === attachment.id}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {attachments.length === 0 && (
            <Card className="p-12 text-center">
              <FileIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No attachments found</h3>
              <p className="text-muted-foreground">
                File attachments from discussions will appear here
              </p>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, attachmentId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Attachment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Rejection Reason
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this attachment..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, attachmentId: null });
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processingId !== null}
            >
              {processingId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
