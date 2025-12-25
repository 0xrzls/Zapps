import { useState } from 'react';
import { Flag, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { backend } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dappId: string;
  dappName: string;
}

export const ReportDialog = ({ isOpen, onClose, dappId, dappName }: ReportDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const REPORT_REASONS = [
    t('report.reasons.scam'),
    t('report.reasons.malware'),
    t('report.reasons.misleading'),
    t('report.reasons.copyright'),
    t('report.reasons.bug'),
    t('report.reasons.inappropriate'),
    t('report.reasons.other')
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setScreenshot(file);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Missing Information",
        description: "Please select a reason for reporting",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a detailed message",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let screenshotUrl = null;

      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${dappId}-${Date.now()}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { data: uploadUrl, error: uploadError } = await backend.storage.upload('dapp-reports', filePath, screenshot);

        if (uploadError) throw uploadError;
        screenshotUrl = uploadUrl;
      }

      const { error: insertError } = await backend.reports.create({
        dapp_id: dappId,
        user_id: user?.id,
        reason,
        message,
        screenshot_url: screenshotUrl,
        status: 'pending'
      });

      if (insertError) throw insertError;

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep the community safe. We'll review your report.",
      });

      setReason('');
      setMessage('');
      setScreenshot(null);
      onClose();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason('');
    setMessage('');
    setScreenshot(null);
    onClose();
  };

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reason">{t('report.reason')} *</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger id="reason">
            <SelectValue placeholder={t('report.reason')} />
          </SelectTrigger>
          <SelectContent>
            {REPORT_REASONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{t('report.message')} *</Label>
        <Textarea
          id="message"
          placeholder={t('report.message')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {message.length}/1000
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="screenshot">{t('report.screenshot')}</Label>
        {!screenshot ? (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="screenshot" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('report.screenshot')}
              </p>
            </label>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <div className="flex-1 truncate text-sm">
              {screenshot.name}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRemoveScreenshot}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const footer = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={isSubmitting}
        className="flex-1"
      >
        {t('common.cancel')}
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="flex-1"
      >
        {isSubmitting ? t('common.loading') : t('report.submit')}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('report.title')} {dappName}</DrawerTitle>
          <DrawerDescription>
            {t('report.title')}
          </DrawerDescription>
        </DrawerHeader>
          <div className="p-4">
            {content}
          </div>
          <DrawerFooter>
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('report.title')} {dappName}</DialogTitle>
          <DialogDescription>
            {t('report.title')}
          </DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter>
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};