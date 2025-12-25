
import { ethers } from 'ethers';
import { getContractAddresses, getDefaultContractAddresses } from './addresses';
import type { NetworkType } from '../wallet/types';
import RewardManagerABI from './abis-json/RewardManager_2-2.json';

const resolveRewardManagerAddress = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
): Promise<string> => {
  const configured = await getContractAddresses(network);
  let addr = configured.REWARD_MANAGER;

  try {
    const code = await provider.getCode(addr);
    if (!code || code === '0x') {
      throw new Error('No contract code at configured REWARD_MANAGER');
    }
    
    const testContract = new ethers.Contract(addr, RewardManagerABI.abi, provider);
    await testContract.decReferrerReward();
    return addr;
  } catch (e) {
    
    const def = getDefaultContractAddresses(network).REWARD_MANAGER;
    if (def && def.toLowerCase() !== addr.toLowerCase()) {
      const defCode = await provider.getCode(def);
      if (defCode && defCode !== '0x') {
        try {
          const testDefault = new ethers.Contract(def, RewardManagerABI.abi, provider);
          await testDefault.decReferrerReward();
          console.warn('Using default REWARD_MANAGER address due to misconfiguration:', def);
          return def;
        } catch (_e) {
          
        }
      }
    }
    return addr;
  }
};

export interface DailyLoginInfo {
  lastClaimTime: bigint;
  streakCount: number;
  totalClaimed: number;
  canClaim: boolean;
  decryptionPending: boolean;
  pendingRequestId: bigint;
}

export interface ReferralInfo {
  referrer: string;
  referralCount: number;
  totalEarned: number;
  hasUsedReferral: boolean;
  hasReachedLimit: boolean;
  decryptionPending: boolean;
  pendingRequestId: bigint;
}

export const getRewardManagerContract = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
) => {
  const signer = await provider.getSigner();
  const resolved = await resolveRewardManagerAddress(provider, network);
  return new ethers.Contract(resolved, RewardManagerABI.abi, signer);
};

const getRewardManagerContractReadOnly = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
) => {
  const resolved = await resolveRewardManagerAddress(provider, network);
  return new ethers.Contract(resolved, RewardManagerABI.abi, provider);
};

export const claimDailyLogin = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.claimDailyLogin();
  return tx;
};

export const getMyDailyLoginInfo = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  userAddress: string
): Promise<DailyLoginInfo> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  const result = await contract.getMyDailyLoginInfo(userAddress);
  
  return {
    lastClaimTime: result[0],
    streakCount: Number(result[1]),
    totalClaimed: Number(result[2]),
    canClaim: result[3],
    decryptionPending: result[4],
    pendingRequestId: result[5],
  };
};

export const registerReferral = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  referrerAddress: string
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.registerReferral(referrerAddress);
  return tx;
};

export const getMyReferralInfo = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  userAddress: string
): Promise<ReferralInfo> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  const result = await contract.getMyReferralInfo(userAddress);
  
  return {
    referrer: result[0],
    referralCount: Number(result[1]),
    totalEarned: Number(result[2]),
    hasUsedReferral: result[3],
    hasReachedLimit: result[4],
    decryptionPending: result[5],
    pendingRequestId: result[6],
  };
};

export const getDailyLoginReward = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
): Promise<bigint> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  return await contract.dailyLoginReward();
};

export const getReferralRewards = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
): Promise<{ referrerReward: number; referredReward: number }> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  const [referrerReward, referredReward] = await Promise.all([
    contract.decReferrerReward(),
    contract.decReferredReward(),
  ]);
  
  return {
    referrerReward: Number(referrerReward),
    referredReward: Number(referredReward),
  };
};

export const getMaxReferrals = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
): Promise<number> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  const maxRefs = await contract.MAX_REFERRALS();
  return Number(maxRefs);
};

export const requestMyDailyLoginDecryption = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.requestMyDailyLoginDecryption();
  return tx;
};

export const requestMyReferralDecryption = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.requestMyReferralDecryption();
  return tx;
};

