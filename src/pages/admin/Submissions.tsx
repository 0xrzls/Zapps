import { useEffect, useState } from 'react';
import { backend } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Eye, Check, X, Clock, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DAppSubmission } from '@/services/types';

export default function Submissions() {
  const [submissions, setSubmissions] = useState<DAppSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<DAppSubmission | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    const { data, error } = await backend.submissions.getAll({ orderBy: 'created_at', ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSubmissions(data || []);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleView = (submission: DAppSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || '');
    setIsDetailOpen(true);
  };

  const handleApprove = async (submission: DAppSubmission) => {
    setIsProcessing(true);
    try {
      
      if (submission.submission_type === 'new') {
        const { error: dappError } = await backend.dapps.create({
          name: submission.name,
          description: submission.description,
          long_description: submission.long_description,
          category: submission.category as any,
          logo_url: submission.logo_url,
          cover_image: submission.cover_image,
          website_url: submission.website_url,
          twitter: submission.twitter,
          discord: submission.discord,
          github: submission.github,
          contract_address: submission.contract_address,
          tags: submission.tags,
          features: submission.features,
        });

        if (dappError) throw dappError;
      }

      const { error: updateError } = await backend.submissions.update(submission.id, {
        status: 'approved',
        admin_notes: adminNotes,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      });

      if (updateError) throw updateError;

      toast({
        title: 'Submission Approved',
        description: 'The DApp has been added to the directory.',
      });

      setIsDetailOpen(false);
      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (submission: DAppSubmission) => {
    if (!adminNotes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await backend.submissions.update(submission.id, {
        status: 'rejected',
        admin_notes: adminNotes,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Submission Rejected',
        description: 'The submitter will be notified.',
      });

      setIsDetailOpen(false);
      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          <Check className="w-3 h-3 mr-1" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          <X className="w-3 h-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return null;
    }
  };

  const filteredSubmissions = submissions.filter(s => s.status === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">DApp Submissions</h2>
        <p className="text-muted-foreground">Review and manage DApp submissions from the community</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({submissions.filter(s => s.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({submissions.filter(s => s.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({submissions.filter(s => s.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="border border-border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DApp Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No {activeTab} submissions
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.name}</TableCell>
                      <TableCell>
                        <Badge variant={submission.submission_type === 'new' ? 'default' : 'secondary'}>
                          {submission.submission_type === 'new' ? 'New' : 'Update'}
                        </Badge>
                      </TableCell>
                      <TableCell>{submission.category}</TableCell>
                      <TableCell>{submission.submitter_name}</TableCell>
                      <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.name}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedSubmission?.submitter_name} on{' '}
              {selectedSubmission && new Date(selectedSubmission.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 pr-4">
              {}
              <div className="space-y-2">
                <h3 className="font-semibold">Submitter Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span> {selectedSubmission?.submitter_name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span> {selectedSubmission?.submitter_email}
                  </div>
                  {selectedSubmission?.submitter_wallet && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Wallet:</span>{' '}
                      <code className="text-xs">{selectedSubmission.submitter_wallet}</code>
                    </div>
                  )}
                </div>
              </div>

              {}
              <div className="space-y-2">
                <h3 className="font-semibold">DApp Information</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Category</Label>
                    <p className="text-sm">{selectedSubmission?.category}</p>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm">{selectedSubmission?.description}</p>
                  </div>
                  {selectedSubmission?.long_description && (
                    <div>
                      <Label>Detailed Description</Label>
                      <p className="text-sm">{selectedSubmission.long_description}</p>
                    </div>
                  )}
                  {selectedSubmission?.website_url && (
                    <div>
                      <Label>Website</Label>
                      <a href={selectedSubmission.website_url} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-primary hover:underline">
                        {selectedSubmission.website_url}
                      </a>
                    </div>
                  )}
                  {selectedSubmission?.tags && selectedSubmission.tags.length > 0 && (
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedSubmission.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {}
              <div className="space-y-2">
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this submission..."
                  rows={4}
                />
              </div>

              {}
              {selectedSubmission?.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleApprove(selectedSubmission)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve & Publish
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedSubmission)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}