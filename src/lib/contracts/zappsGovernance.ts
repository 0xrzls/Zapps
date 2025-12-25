
import { ethers } from 'ethers';
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';
import ZappsGovernanceABI from './abis-json/ZappsGovernance.json';
import { ZAPPS_ADDRESSES, initializeFHEVM } from './zappsContracts';

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export interface Proposal {
  id: bigint;
  proposer: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  voterCount: number;
  executed: boolean;
  cancelled: boolean;
  resultsRevealed: boolean;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
}

export interface VoteReceipt {
  hasVoted: boolean;
  support: VoteSupport;
}

export class ZappsGovernance {
  private adapter: EVMWalletAdapter;

  constructor(adapter: EVMWalletAdapter) {
    this.adapter = adapter;
  }

  private getContract(): ethers.Contract {
    const signer = this.adapter.getSigner();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.GOVERNANCE,
      ZappsGovernanceABI.abi,
      signer
    );
  }

  private getReadOnlyContract(): ethers.Contract {
    const provider = this.adapter.getProvider();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.GOVERNANCE,
      ZappsGovernanceABI.abi,
      provider
    );
  }

  async propose(
    title: string,
    description: string,
    targets: string[] = [],
    values: bigint[] = [],
    calldatas: string[] = []
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsGovernance] Creating proposal:', { title, description });
    return await contract.propose(title, description, targets, values, calldatas);
  }

  async castVote(
    proposalId: bigint,
    support: VoteSupport,
    votingPower: number = 1
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    const address = this.adapter.getPublicKey();
    
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const fhevm = await initializeFHEVM(true);
    const governanceAddress = ethers.getAddress(ZAPPS_ADDRESSES.GOVERNANCE);
    const checksummedAddress = ethers.getAddress(address);

    console.log('[ZappsGovernance] Casting vote:', { proposalId, support, votingPower });

    const input = fhevm.createEncryptedInput(governanceAddress, checksummedAddress);
    input.add64(votingPower);
    const encrypted = await input.encrypt();

    return await contract.castVote(
      proposalId,
      support,
      encrypted.handles[0],
      encrypted.inputProof
    );
  }

  async cancel(proposalId: bigint): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsGovernance] Cancelling proposal:', proposalId);
    return await contract.cancel(proposalId);
  }

  async execute(proposalId: bigint): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsGovernance] Executing proposal:', proposalId);
    return await contract.execute(proposalId);
  }

  async requestResultsDecryption(proposalId: bigint): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsGovernance] Requesting results decryption:', proposalId);
    return await contract.requestResultsDecryption(proposalId);
  }

  async getProposal(proposalId: bigint): Promise<Proposal | null> {
    const contract = this.getReadOnlyContract();
    try {
      const result = await contract.getProposal(proposalId);
      return {
        id: proposalId,
        proposer: result.proposer || result[0],
        title: result.title || result[1],
        startTime: Number(result.startTime || result[2]),
        endTime: Number(result.endTime || result[3]),
        voterCount: Number(result.voterCount || result[4]),
        executed: result.executed || result[5],
        cancelled: result.cancelled || result[6],
        resultsRevealed: result.resultsRevealed || result[7],
        forVotes: Number(result.forVotes || result[8]),
        againstVotes: Number(result.againstVotes || result[9]),
        abstainVotes: Number(result.abstainVotes || result[10]),
        description: '', 
      };
    } catch (error) {
      console.error('[ZappsGovernance] Failed to get proposal:', error);
      return null;
    }
  }

  async getProposalState(proposalId: bigint): Promise<ProposalState> {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.state(proposalId);
    } catch (error) {
      console.error('[ZappsGovernance] Failed to get proposal state:', error);
      return ProposalState.Pending;
    }
  }

  async getActiveProposals(): Promise<bigint[]> {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.getActiveProposals();
    } catch (error) {
      console.error('[ZappsGovernance] Failed to get active proposals:', error);
      return [];
    }
  }

  async getUserProposals(userAddress: string): Promise<bigint[]> {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.getUserProposals(userAddress);
    } catch (error) {
      console.error('[ZappsGovernance] Failed to get user proposals:', error);
      return [];
    }
  }

  async getReceipt(proposalId: bigint, voterAddress: string): Promise<VoteReceipt> {
    const contract = this.getReadOnlyContract();
    try {
      const result = await contract.getReceipt(proposalId, voterAddress);
      return {
        hasVoted: result.hasVoted || result[0],
        support: result.support || result[1],
      };
    } catch (error) {
      console.error('[ZappsGovernance] Failed to get receipt:', error);
      return { hasVoted: false, support: VoteSupport.Abstain };
    }
  }

  async getProposalCount(): Promise<bigint> {
    const contract = this.getReadOnlyContract();
    return await contract.proposalCount();
  }

  async getConstants(): Promise<{
    votingDelay: number;
    votingPeriod: number;
    executionDelay: number;
    minTokensToVote: bigint;
    minReputationToPropose: number;
  }> {
    const contract = this.getReadOnlyContract();
    const [votingDelay, votingPeriod, executionDelay, minTokensToVote, minReputationToPropose] = await Promise.all([
      contract.VOTING_DELAY(),
      contract.VOTING_PERIOD(),
      contract.EXECUTION_DELAY(),
      contract.MIN_TOKENS_TO_VOTE(),
      contract.MIN_REPUTATION_TO_PROPOSE(),
    ]);
    return {
      votingDelay: Number(votingDelay),
      votingPeriod: Number(votingPeriod),
      executionDelay: Number(executionDelay),
      minTokensToVote,
      minReputationToPropose: Number(minReputationToPropose),
    };
  }
}

export class ZappsGovernanceReader {
  private provider: ethers.Provider;

  constructor(rpcUrl: string = 'https://ethereum-sepolia-rpc.publicnode.com') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  private getContract(): ethers.Contract {
    return new ethers.Contract(
      ZAPPS_ADDRESSES.GOVERNANCE,
      ZappsGovernanceABI.abi,
      this.provider
    );
  }

  async getProposal(proposalId: bigint): Promise<Proposal | null> {
    try {
      const contract = this.getContract();
      const result = await contract.getProposal(proposalId);
      return {
        id: proposalId,
        proposer: result[0],
        title: result[1],
        startTime: Number(result[2]),
        endTime: Number(result[3]),
        voterCount: Number(result[4]),
        executed: result[5],
        cancelled: result[6],
        resultsRevealed: result[7],
        forVotes: Number(result[8]),
        againstVotes: Number(result[9]),
        abstainVotes: Number(result[10]),
        description: '',
      };
    } catch {
      return null;
    }
  }

  async getActiveProposals(): Promise<bigint[]> {
    try {
      const contract = this.getContract();
      return await contract.getActiveProposals();
    } catch {
      return [];
    }
  }

  async getProposalState(proposalId: bigint): Promise<ProposalState> {
    try {
      const contract = this.getContract();
      return await contract.state(proposalId);
    } catch {
      return ProposalState.Pending;
    }
  }

  async getProposalCount(): Promise<bigint> {
    const contract = this.getContract();
    return await contract.proposalCount();
  }
}
