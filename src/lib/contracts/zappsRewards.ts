
import { ethers } from 'ethers';
import type { NetworkType } from '../wallet/types';
import ZappsRewardsABI from './abis-json/ZappsRewards.json';

export const ZAPPS_REWARDS_ADDRESS = '0x02016fcCb33D5935707072fCd88AbC61fE4C94af';

export interface DailyLoginInfo {
  lastLogin: bigint;
  lastClaimTime: bigint;  
  referrer: string;
  canClaim: boolean;
  
  streakCount?: number;
  totalClaimed?: number;
  decryptionPending?: boolean;
}

export interface QuestInfo {
  name: string;
  rewardAmount: bigint;
  endTime: bigint;
  isActive: boolean;
  completions: bigint;
  maxCompletions: bigint;
}

export interface AchievementInfo {
  name: string;
  rewardAmount: bigint;
  reputationBonus: number;
  isSecret: boolean;
}

export class ZappsRewards {
  private contract: ethers.Contract;
  private provider: ethers.BrowserProvider;
  private signer: ethers.Signer | null = null;

  constructor(provider: ethers.BrowserProvider, address?: string) {
    this.provider = provider;
    const contractAddress = address || ZAPPS_REWARDS_ADDRESS;
    this.contract = new ethers.Contract(contractAddress, ZappsRewardsABI.abi, provider);
  }

  async connect(): Promise<void> {
    this.signer = await this.provider.getSigner();
    this.contract = this.contract.connect(this.signer) as ethers.Contract;
  }

  async getDailyLoginInfo(userAddress: string): Promise<DailyLoginInfo> {
    const result = await this.contract.getDailyLoginInfo(userAddress);
    return {
      lastLogin: result[0],
      lastClaimTime: result[0], 
      referrer: result[1],
      canClaim: result[2],
      streakCount: 0, 
      totalClaimed: 0, 
      decryptionPending: false,
    };
  }

  async getDailyReward(): Promise<bigint> {
    return await this.contract.dailyReward();
  }

  async getStreakBonusMultiplier(): Promise<bigint> {
    return await this.contract.streakBonusMultiplier();
  }

  async getReferrerReward(): Promise<bigint> {
    return await this.contract.referrerReward();
  }

  async getReferredReward(): Promise<bigint> {
    return await this.contract.referredReward();
  }

  async getMaxReferrals(): Promise<number> {
    const result = await this.contract.MAX_REFERRALS();
    return Number(result);
  }

  async getQuestInfo(questId: string): Promise<QuestInfo> {
    const result = await this.contract.getQuestInfo(questId);
    return {
      name: result[0],
      rewardAmount: result[1],
      endTime: result[2],
      isActive: result[3],
      completions: result[4],
      maxCompletions: result[5],
    };
  }

  async hasCompletedQuest(userAddress: string, questId: string): Promise<boolean> {
    return await this.contract.hasCompletedQuest(userAddress, questId);
  }

  async getAchievementInfo(achievementId: string): Promise<AchievementInfo> {
    const result = await this.contract.achievements(achievementId);
    return {
      name: result[0],
      rewardAmount: result[1],
      reputationBonus: Number(result[2]),
      isSecret: result[3],
    };
  }

  async hasUnlockedAchievement(userAddress: string, achievementId: string): Promise<boolean> {
    return await this.contract.hasUnlockedAchievement(userAddress, achievementId);
  }

  async getEncryptedEarnings(userAddress: string): Promise<string> {
    return await this.contract.getEncryptedEarnings(userAddress);
  }

  async getEncryptedLoginStreak(userAddress: string): Promise<string> {
    return await this.contract.getEncryptedLoginStreak(userAddress);
  }

  async getEncryptedDailyEarned(userAddress: string): Promise<string> {
    return await this.contract.getEncryptedDailyEarned(userAddress);
  }

  async getEncryptedReferralCount(userAddress: string): Promise<string> {
    return await this.contract.getEncryptedReferralCount(userAddress);
  }

  async getEncryptedReferralEarned(userAddress: string): Promise<string> {
    return await this.contract.getEncryptedReferralEarned(userAddress);
  }

  async getEncryptedQuestEarned(userAddress: string): Promise<string> {
    return await this.contract.getEncryptedQuestEarned(userAddress);
  }

  async getEncryptedContentEarned(userAddress: string): Promise<string> {
    return await this.contract.getEncryptedContentEarned(userAddress);
  }

  async claimDailyReward(): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.claimDailyReward();
  }

  async registerReferral(referrerAddress: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.registerReferral(referrerAddress);
  }

  async completeQuest(userAddress: string, questId: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.completeQuest(userAddress, questId);
  }

  async createQuest(
    questId: string,
    name: string,
    description: string,
    rewardAmount: bigint,
    reputationPoints: number,
    duration: bigint,
    maxCompletions: bigint
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.createQuest(
      questId,
      name,
      description,
      rewardAmount,
      reputationPoints,
      duration,
      maxCompletions
    );
  }

  async deactivateQuest(questId: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.deactivateQuest(questId);
  }

  async createAchievement(
    achievementId: string,
    name: string,
    rewardAmount: bigint,
    reputationBonus: number,
    isSecret: boolean
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.createAchievement(
      achievementId,
      name,
      rewardAmount,
      reputationBonus,
      isSecret
    );
  }

  async unlockAchievement(userAddress: string, achievementId: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.unlockAchievement(userAddress, achievementId);
  }

  async rewardContent(creatorAddress: string, amount: bigint): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.rewardContent(creatorAddress, amount);
  }

  async setDailyReward(amount: bigint): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.setDailyReward(amount);
  }

  async setReferralRewards(referrerReward: bigint, referredReward: bigint): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.setReferralRewards(referrerReward, referredReward);
  }

  async setStreakBonusMultiplier(multiplier: bigint): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) await this.connect();
    return await this.contract.setStreakBonusMultiplier(multiplier);
  }

  async getOwner(): Promise<string> {
    return await this.contract.owner();
  }

  async getZappsToken(): Promise<string> {
    return await this.contract.zappsToken();
  }

  async getZappsReputation(): Promise<string> {
    return await this.contract.zappsReputation();
  }
}

export const getZappsRewardsContract = async (
  provider: ethers.BrowserProvider,
  network?: NetworkType
): Promise<ZappsRewards> => {
  const rewards = new ZappsRewards(provider);
  await rewards.connect();
  return rewards;
};

export const createQuestId = (name: string): string => {
  return ethers.keccak256(ethers.toUtf8Bytes(name));
};

export const createAchievementId = (name: string): string => {
  return ethers.keccak256(ethers.toUtf8Bytes(name));
};
