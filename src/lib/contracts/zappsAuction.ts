
import { ethers } from 'ethers';
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';
import ZappsAuctionABI from './abis-json/ZappsAuction.json';
import { ZAPPS_ADDRESSES, initializeFHEVM } from './zappsContracts';

export enum AuctionState {
  Active = 0,
  Ended = 1,
  Finalized = 2,
  Cancelled = 3,
}

export interface Auction {
  id: bigint;
  seller: string;
  itemName: string;
  itemDescription: string;
  startingPrice: bigint;
  startTime: number;
  endTime: number;
  bidCount: number;
  finalized: boolean;
  cancelled: boolean;
  winner: string;
  winningBid: bigint;
}

export interface LeaderboardEntry {
  address: string;
  auctionsCreated: number;
  auctionsWon: number;
  totalBids: number;
}

export class ZappsAuction {
  private adapter: EVMWalletAdapter;

  constructor(adapter: EVMWalletAdapter) {
    this.adapter = adapter;
  }

  private getContract(): ethers.Contract {
    const signer = this.adapter.getSigner();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.AUCTION,
      ZappsAuctionABI.abi,
      signer
    );
  }

  private getReadOnlyContract(): ethers.Contract {
    const provider = this.adapter.getProvider();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.AUCTION,
      ZappsAuctionABI.abi,
      provider
    );
  }

  async getAuction(auctionId: bigint): Promise<Auction | null> {
    const contract = this.getReadOnlyContract();
    try {
      const result = await contract.getAuction(auctionId);
      return {
        id: auctionId,
        seller: result.seller || result[0],
        itemName: result.itemName || result[1],
        itemDescription: '', 
        startingPrice: result.startingPrice || result[2],
        startTime: Number(result.startTime || result[3]),
        endTime: Number(result.endTime || result[4]),
        bidCount: Number(result.bidCount || result[5]),
        finalized: result.finalized || result[6],
        cancelled: result.cancelled || result[7],
        winner: result.winner || result[8],
        winningBid: result.winningBid || result[9],
      };
    } catch (error) {
      console.error('[ZappsAuction] Failed to get auction:', error);
      return null;
    }
  }

  async getAuctionState(auctionId: bigint): Promise<AuctionState> {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.getAuctionState(auctionId);
    } catch {
      return AuctionState.Active;
    }
  }

  async getActiveAuctions(): Promise<bigint[]> {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.getActiveAuctions();
    } catch (error) {
      console.error('[ZappsAuction] Failed to get active auctions:', error);
      return [];
    }
  }

  async getUserAuctions(userAddress: string): Promise<bigint[]> {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.getUserAuctions(userAddress);
    } catch {
      return [];
    }
  }

  async getUserBidAuctions(userAddress: string): Promise<bigint[]> {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.getUserBidAuctions(userAddress);
    } catch {
      return [];
    }
  }

  async getAuctionCount(): Promise<bigint> {
    const contract = this.getReadOnlyContract();
    return await contract.auctionCount();
  }

  async getBidCount(auctionId: bigint): Promise<number> {
    const contract = this.getReadOnlyContract();
    try {
      return Number(await contract.getBidCount(auctionId));
    } catch {
      return 0;
    }
  }

  async hasBidOnAuction(auctionId: bigint, bidderAddress: string): Promise<boolean> {
    const contract = this.getReadOnlyContract();
    try {
      return await contract.hasBidOnAuction(auctionId, bidderAddress);
    } catch {
      return false;
    }
  }

  async getPlatformFee(): Promise<number> {
    const contract = this.getReadOnlyContract();
    try {
      return Number(await contract.platformFeeBps());
    } catch {
      return 0;
    }
  }

  async buildLeaderboard(addresses: string[]): Promise<LeaderboardEntry[]> {
    const leaderboard: LeaderboardEntry[] = [];

    for (const address of addresses) {
      try {
        const [auctions, bidAuctions] = await Promise.all([
          this.getUserAuctions(address),
          this.getUserBidAuctions(address),
        ]);

        let wins = 0;
        for (const auctionId of bidAuctions) {
          const auction = await this.getAuction(auctionId);
          if (auction?.winner?.toLowerCase() === address.toLowerCase()) {
            wins++;
          }
        }

        leaderboard.push({
          address,
          auctionsCreated: auctions.length,
          auctionsWon: wins,
          totalBids: bidAuctions.length,
        });
      } catch (error) {
        console.error(`[ZappsAuction] Failed to get data for ${address}:`, error);
      }
    }

    return leaderboard.sort((a, b) => {
      if (b.auctionsWon !== a.auctionsWon) return b.auctionsWon - a.auctionsWon;
      return b.totalBids - a.totalBids;
    });
  }
}

export class ZappsAuctionReader {
  private provider: ethers.Provider;

  constructor(rpcUrl: string = 'https://ethereum-sepolia-rpc.publicnode.com') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  private getContract(): ethers.Contract {
    return new ethers.Contract(
      ZAPPS_ADDRESSES.AUCTION,
      ZappsAuctionABI.abi,
      this.provider
    );
  }

  async getAuction(auctionId: bigint): Promise<Auction | null> {
    try {
      const contract = this.getContract();
      const result = await contract.getAuction(auctionId);
      return {
        id: auctionId,
        seller: result[0],
        itemName: result[1],
        itemDescription: '',
        startingPrice: result[2],
        startTime: Number(result[3]),
        endTime: Number(result[4]),
        bidCount: Number(result[5]),
        finalized: result[6],
        cancelled: result[7],
        winner: result[8],
        winningBid: result[9],
      };
    } catch {
      return null;
    }
  }

  async getActiveAuctions(): Promise<bigint[]> {
    try {
      const contract = this.getContract();
      return await contract.getActiveAuctions();
    } catch {
      return [];
    }
  }

  async getAuctionCount(): Promise<bigint> {
    const contract = this.getContract();
    return await contract.auctionCount();
  }

  async getUserAuctions(userAddress: string): Promise<bigint[]> {
    try {
      const contract = this.getContract();
      return await contract.getUserAuctions(userAddress);
    } catch {
      return [];
    }
  }

  async getUserBidAuctions(userAddress: string): Promise<bigint[]> {
    try {
      const contract = this.getContract();
      return await contract.getUserBidAuctions(userAddress);
    } catch {
      return [];
    }
  }
}
