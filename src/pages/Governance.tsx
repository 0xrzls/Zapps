import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Vote, 
  Plus, 
  Check, 
  X, 
  Clock,
  Users,
  Shield,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ZappsGovernance, ZappsGovernanceReader, ProposalState, VoteSupport, type Proposal } from '@/lib/contracts/zappsGovernance';
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';
import { Helmet } from 'react-helmet-async';

const stateLabels: Record<ProposalState, string> = {
  [ProposalState.Pending]: 'Pending',
  [ProposalState.Active]: 'Active',
  [ProposalState.Canceled]: 'Canceled',
  [ProposalState.Defeated]: 'Defeated',
  [ProposalState.Succeeded]: 'Succeeded',
  [ProposalState.Queued]: 'Queued',
  [ProposalState.Expired]: 'Expired',
  [ProposalState.Executed]: 'Executed',
};

const stateColors: Record<ProposalState, string> = {
  [ProposalState.Pending]: 'bg-yellow-500/20 text-yellow-500',
  [ProposalState.Active]: 'bg-green-500/20 text-green-500',
  [ProposalState.Canceled]: 'bg-muted text-muted-foreground',
  [ProposalState.Defeated]: 'bg-red-500/20 text-red-500',
  [ProposalState.Succeeded]: 'bg-primary/20 text-primary',
  [ProposalState.Queued]: 'bg-blue-500/20 text-blue-500',
  [ProposalState.Expired]: 'bg-muted text-muted-foreground',
  [ProposalState.Executed]: 'bg-primary/20 text-primary',
};

interface DisplayProposal extends Proposal {
  state: ProposalState;
}

export default function Governance() {
  const { address, isConnected, network } = useWallet();
  const [proposals, setProposals] = useState<DisplayProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('proposals');
  
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const isSepoliaNetwork = network === 'sepolia';
  const governanceReader = new ZappsGovernanceReader();

  useEffect(() => {
    if (isSepoliaNetwork) {
      fetchProposals();
    } else {
      setLoading(false);
    }
  }, [isSepoliaNetwork]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const count = await governanceReader.getProposalCount();
      const loadedProposals: DisplayProposal[] = [];

      for (let i = 1n; i <= count; i++) {
        const [proposal, state] = await Promise.all([
          governanceReader.getProposal(i),
          governanceReader.getProposalState(i),
        ]);
        if (proposal) {
          loadedProposals.push({ ...proposal, state });
        }
      }

      setProposals(loadedProposals.reverse());
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWalletAdapter = (): ZappsGovernance | null => {
    const adapter = (window as any).__walletAdapter;
    if (!adapter || !(adapter instanceof EVMWalletAdapter)) {
      toast.error('Please connect your wallet');
      return null;
    }
    return new ZappsGovernance(adapter);
  };

  const handleCreateProposal = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!isConnected || !isSepoliaNetwork) {
      toast.error('Please connect to Sepolia network');
      return;
    }

    const governance = getWalletAdapter();
    if (!governance) return;

    setCreating(true);
    try {
      const tx = await governance.propose(newTitle, newDescription);
      toast.success('Proposal created! Waiting for confirmation...');
      await tx.wait();
      toast.success('Proposal confirmed on-chain!');
      setNewTitle('');
      setNewDescription('');
      fetchProposals();
    } catch (error: any) {
      console.error('Failed to create proposal:', error);
      toast.error(error.message || 'Failed to create proposal');
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (proposalId: bigint, support: VoteSupport) => {
    if (!isConnected || !isSepoliaNetwork) {
      toast.error('Please connect to Sepolia network');
      return;
    }

    const governance = getWalletAdapter();
    if (!governance) return;

    setVoting(proposalId.toString());
    try {
      const tx = await governance.castVote(proposalId, support);
      toast.success('Vote cast! Waiting for confirmation...');
      await tx.wait();
      toast.success('Vote confirmed!');
      fetchProposals();
    } catch (error: any) {
      console.error('Failed to vote:', error);
      toast.error(error.message || 'Failed to vote');
    } finally {
      setVoting(null);
    }
  };

  const calculateVotePercentage = (proposal: DisplayProposal) => {
    const total = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
    if (total === 0) return { for: 0, against: 0, abstain: 0 };
    return {
      for: (proposal.forVotes / total) * 100,
      against: (proposal.againstVotes / total) * 100,
      abstain: (proposal.abstainVotes / total) * 100,
    };
  };

  if (!isSepoliaNetwork) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Governance | Zapps</title>
          <meta name="description" content="DAO governance with encrypted voting" />
        </Helmet>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Vote className="w-16 h-16 text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Governance</h1>
          <p className="text-muted-foreground mb-6">
            Please switch to Sepolia network to participate in governance
          </p>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Sepolia Testnet Required
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Governance | Zapps</title>
        <meta name="description" content="DAO governance with encrypted voting" />
      </Helmet>

      {}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Vote className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Governance</h1>
          <p className="text-muted-foreground">
            DAO proposals with encrypted voting
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : proposals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Vote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to create a governance proposal!
                </p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Proposal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => {
                const percentages = calculateVotePercentage(proposal);
                const isVoting = voting === proposal.id.toString();
                const canVote = proposal.state === ProposalState.Active;

                return (
                  <Card key={proposal.id.toString()}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={stateColors[proposal.state]}>
                              {stateLabels[proposal.state]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              #{proposal.id.toString()}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold">{proposal.title}</h3>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {proposal.voterCount} voters
                          </div>
                        </div>
                      </div>

                      {}
                      {proposal.resultsRevealed && (
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-500 w-16">For</span>
                            <Progress value={percentages.for} className="flex-1 h-2" />
                            <span className="text-sm w-12 text-right">{proposal.forVotes}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-red-500 w-16">Against</span>
                            <Progress value={percentages.against} className="flex-1 h-2" />
                            <span className="text-sm w-12 text-right">{proposal.againstVotes}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground w-16">Abstain</span>
                            <Progress value={percentages.abstain} className="flex-1 h-2" />
                            <span className="text-sm w-12 text-right">{proposal.abstainVotes}</span>
                          </div>
                        </div>
                      )}

                      {!proposal.resultsRevealed && proposal.voterCount > 0 && (
                        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                          <Shield className="w-4 h-4" />
                          Votes are encrypted until voting ends
                        </div>
                      )}

                      {}
                      {canVote && isConnected && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-green-500 border-green-500/30 hover:bg-green-500/10"
                            onClick={() => handleVote(proposal.id, VoteSupport.For)}
                            disabled={isVoting}
                          >
                            {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                            For
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => handleVote(proposal.id, VoteSupport.Against)}
                            disabled={isVoting}
                          >
                            {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
                            Against
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleVote(proposal.id, VoteSupport.Abstain)}
                            disabled={isVoting}
                          >
                            {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Abstain
                          </Button>
                        </div>
                      )}

                      {}
                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Ends: {new Date(proposal.endTime * 1000).toLocaleDateString()}
                        </div>
                        <div>
                          By: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Proposal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Connect your wallet to create proposals
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-muted/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Requirements</p>
                      <p className="text-muted-foreground">
                        You need minimum reputation to create proposals
                      </p>
                    </div>
                  </div>

                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Proposal Title"
                  />

                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe your proposal in detail..."
                    rows={6}
                  />

                  <Button
                    className="w-full"
                    onClick={handleCreateProposal}
                    disabled={!newTitle.trim() || !newDescription.trim() || creating}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Proposal
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
