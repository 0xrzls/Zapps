import { useState, useEffect } from 'react';
import { Pencil, RefreshCw, Lock, Unlock } from 'lucide-react';
import { backend } from '@/services';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';
import { ZappsVoting, createZappsVotingInstance, TargetType } from '@/lib/contracts/zappsContracts';
import FHELogsDialog from '@/components/admin/FHELogsDialog';
interface DAppScore {
  id: string;
  dapp_id: string;
  vote_score: number;
  user_score: number;
  social_score: number;
  trust_score: number;
  fhe_average?: number;
  fhe_count?: number;
  dapps: {
    name: string;
  };
}

interface ContractStatus {
  initialized: boolean;
  sum: number;
  count: number;
  loading: boolean;
  decryptionPending?: boolean;
  latestRequestId?: string;
  pendingSince?: Date;
  isStuck?: boolean;
  timeRemaining?: number;
}

export default function Scores() {
  const { address, network } = useWallet();
  const [scores, setScores] = useState<DAppScore[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<DAppScore | null>(null);
  const [voteScore, setVoteScore] = useState('');
  const [fheLoading, setFheLoading] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<Record<string, ContractStatus>>({});
  const isSepolia = network === 'sepolia';
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsDappId, setLogsDappId] = useState<string | null>(null);

  const fetchScores = async () => {
    
    const { data, error } = await backend.scores.getAllWithDApps({ orderBy: 'created_at', ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setScores(data || []);

    const { data: allDapps } = await backend.dapps.getAll();

    if (allDapps) {
      const existing = new Set((data || []).map((s) => s.dapp_id));
      const missing = allDapps.filter((d) => !existing.has(d.id));

      if (missing.length > 0) {
        await backend.scores.insert(
          missing.map((d) => ({ dapp_id: d.id, vote_score: 0, user_score: 0, social_score: 0 }))
        );
        
        const { data: refreshed } = await backend.scores.getAllWithDApps({ orderBy: 'created_at', ascending: false });
        setScores(refreshed || []);
      }
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleEdit = (score: DAppScore) => {
    setEditingScore(score);
    setVoteScore(score.vote_score.toString());
    setEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScore) return;

    const newVoteScore = parseFloat(voteScore);
    if (isNaN(newVoteScore) || newVoteScore < 0 || newVoteScore > 10) {
      toast({
        title: 'Error',
        description: 'Vote score must be between 0-10',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await backend.scores.update(editingScore.dapp_id, { vote_score: newVoteScore });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Score updated successfully' });
      setEditDialogOpen(false);
      fetchScores();
    }
  };

  const handleInitializeDApp = async (dappId: string, dappName: string) => {
    if (!address || network !== 'sepolia') {
      toast({
        title: "Network Error",
        description: "Please connect wallet to Sepolia network",
        variant: "destructive"
      });
      return;
    }

    setFheLoading(dappId);
    try {
      const adapter = (window as any).__walletAdapter;
      if (!(adapter instanceof EVMWalletAdapter)) {
        throw new Error('Invalid wallet adapter');
      }

      const voting = await createZappsVotingInstance(adapter);
      
      const targetData = await voting.getTargetData(dappId);
      if (Number(targetData.totalVotes) > 0) {
        toast({
          title: "Already Exists",
          description: `DApp "${dappName}" sudah terdaftar di contract`,
        });
        setTimeout(() => checkContractStatus(dappId), 1000);
        setFheLoading(null);
        return;
      }
      
      toast({
        title: "Auto-Initialize",
        description: "DApp akan auto-init pada vote pertama. Request decryption untuk testing.",
      });

      const tx = await voting.requestDecryption(dappId);
      const txHash = tx.hash;
      
      toast({
        title: "✅ DApp Initialized",
        description: `${dappName} is now ready for FHE voting. TX: ${txHash.slice(0, 10)}...`,
      });

      await fetchScores();
    } catch (error: any) {
      console.error('Failed to initialize dApp:', error);
      toast({
        title: "Initialization Failed",
        description: error.message || "Failed to initialize dApp on-chain",
        variant: "destructive"
      });
    } finally {
      setFheLoading(null);
    }
  };

  const handleRequestSnapshot = async (dappId: string, dappName: string) => {
    if (!address || network !== 'sepolia') {
      toast({
        title: "Network Error",
        description: "Please connect wallet to Sepolia network",
        variant: "destructive"
      });
      return;
    }

    setFheLoading(dappId);
    try {
      const adapter = (window as any).__walletAdapter;
      if (!(adapter instanceof EVMWalletAdapter)) {
        throw new Error('Invalid wallet adapter');
      }

      const voting = await createZappsVotingInstance(adapter);
      
      toast({
        title: "Requesting Snapshot",
        description: "Triggering async decryption via Gateway...",
      });

      const tx = await voting.requestDecryption(dappId);
      const txHash = tx.hash;
      
      toast({
        title: "✅ Snapshot Requested",
        description: `Gateway will decrypt and callback for ${dappName}. TX: ${txHash.slice(0, 10)}...`,
      });

      setTimeout(async () => {
        await fetchScores();
      }, 3000);
    } catch (error: any) {
      console.error('Failed to request snapshot:', error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to request snapshot",
        variant: "destructive"
      });
    } finally {
      setFheLoading(null);
    }
  };

  const handleRefreshFHEScores = async (dappId: string) => {
    if (!isSepolia || !address) return;

    try {
      const adapter = (window as any).__walletAdapter;
      if (!(adapter instanceof EVMWalletAdapter)) return;

      const voting = await createZappsVotingInstance(adapter);
      const targetData = await voting.getTargetData(dappId);

      const average = Number(targetData.average) / 100; 
      
      await backend.scores.update(dappId, {
        vote_score: average,
      } as any);

      toast({
        title: 'FHE Scores Refreshed',
        description: `Average: ${average.toFixed(2)}, Count: ${targetData.count}`,
      });

      await fetchScores();
      await checkContractStatus(dappId);
    } catch (error: any) {
      console.error('Failed to refresh FHE scores:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to refresh FHE scores',
        variant: 'destructive',
      });
    }
  };

  const handleAutoSnapshot = async (dappId: string, dappName: string) => {
    setFheLoading(dappId);
    try {
      toast({
        title: "Triggering Snapshot",
        description: `Processing FHE snapshot for ${dappName}...`,
      });

      const { data, error } = await backend.functions.invoke('fhe-snapshot', { dappId });

      if (error) throw error;

      if ((data as any)?.status === 'pending') {
        toast({ title: 'Snapshot Pending', description: (data as any)?.message || 'Gateway is processing, will update soon.' });
      } else {
        toast({
          title: "✅ Snapshot Complete",
          description: `Average: ${data.average.toFixed(2)}★ from ${data.count} votes`,
        });
      }

      await fetchScores();
    } catch (error: any) {
      console.error('Snapshot failed:', error);
      toast({
        title: "Snapshot Failed",
        description: error.message || "Failed to process snapshot",
        variant: "destructive"
      });
    } finally {
      setFheLoading(null);
    }
  };

  const checkContractStatus = async (dappId: string) => {
    if (!isSepolia || !address) return;

    try {
      const adapter = (window as any).__walletAdapter;
      if (!(adapter instanceof EVMWalletAdapter)) return;

      const voting = await createZappsVotingInstance(adapter);
      const targetData = await voting.getTargetData(dappId);
      const exists = Number(targetData.totalVotes) > 0;

      setContractStatus((prev) => ({
        ...prev,
        [dappId]: {
          initialized: exists,
          sum: Number(targetData.sum),
          count: targetData.count,
          loading: false,
          decryptionPending: false,
          latestRequestId: '0',
        },
      }));
    } catch (error) {
      console.error('Failed to check contract status:', error);
      setContractStatus((prev) => ({
        ...prev,
        [dappId]: { initialized: false, sum: 0, count: 0, loading: false },
      }));
    }
  };

  const handleForceRetrySnapshot = async (dappId: string, dappName: string) => {
    if (!address || network !== 'sepolia') {
      toast({
        title: "Network Error",
        description: "Please connect wallet to Sepolia network",
        variant: "destructive"
      });
      return;
    }

    setFheLoading(dappId);
    try {
      
      await backend.functions.invoke('fhe-clear-pending', { dappId });

      const adapter = (window as any).__walletAdapter;
      if (!(adapter instanceof EVMWalletAdapter)) {
        throw new Error('Invalid wallet adapter');
      }

      const voting = await createZappsVotingInstance(adapter);
      
      toast({
        title: "🔄 Force Retry",
        description: "Clearing pending state and requesting new snapshot...",
      });

      const tx = await voting.requestDecryption(dappId);
      const txHash = tx.hash;
      
      toast({
        title: "✅ Snapshot Re-requested",
        description: `Gateway callback pending for ${dappName}. TX: ${txHash.slice(0, 10)}...`,
      });

      setTimeout(async () => {
        await checkContractStatus(dappId);
        await fetchScores();
      }, 2000);
    } catch (error: any) {
      console.error('Force retry failed:', error);
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to force retry snapshot",
        variant: "destructive"
      });
    } finally {
      setFheLoading(null);
    }
  };

  const calculateTrustLevel = (userScore: number, socialScore: number, voteScore: number) => {
    const avgScore = (userScore + socialScore + voteScore) / 3;
    if (avgScore >= 7) return 'High';
    if (avgScore >= 4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">DApp Scores Management</h2>
        <p className="text-muted-foreground">Manage validation scores and FHE voting for each dApp</p>
        {isSepolia && (
          <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium">🔐 FHE Voting Enabled (Sepolia)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Initialize dApps and trigger decryption to view encrypted vote aggregates
            </p>
          </div>
        )}
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DApp Name</TableHead>
              <TableHead className="text-center">User Score</TableHead>
              <TableHead className="text-center">Vote Score</TableHead>
              <TableHead className="text-center">Average Score</TableHead>
              <TableHead className="text-center">Trust Level</TableHead>
              {isSepolia && <TableHead className="text-center">Contract Status</TableHead>}
              {isSepolia && <TableHead className="text-center">FHE Score</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scores.map((score) => {
              const avgScore = (score.user_score + score.social_score + score.vote_score) / 3;
              const trustLevel = calculateTrustLevel(score.user_score, score.social_score, score.vote_score);
              
              return (
                <TableRow key={score.id}>
                  <TableCell className="font-medium">{score.dapps.name}</TableCell>
                  <TableCell className="text-center">{score.user_score.toFixed(1)}</TableCell>
                  <TableCell className="text-center">{score.vote_score.toFixed(1)}</TableCell>
                  <TableCell className="text-center">{avgScore.toFixed(1)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={
                      trustLevel === 'High' ? 'default' : 
                      trustLevel === 'Medium' ? 'secondary' : 
                      'destructive'
                    }>
                      {trustLevel}
                    </Badge>
                  </TableCell>
                  
                  {isSepolia && (
                    <TableCell className="text-center">
                      {contractStatus[score.dapp_id] ? (
                        <div className="space-y-2">
                          <Badge variant={contractStatus[score.dapp_id].initialized ? "default" : "outline"}>
                            {contractStatus[score.dapp_id].initialized ? (
                              <>
                                <Unlock className="w-3 h-3 mr-1" />
                                Initialized
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 mr-1" />
                                Not Init
                              </>
                            )}
                          </Badge>
                          
                          {contractStatus[score.dapp_id].decryptionPending && (
                            <Badge variant="secondary" className="text-xs">
                              ⏳ Waiting Callback
                            </Badge>
                          )}
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Sum: {contractStatus[score.dapp_id].sum} | Count: {contractStatus[score.dapp_id].count}</div>
                            
                            {contractStatus[score.dapp_id].latestRequestId && contractStatus[score.dapp_id].latestRequestId !== "0" && (
                              <div>
                                <a 
                                  href={`https://gateway.testnet.zama.ai/explorer/request/${contractStatus[score.dapp_id].latestRequestId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  View Request #{contractStatus[score.dapp_id].latestRequestId}
                                </a>
                              </div>
                            )}
                            
                            {contractStatus[score.dapp_id].pendingSince && (
                              <div className="text-yellow-500">
                                Pending: {Math.floor((Date.now() - contractStatus[score.dapp_id].pendingSince!.getTime()) / 60000)}m ago
                              </div>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => checkContractStatus(score.dapp_id)}
                            disabled={contractStatus[score.dapp_id]?.loading}
                            className="h-6 text-xs"
                          >
                            <RefreshCw className={`w-3 h-3 ${contractStatus[score.dapp_id]?.loading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => checkContractStatus(score.dapp_id)}
                          disabled={contractStatus[score.dapp_id]?.loading}
                          className="h-7 text-xs"
                        >
                          {contractStatus[score.dapp_id]?.loading ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            'Check Status'
                          )}
                        </Button>
                      )}
                    </TableCell>
                  )}
                  
                  {isSepolia && (
                    <TableCell className="text-center">
                      {score.fhe_count && score.fhe_count > 0 ? (
                          <div className="space-y-1">
                          <div className="font-medium">{score.fhe_average?.toFixed(2)}★</div>
                          <div className="text-xs text-muted-foreground">
                            {score.fhe_count} votes
                          </div>
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRefreshFHEScores(score.dapp_id)}
                              disabled={fheLoading === score.dapp_id}
                              className="h-6 text-xs"
                              title="Refresh FHE scores from contract"
                            >
                              <RefreshCw className={`w-3 h-3 ${fheLoading === score.dapp_id ? 'animate-spin' : ''}`} />
                            </Button>
                             <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAutoSnapshot(score.dapp_id, score.dapps?.name || 'Unknown')}
                              disabled={fheLoading === score.dapp_id}
                              className="h-6 text-[10px] px-2"
                              title="Auto-decrypt and publish snapshot"
                            >
                              📸
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleForceRetrySnapshot(score.dapp_id, score.dapps?.name || 'Unknown')}
                              disabled={fheLoading === score.dapp_id}
                              className="h-6 text-[10px] px-2 text-orange-500"
                              title="Force retry snapshot (clears pending)"
                            >
                              🔄
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="outline" className="gap-1">
                            <Lock className="w-3 h-3" />
                            Encrypted
                          </Badge>
                          <div className="flex gap-1 justify-center mt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleInitializeDApp(score.dapp_id, score.dapps?.name || 'Unknown')}
                              disabled={fheLoading === score.dapp_id}
                              className="h-6 text-[10px] px-2"
                              title="Initialize dApp for FHE voting"
                            >
                              {fheLoading === score.dapp_id ? '...' : 'Init'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAutoSnapshot(score.dapp_id, score.dapps?.name || 'Unknown')}
                              disabled={fheLoading === score.dapp_id}
                              className="h-6 text-[10px] px-2"
                              title="Auto-decrypt and publish snapshot"
                            >
                              📸
                            </Button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  )}
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(score)}
                        title="Edit vote score"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {isSepolia && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => checkContractStatus(score.dapp_id)}
                            title="Diagnostics"
                          >
                            Diag
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={async () => {
                              if (!address) return;
                              setFheLoading(score.dapp_id);
                              try {
                                const adapter = (window as any).__walletAdapter;
                                if (!(adapter instanceof EVMWalletAdapter)) {
                                  throw new Error('Invalid wallet adapter');
                                }
                                const voting = await createZappsVotingInstance(adapter);
                                const tx = await voting.requestDecryption(score.dapp_id);
                                toast({ title: 'Retry Requested', description: `Tx: ${tx.hash.slice(0,10)}...` });
                                setTimeout(() => checkContractStatus(score.dapp_id), 2000);
                              } catch (e: any) {
                                toast({ title: 'Retry Failed', description: e?.message || 'Failed to retry decryption', variant: 'destructive' });
                              } finally {
                                setFheLoading(null);
                              }
                            }}
                            title="Clear Stuck Decryption"
                          >
                            Clear Stuck
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => { setLogsDappId(score.dapp_id); setLogsOpen(true); }}
                            title="View FHE logs"
                          >
                            Logs
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vote Score</DialogTitle>
            <DialogDescription>
              Update validation score for {editingScore?.dapps.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vote_score">Vote Score (0-10)</Label>
              <Input
                id="vote_score"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={voteScore}
                onChange={(e) => setVoteScore(e.target.value)}
                required
              />
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
              <p><strong>User Score:</strong> {editingScore?.user_score.toFixed(1)} (auto-calculated from votes)</p>
              <p><strong>Social Score:</strong> {editingScore?.social_score.toFixed(1)} (auto-calculated from interactions)</p>
              <p><strong>Trust Score:</strong> {editingScore && calculateTrustLevel(editingScore.user_score, editingScore.social_score, parseFloat(voteScore) || editingScore.vote_score)} (auto-calculated)</p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <FHELogsDialog open={logsOpen} onOpenChange={setLogsOpen} dappId={logsDappId} />
    </div>
  );
}
