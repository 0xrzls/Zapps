
import { ethers } from 'ethers';
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';
import ZappsDiscussionABI from './abis-json/ZappsDiscussion.json';
import { ZAPPS_ADDRESSES, uuidToBytes32 } from './zappsContracts';

export interface OnChainMessage {
  hash: string;
  author: string;
  contentHash: string;
  timestamp: number;
  parentHash: string;
  isEncrypted: boolean;
  isDeleted: boolean;
  upvotes: number;
  downvotes: number;
}

export interface RoomInfo {
  owner: string;
  isPublic: boolean;
  requiresReputation: boolean;
  minReputationToPost: number;
  messageCount: number;
  participantCount: number;
  createdAt: number;
  isActive: boolean;
}

export interface UserStats {
  messageCount: number;
  lastMessageTimestamp: number;
  banned: boolean;
  moderator: boolean;
  participated: boolean;
}

export class ZappsDiscussion {
  private adapter: EVMWalletAdapter;

  constructor(adapter: EVMWalletAdapter) {
    this.adapter = adapter;
  }

  private getContract(): ethers.Contract {
    const signer = this.adapter.getSigner();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.DISCUSSION,
      ZappsDiscussionABI.abi,
      signer
    );
  }

  private getReadOnlyContract(): ethers.Contract {
    const provider = this.adapter.getProvider();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.DISCUSSION,
      ZappsDiscussionABI.abi,
      provider
    );
  }

  async createRoom(
    dappId: string,
    isPublic: boolean = true,
    requiresReputation: boolean = false,
    minReputationToPost: number = 0
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    const projectId = this.dappIdToProjectId(dappId);
    console.log('[ZappsDiscussion] Creating room for project:', projectId);
    return await contract.createRoom(projectId, isPublic, requiresReputation, minReputationToPost);
  }

  async postMessage(
    dappId: string,
    contentHash: string,
    parentHash: string = ethers.ZeroHash,
    isEncrypted: boolean = false
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    const projectId = this.dappIdToProjectId(dappId);
    console.log('[ZappsDiscussion] Posting message:', { projectId, contentHash, parentHash, isEncrypted });
    return await contract.postMessage(projectId, contentHash, parentHash, isEncrypted);
  }

  async upvoteMessage(messageHash: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsDiscussion] Upvoting message:', messageHash);
    return await contract.upvoteMessage(messageHash);
  }

  async downvoteMessage(messageHash: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsDiscussion] Downvoting message:', messageHash);
    return await contract.downvoteMessage(messageHash);
  }

  async deleteMessage(dappId: string, messageHash: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    const projectId = this.dappIdToProjectId(dappId);
    console.log('[ZappsDiscussion] Deleting message:', { projectId, messageHash });
    return await contract.deleteMessage(projectId, messageHash);
  }

  async banUser(dappId: string, userAddress: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    const projectId = this.dappIdToProjectId(dappId);
    console.log('[ZappsDiscussion] Banning user:', { projectId, userAddress });
    return await contract.banUser(projectId, userAddress);
  }

  async addModerator(dappId: string, moderatorAddress: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    const projectId = this.dappIdToProjectId(dappId);
    console.log('[ZappsDiscussion] Adding moderator:', { projectId, moderatorAddress });
    return await contract.addModerator(projectId, moderatorAddress);
  }

  async getRoomInfo(dappId: string): Promise<RoomInfo | null> {
    const contract = this.getReadOnlyContract();
    const projectId = this.dappIdToProjectId(dappId);
    try {
      const result = await contract.getRoomInfo(projectId);
      return {
        owner: result.roomOwner || result[0],
        isPublic: result.isPublic || result[1],
        requiresReputation: result.requiresReputation || result[2],
        minReputationToPost: Number(result.minReputationToPost || result[3]),
        messageCount: Number(result.messageCount || result[4]),
        participantCount: Number(result.participantCount || result[5]),
        createdAt: Number(result.createdAt || result[6]),
        isActive: result.isActive || result[7],
      };
    } catch (error) {
      console.error('[ZappsDiscussion] Failed to get room info:', error);
      return null;
    }
  }

  async getRecentMessages(dappId: string, count: number = 50): Promise<string[]> {
    const contract = this.getReadOnlyContract();
    const projectId = this.dappIdToProjectId(dappId);
    try {
      return await contract.getRecentMessages(projectId, count);
    } catch (error) {
      console.error('[ZappsDiscussion] Failed to get recent messages:', error);
      return [];
    }
  }

  async getMessage(messageHash: string): Promise<OnChainMessage | null> {
    const contract = this.getReadOnlyContract();
    try {
      const result = await contract.getMessage(messageHash);
      return {
        hash: messageHash,
        author: result.author || result[0],
        contentHash: result.contentHash || result[1],
        timestamp: Number(result.timestamp || result[2]),
        parentHash: result.parentHash || result[3],
        isEncrypted: result.isEncrypted || result[4],
        isDeleted: result.isDeleted_ || result[5],
        upvotes: Number(result.upvotes || result[6]),
        downvotes: Number(result.downvotes || result[7]),
      };
    } catch (error) {
      console.error('[ZappsDiscussion] Failed to get message:', error);
      return null;
    }
  }

  async getUserStats(dappId: string, userAddress: string): Promise<UserStats> {
    const contract = this.getReadOnlyContract();
    const projectId = this.dappIdToProjectId(dappId);
    try {
      const result = await contract.getUserStats(projectId, userAddress);
      return {
        messageCount: Number(result.messageCount || result[0]),
        lastMessageTimestamp: Number(result.lastMessageTimestamp || result[1]),
        banned: result.banned || result[2],
        moderator: result.moderator || result[3],
        participated: result.participated || result[4],
      };
    } catch (error) {
      console.error('[ZappsDiscussion] Failed to get user stats:', error);
      return {
        messageCount: 0,
        lastMessageTimestamp: 0,
        banned: false,
        moderator: false,
        participated: false,
      };
    }
  }

  private dappIdToProjectId(dappId: string): bigint {
    
    const hash = uuidToBytes32(dappId);
    return BigInt(hash.slice(0, 18)); 
  }
}

