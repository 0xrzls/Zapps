import { useState, useEffect } from 'react';
import { backend } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle2, AlertCircle, ExternalLink, Rocket } from 'lucide-react';
import { toast } from 'sonner';

export default function Contracts() {
  const [zvpAddress, setZvpAddress] = useState('');
  const [voteManagerAddress, setVoteManagerAddress] = useState('');
  const [network, setNetwork] = useState<'sepolia' | 'base-sepolia'>('sepolia');
  const [treasuryAddress, setTreasuryAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [deployedContracts, setDeployedContracts] = useState<any>(null);

  useEffect(() => {
    loadContractConfig();
  }, []);

  useEffect(() => {
    loadNetworkConfig();
  }, [network]);

  const loadContractConfig = async () => {
    loadNetworkConfig();
  };

  const loadNetworkConfig = async () => {
    const configKey = network === 'sepolia' ? 'contracts_sepolia' : 'contracts_base_sepolia';
    const { data } = await backend.appConfig.get(configKey);
    
    if (data?.value) {
      setDeployedContracts(data.value);
      setZvpAddress(data.value.zvp || '');
      setVoteManagerAddress(data.value.voteManager || '');
      setTreasuryAddress(data.value.treasury || '');
    } else {
      setZvpAddress('');
      setVoteManagerAddress('');
      setTreasuryAddress('');
      setDeployedContracts(null);
    }
  };

  const saveContractAddresses = async () => {
    if (!zvpAddress || !voteManagerAddress) {
      toast.error('Please fill in all contract addresses');
      return;
    }

    setIsSaving(true);
    try {
      const chainId = network === 'sepolia' ? '11155111' : '84532';
      const config = {
        zvp: zvpAddress,
        voteManager: voteManagerAddress,
        treasury: treasuryAddress,
        chainId,
        updatedAt: new Date().toISOString(),
      };

      const configKey = network === 'sepolia' ? 'contracts_sepolia' : 'contracts_base_sepolia';
      const { error } = await backend.appConfig.set(configKey, config);

      if (error) throw error;

      setDeployedContracts(config);
      toast.success(`${network === 'sepolia' ? 'Sepolia' : 'Base Sepolia'} contract addresses saved successfully!`);
    } catch (error) {
      console.error('Failed to save contracts:', error);
      toast.error('Failed to save contract addresses');
    } finally {
      setIsSaving(false);
    }
  };

  const deployContracts = async () => {
    toast.info('Contract deployment is now handled manually. Use Hardhat or Foundry to deploy FHE contracts to Sepolia.');
    setDeploymentLogs([
      '⚠️ Automated deployment has been deprecated.',
      '📝 For FHE contracts, use Zama fhEVM toolchain:',
      '   - Hardhat: npx hardhat deploy --network sepolia',
      '   - Foundry: forge script Deploy --rpc-url $SEPOLIA_RPC',
      '',
      '🔗 Current deployed contracts:',
      `   - ZappsVoting: 0x753845153876736B50741EDFA584fF97fBECbd50`,
      `   - ZappsToken: 0xD3e7Ce4Fb1D2bD50C6D95C1290dbcC1dc38773E7`,
      `   - RewardManager: 0x4Ba2513f193D72a750810Bd29B0F5f181512630A`,
      '',
      '💡 Enter addresses manually and click Save to update config.',
    ]);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Smart Contract Deployment
        </h1>
        <p className="text-muted-foreground mt-2">
          Deploy and manage ZVP token and VoteManager contracts
        </p>
      </div>

      <Tabs defaultValue="deploy" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deploy">Deploy Instructions</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                One-Click Deployment
              </CardTitle>
              <CardDescription>
                Deploy contracts directly from admin panel with one click
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Network</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={network === 'sepolia' ? 'default' : 'outline'}
                      onClick={() => setNetwork('sepolia')}
                      disabled={isDeploying}
                    >
                      Sepolia
                    </Button>
                    <Button
                      variant={network === 'base-sepolia' ? 'default' : 'outline'}
                      onClick={() => setNetwork('base-sepolia')}
                      disabled={isDeploying}
                    >
                      Base Sepolia
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Treasury Address (Optional)</Label>
                  <Input
                    placeholder="0x... (leave empty to use deployer address)"
                    value={treasuryAddress}
                    onChange={(e) => setTreasuryAddress(e.target.value)}
                    disabled={isDeploying}
                  />
                  <p className="text-xs text-muted-foreground">
                    If empty, deployer address will be used as treasury
                  </p>
                </div>

                <Button
                  onClick={deployContracts}
                  disabled={isDeploying}
                  className="w-full"
                  size="lg"
                >
                  {isDeploying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Deploy Contracts
                    </>
                  )}
                </Button>

                {deploymentLogs.length > 0 && (
                  <Card className="bg-muted">
                    <CardHeader>
                      <CardTitle className="text-sm">Deployment Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 font-mono text-xs">
                        {deploymentLogs.map((log, i) => (
                          <div key={i} className="text-muted-foreground">{log}</div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Requirements:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>DEPLOYER_PRIVATE_KEY secret must be configured</li>
                    <li>ALCHEMY_API_KEY secret must be configured</li>
                    <li>Deployer wallet must have test ETH</li>
                  </ul>
                  <div className="mt-2 space-y-1">
                    <a
                      href="https://sepoliafaucet.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      Get Sepolia ETH <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://www.alchemy.com/faucets/base-sepolia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      Get Base Sepolia ETH <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Configuration</CardTitle>
              <CardDescription>
                Enter deployed contract addresses to activate the voting system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Network</Label>
                <div className="flex gap-2">
                  <Button
                    variant={network === 'sepolia' ? 'default' : 'outline'}
                    onClick={() => setNetwork('sepolia')}
                  >
                    Sepolia
                  </Button>
                  <Button
                    variant={network === 'base-sepolia' ? 'default' : 'outline'}
                    onClick={() => setNetwork('base-sepolia')}
                  >
                    Base Sepolia
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zvp">ZVP Token Address</Label>
                <Input
                  id="zvp"
                  placeholder="0x..."
                  value={zvpAddress}
                  onChange={(e) => setZvpAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voteManager">VoteManager Contract Address</Label>
                <Input
                  id="voteManager"
                  placeholder="0x..."
                  value={voteManagerAddress}
                  onChange={(e) => setVoteManagerAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treasury">Treasury Address</Label>
                <Input
                  id="treasury"
                  placeholder="0x..."
                  value={treasuryAddress}
                  onChange={(e) => setTreasuryAddress(e.target.value)}
                />
              </div>

              <Button
                onClick={saveContractAddresses}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  These addresses will be used by the frontend to interact with your deployed contracts.
                  Make sure they are correct before saving.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Status</CardTitle>
              <CardDescription>
                Current contract configuration and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deployedContracts ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">Contracts Configured</span>
                    <Badge variant="outline" className="ml-auto">
                      {network === 'sepolia' ? 'Sepolia' : 'Base Sepolia'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-md">
                      <div className="text-sm font-medium mb-1">ZVP Token</div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono flex-1 break-all">
                          {deployedContracts.zvp}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(deployedContracts.zvp, 'ZVP address')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-md">
                      <div className="text-sm font-medium mb-1">VoteManager</div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono flex-1 break-all">
                          {deployedContracts.voteManager}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(deployedContracts.voteManager, 'VoteManager address')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {deployedContracts.treasury && (
                      <div className="p-3 bg-muted rounded-md">
                        <div className="text-sm font-medium mb-1">Treasury</div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono flex-1 break-all">
                            {deployedContracts.treasury}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(deployedContracts.treasury, 'Treasury address')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground pt-2">
                    Last updated: {new Date(deployedContracts.updatedAt).toLocaleString()}
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No contracts deployed yet. Follow the deployment instructions and save your contract addresses.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}