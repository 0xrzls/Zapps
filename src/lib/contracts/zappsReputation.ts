
import { ethers } from 'ethers';
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';
import ZappsReputationABI from './abis-json/ZappsReputation.json';
import { ZAPPS_ADDRESSES } from './zappsContracts';

export interface ReputationBreakdown {
  category: string;
  points: number;
}

export interface ReputationEvent {
  user: string;
  points: number;
  reason: string;
  timestamp: number;
}

export class ZappsReputation {
  private adapter: EVMWalletAdapter;

  constructor(adapter: EVMWalletAdapter) {
    this.adapter = adapter;
  }

  private getContract(): ethers.Contract {
    const signer = this.adapter.getSigner();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.REPUTATION,
      ZappsReputationABI.abi,
      signer
    );
  }

  private getReadOnlyContract(): ethers.Contract {
    const provider = this.adapter.getProvider();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.REPUTATION,
      ZappsReputationABI.abi,
      provider
    );
  }

  async getReputation(userAddress: string): Promise<number> {
    const contract = this.getReadOnlyContract();
    try {
      const reputation = await contract.getReputation(userAddress);
      return Number(reputation);
    } catch (error) {
      console.error('[ZappsReputation] Failed to get reputation:', error);
      return 0;
    }
  }

  async getReputationBreakdown(userAddress: string): Promise<ReputationBreakdown[]> {
    const contract = this.getReadOnlyContract();
    try {
      const result = await contract.getReputationBreakdown(userAddress);
      
      const categories = result[0] || [];
      const points = result[1] || [];
      
      return categories.map((cat: string, i: number) => ({
        category: ethers.decodeBytes32String(cat),
        points: Number(points[i] || 0),
      }));
    } catch (error) {
      console.error('[ZappsReputation] Failed to get breakdown:', error);
      return [];
    }
  }

  async getOwner(): Promise<string> {
    const contract = this.getReadOnlyContract();
    return await contract.owner();
  }

  async isAuthorized(address: string): Promise<boolean> {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.authorizedCallers(address);
    } catch {
      return false;
    }
  }
}

export class ZappsReputationReader {
  private provider: ethers.Provider;

  constructor(rpcUrl: string = 'https://ethereum-sepolia-rpc.publicnode.com') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  private getContract(): ethers.Contract {
    return new ethers.Contract(
      ZAPPS_ADDRESSES.REPUTATION,
      ZappsReputationABI.abi,
      this.provider
    );
  }

  async getReputation(userAddress: string): Promise<number> {
    try {
      const contract = this.getContract();
      const reputation = await contract.getReputation(userAddress);
      return Number(reputation);
    } catch (error) {
      console.error('[ZappsReputationReader] Failed to get reputation:', error);
      return 0;
    }
  }

  async getReputationBreakdown(userAddress: string): Promise<ReputationBreakdown[]> {
    try {
      const contract = this.getContract();
      const result = await contract.getReputationBreakdown(userAddress);
      const categories = result[0] || [];
      const points = result[1] || [];
      
      return categories.map((cat: string, i: number) => ({
        category: ethers.decodeBytes32String(cat),
        points: Number(points[i] || 0),
      }));
    } catch (error) {
      console.error('[ZappsReputationReader] Failed to get breakdown:', error);
      return [];
    }
  }
}