export class ZappsDiscussionReader {
  private provider: ethers.Provider;

  constructor(rpcUrl: string = 'https://ethereum-sepolia-rpc.publicnode.com') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  private getContract(): ethers.Contract {
    return new ethers.Contract(
      ZAPPS_ADDRESSES.DISCUSSION,
      ZappsDiscussionABI.abi,
      this.provider
    );
  }

  private dappIdToProjectId(dappId: string): bigint {
    const hash = uuidToBytes32(dappId);
    return BigInt(hash.slice(0, 18));
  }

  async getRoomInfo(dappId: string): Promise<RoomInfo | null> {
    const contract = this.getContract();
    const projectId = this.dappIdToProjectId(dappId);
    try {
      const result = await contract.getRoomInfo(projectId);
      return {
        owner: result[0],
        isPublic: result[1],
        requiresReputation: result[2],
        minReputationToPost: Number(result[3]),
        messageCount: Number(result[4]),
        participantCount: Number(result[5]),
        createdAt: Number(result[6]),
        isActive: result[7],
      };
    } catch {
      return null;
    }
  }

  async getRecentMessages(dappId: string, count: number = 50): Promise<string[]> {
    const contract = this.getContract();
    const projectId = this.dappIdToProjectId(dappId);
    try {
      return await contract.getRecentMessages(projectId, count);
    } catch {
      return [];
    }
  }

  async getMessage(messageHash: string): Promise<OnChainMessage | null> {
    const contract = this.getContract();
    try {
      const result = await contract.getMessage(messageHash);
      return {
        hash: messageHash,
        author: result[0],
        contentHash: result[1],
        timestamp: Number(result[2]),
        parentHash: result[3],
        isEncrypted: result[4],
        isDeleted: result[5],
        upvotes: Number(result[6]),
        downvotes: Number(result[7]),
      };
    } catch {
      return null;
    }
  }
}
