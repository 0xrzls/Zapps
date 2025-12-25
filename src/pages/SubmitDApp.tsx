import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Send, Loader2 } from 'lucide-react';
import { ImageInput } from '@/components/admin/ImageInput';

export default function SubmitDApp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [submissionType, setSubmissionType] = useState<'new' | 'update'>('new');
  const [formData, setFormData] = useState({
    submitter_name: '',
    submitter_email: '',
    submitter_wallet: address || '',
    name: '',
    description: '',
    long_description: '',
    category: 'DeFi',
    logo_url: '',
    cover_image: '',
    website_url: '',
    twitter: '',
    discord: '',
    github: '',
    contract_address: '',
    tags: '',
    features: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await backend.submissions.create({
        submission_type: submissionType,
        submitter_name: formData.submitter_name,
        submitter_email: formData.submitter_email,
        submitter_wallet: formData.submitter_wallet || address,
        name: formData.name,
        description: formData.description,
        long_description: formData.long_description,
        category: formData.category,
        logo_url: formData.logo_url,
        cover_image: formData.cover_image,
        website_url: formData.website_url,
        twitter: formData.twitter,
        discord: formData.discord,
        github: formData.github,
        contract_address: formData.contract_address,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        features: formData.features ? formData.features.split(',').map(f => f.trim()) : [],
      });

      if (error) throw error;

      toast({
        title: 'Submission Successful!',
        description: 'Your DApp has been submitted for review. We\'ll notify you once it\'s approved.',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Submit Your DApp
          </h1>
          <p className="text-muted-foreground">
            Add your DApp to Zamaverse and reach thousands of Web3 users
          </p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={submissionType} onValueChange={(v) => setSubmissionType(v as 'new' | 'update')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">
                  <Plus className="w-4 h-4 mr-2" />
                  New DApp
                </TabsTrigger>
                <TabsTrigger value="update" disabled className="relative">
                  <Send className="w-4 h-4 mr-2" />
                  Update Existing
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] px-1 py-0.5 rounded-full font-bold leading-none">
                    Soon
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <CardDescription className="mt-4">
              {submissionType === 'new' 
                ? 'Submit a new DApp to be listed in our directory'
                : 'Request updates to an existing DApp listing'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="submitter_name">Your Name *</Label>
                    <Input
                      id="submitter_name"
                      required
                      value={formData.submitter_name}
                      onChange={(e) => setFormData({ ...formData, submitter_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="submitter_email">Your Email *</Label>
                    <Input
                      id="submitter_email"
                      type="email"
                      required
                      value={formData.submitter_email}
                      onChange={(e) => setFormData({ ...formData, submitter_email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submitter_wallet">Wallet Address (Optional)</Label>
                  <Input
                    id="submitter_wallet"
                    value={formData.submitter_wallet}
                    onChange={(e) => setFormData({ ...formData, submitter_wallet: e.target.value })}
                    placeholder={address || "0x..."}
                  />
                </div>
              </div>

              {}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">DApp Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="name">DApp Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Awesome DApp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DeFi">DeFi</SelectItem>
                      <SelectItem value="NFT">NFT</SelectItem>
                      <SelectItem value="Gaming">Gaming</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Tools">Tools</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description *</Label>
                  <Textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your DApp (max 200 characters)"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="long_description">Detailed Description</Label>
                  <Textarea
                    id="long_description"
                    value={formData.long_description}
                    onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                    placeholder="Detailed description of your DApp"
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <ImageInput
                      value={formData.logo_url}
                      onChange={(url) => setFormData({ ...formData, logo_url: url })}
                      label="Upload Logo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover_image">Cover Image URL</Label>
                    <ImageInput
                      value={formData.cover_image}
                      onChange={(url) => setFormData({ ...formData, cover_image: url })}
                      label="Upload Cover"
                    />
                  </div>
                </div>
              </div>

              {}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Links & Social</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="@yourproject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discord">Discord</Label>
                    <Input
                      id="discord"
                      value={formData.discord}
                      onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                      placeholder="discord.gg/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="github.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_address">Smart Contract Address</Label>
                  <Input
                    id="contract_address"
                    value={formData.contract_address}
                    onChange={(e) => setFormData({ ...formData, contract_address: e.target.value })}
                    placeholder="0x..."
                  />
                </div>
              </div>

              {}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="web3, defi, nft"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Key Features (comma-separated)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="Feature 1, Feature 2, Feature 3"
                  />
                </div>
              </div>

              {}
              <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  🔒 Zama FHE Integration
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="uses_fhevm" className="w-4 h-4" />
                    <Label htmlFor="uses_fhevm" className="font-normal cursor-pointer">
                      Uses Zama FHEVM
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="encrypted_inputs" className="w-4 h-4" />
                    <Label htmlFor="encrypted_inputs" className="font-normal cursor-pointer">
                      Requires encrypted user inputs
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="zama_verified" className="w-4 h-4" />
                    <Label htmlFor="zama_verified" className="font-normal cursor-pointer">
                      Verified by Zama Protocol
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit DApp
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
