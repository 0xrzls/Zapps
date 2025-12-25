
import { ethers } from 'ethers';
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';
import ZappsSocialABI from './abis-json/ZappsSocial.json';
import { ZAPPS_ADDRESSES, initializeFHEVM } from './zappsContracts';

export enum PrivacyMode {
  Public = 0,
  FollowersOnly = 1,
  Private = 2,
}

export enum FollowMode {
  Public = 0,
  Private = 1,
}

export interface Post {
  id: string;
  author: string;
  content: string;
  privacyMode: PrivacyMode;
  minReputationRequired: number;
  timestamp: number;
  upvotes: number;
  downvotes: number;
}

export interface SocialCounts {
  followers: number;
  following: number;
}

export class ZappsSocial {
  private adapter: EVMWalletAdapter;

  constructor(adapter: EVMWalletAdapter) {
    this.adapter = adapter;
  }

  private getContract(): ethers.Contract {
    const signer = this.adapter.getSigner();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.SOCIAL,
      ZappsSocialABI.abi,
      signer
    );
  }

  private getReadOnlyContract(): ethers.Contract {
    const provider = this.adapter.getProvider();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.SOCIAL,
      ZappsSocialABI.abi,
      provider
    );
  }

  async createPost(
    content: string,
    privacyMode: PrivacyMode = PrivacyMode.Public,
    minReputationRequired: number = 0
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsSocial] Creating post:', { content, privacyMode, minReputationRequired });
    return await contract.createPost(content, privacyMode, minReputationRequired);
  }

  async follow(
    targetAddress: string,
    mode: FollowMode = FollowMode.Public
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsSocial] Following:', targetAddress, 'Mode:', mode);
    return await contract.follow(targetAddress, mode);
  }

  async unfollow(targetAddress: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsSocial] Unfollowing:', targetAddress);
    return await contract.unfollow(targetAddress);
  }

  async upvote(postId: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsSocial] Upvoting post:', postId);
    return await contract.upvote(postId);
  }

  async downvote(postId: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsSocial] Downvoting post:', postId);
    return await contract.downvote(postId);
  }

  async getPost(postId: string): Promise<Post | null> {
    const contract = this.getReadOnlyContract();
    try {
      const result = await contract.getPost(postId);
      return {
        id: postId,
        author: result.author,
        content: result.content,
        privacyMode: Number(result.privacyMode),
        minReputationRequired: Number(result.minReputationRequired),
        timestamp: Number(result.timestamp),
        upvotes: Number(result.upvotes),
        downvotes: Number(result.downvotes),
      };
    } catch (error) {
      console.error('[ZappsSocial] Failed to get post:', error);
      return null;
    }
  }

  async isFollowing(followerAddress: string, targetAddress: string): Promise<boolean> {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.checkIsFollowing(followerAddress, targetAddress);
    } catch {
      return false;
    }
  }

  async getSocialCounts(userAddress: string): Promise<SocialCounts> {
    const contract = this.getReadOnlyContract();
    try {
      const result = await contract.getPublicSocialCounts(userAddress);
      return {
        followers: Number(result.followers || result[0] || 0),
        following: Number(result.following || result[1] || 0),
      };
    } catch (error) {
      console.error('[ZappsSocial] Failed to get social counts:', error);
      return { followers: 0, following: 0 };
    }
  }

  async getOwner(): Promise<string> {
    const contract = this.getReadOnlyContract();
    return await contract.owner();
  }
}

export class ZappsSocialReader {
  private provider: ethers.Provider;

  constructor(rpcUrl: string = 'https://ethereum-sepolia-rpc.publicnode.com') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  private getContract(): ethers.Contract {
    return new ethers.Contract(
      ZAPPS_ADDRESSES.SOCIAL,
      ZappsSocialABI.abi,
      this.provider
    );
  }

  async getPost(postId: string): Promise<Post | null> {
    try {
      const contract = this.getContract();
      const result = await contract.getPost(postId);
      return {
        id: postId,
        author: result.author,
        content: result.content,
        privacyMode: Number(result.privacyMode),
        minReputationRequired: Number(result.minReputationRequired),
        timestamp: Number(result.timestamp),
        upvotes: Number(result.upvotes),
        downvotes: Number(result.downvotes),
      };
    } catch {
      return null;
    }
  }

  async getSocialCounts(userAddress: string): Promise<SocialCounts> {
    try {
      const contract = this.getContract();
      const result = await contract.getPublicSocialCounts(userAddress);
      return {
        followers: Number(result[0] || 0),
        following: Number(result[1] || 0),
      };
    } catch {
      return { followers: 0, following: 0 };
    }
  }

  async isFollowing(follower: string, target: string): Promise<boolean> {
    try {
      const contract = this.getContract();
      return await contract.checkIsFollowing(follower, target);
    } catch {
      return false;
    }
  }
}
