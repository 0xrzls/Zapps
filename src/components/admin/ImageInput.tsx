import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { backend } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  id?: string;
  helperText?: string;
}

export function ImageInput({ label, value, onChange, id = 'image', helperText }: ImageInputProps) {
  const [mode, setMode] = useState<'link' | 'upload'>('link');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Ukuran file maksimal 5MB',
        variant: 'destructive',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Format file harus JPG, PNG, WEBP, atau GIF',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: publicUrl, error: uploadError } = await backend.storage.upload('admin-uploads', filePath, file);

      if (uploadError) throw uploadError;

      onChange(publicUrl || '');
      toast({ title: 'Gambar berhasil diupload' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {helperText && (
          <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
        )}
      </div>
      
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'link' | 'upload')}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="link" id={`${id}-link`} />
            <Label htmlFor={`${id}-link`} className="font-normal cursor-pointer">
              Link URL
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="upload" id={`${id}-upload`} />
            <Label htmlFor={`${id}-upload`} className="font-normal cursor-pointer">
              Upload File
            </Label>
          </div>
        </div>
      </RadioGroup>

      {mode === 'link' ? (
        <Input
          id={`${id}-url`}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      ) : (
        <div className="space-y-2">
          <Input
            id={`${id}-file`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengupload...
            </div>
          )}
          {value && !uploading && (
            <div className="text-sm text-muted-foreground">
              ✓ File uploaded: {value.split('/').pop()}
            </div>
          )}
        </div>
      )}

      {value && (
        <div className="mt-2">
          <img
            src={value}
            alt="Preview"
            className="h-24 w-24 object-cover rounded border border-border"
          />
        </div>
      )}
    </div>
  );
}