export const verifySetup = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
): Promise<{
  zvpConfigured: boolean;
  ecosystemConfigured: boolean;
  nftConfigured: boolean;
  discordConfigured: boolean;
  allReady: boolean;
}> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  const result = await contract.verifySetup();
  
  return {
    zvpConfigured: result[0],
    ecosystemConfigured: result[1],
    nftConfigured: result[2],
    discordConfigured: result[3],
    allReady: result[4],
  };
};

export const completeTask = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  campaignId: number,
  taskId: number
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.completeTask(campaignId, taskId);
  return tx;
};

export const hasCompletedTask = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  campaignId: number,
  userAddress: string
): Promise<boolean> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  return await contract.hasUserClaimedReward(campaignId, userAddress);
};

export const createCampaign = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  name: string,
  startTime: number,
  endTime: number,
  taskType: number, 
  requiredTaskCount: number
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.createCampaign(name, startTime, endTime, taskType, requiredTaskCount);
  return tx;
};

export const addTaskToCampaign = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  campaignId: number,
  taskName: string,
  description: string,
  rewardAmount: bigint,
  isRequired: boolean
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.addTaskToCampaign(campaignId, taskName, description, rewardAmount, isRequired);
  return tx;
};

export const addRewardToCampaign = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  campaignId: number,
  rewardType: number, 
  amount: bigint,
  nftId: number,
  tokenAddress: string,
  isSoulbound: boolean
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.addRewardToCampaign(campaignId, rewardType, amount, nftId, tokenAddress, isSoulbound);
  return tx;
};

export const claimQuestReward = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  campaignId: number
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.claimQuestReward(campaignId);
  return tx;
};

export const getCampaignInfo = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  campaignId: number
): Promise<{
  name: string;
  startTime: number;
  endTime: number;
  taskType: number;
  requiredTaskCount: number;
  totalParticipants: number;
  taskCount: number;
  rewardCount: number;
  isActive: boolean;
}> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  const result = await contract.getCampaignInfo(campaignId);
  
  return {
    name: result[0],
    startTime: Number(result[1]),
    endTime: Number(result[2]),
    taskType: Number(result[3]),
    requiredTaskCount: Number(result[4]),
    totalParticipants: Number(result[5]),
    taskCount: Number(result[6]),
    rewardCount: Number(result[7]),
    isActive: result[8],
  };
};

export const getCampaignTask = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  campaignId: number,
  taskId: number
): Promise<{
  taskName: string;
  description: string;
  rewardAmount: bigint;
  isRequired: boolean;
  isActive: boolean;
}> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  const result = await contract.getCampaignTask(campaignId, taskId);
  
  return {
    taskName: result[0],
    description: result[1],
    rewardAmount: result[2],
    isRequired: result[3],
    isActive: result[4],
  };
};

export const getCampaignReward = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  campaignId: number,
  rewardId: number
): Promise<{
  rewardType: number;
  amount: bigint;
  nftId: number;
  tokenAddress: string;
  isSoulbound: boolean;
}> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  const result = await contract.getCampaignReward(campaignId, rewardId);
  
  return {
    rewardType: Number(result[0]),
    amount: result[1],
    nftId: Number(result[2]),
    tokenAddress: result[3],
    isSoulbound: result[4],
  };
};

export const getMyCampaigns = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  userAddress: string
): Promise<number[]> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  const result = await contract.getMyCampaigns(userAddress);
  return result.map((id: bigint) => Number(id));
};

export const setDailyLoginReward = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  newReward: bigint
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.setDailyLoginReward(newReward);
  return tx;
};

export const setReferralRewards = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  referrerReward: number,
  referredReward: number
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.setReferralRewards(referrerReward, referredReward);
  return tx;
};

export const setCampaignPaused = async (
  provider: ethers.BrowserProvider,
  network: NetworkType,
  paused: boolean
) => {
  const contract = await getRewardManagerContract(provider, network);
  const tx = await contract.setCampaignPaused(paused);
  return tx;
};

export const getNextCampaignId = async (
  provider: ethers.BrowserProvider,
  network: NetworkType
): Promise<number> => {
  const contract = await getRewardManagerContractReadOnly(provider, network);
  const nextId = await contract.nextCampaignId();
  return Number(nextId);
};
