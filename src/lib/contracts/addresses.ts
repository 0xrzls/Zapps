import { backend } from '@/services';
import type { NetworkType } from '../wallet/types';

export interface ContractAddresses {
  ZVP_TOKEN: string;
  VOTE_MANAGER: string;
  REWARD_MANAGER: string;
}

const CONTRACT_ADDRESSES: Record<NetworkType, ContractAddresses> = {
  'sepolia': {
    ZVP_TOKEN: '0xc418c3FA5D0aDa1425e4F67C665Abe5aB61FCFA4',
    VOTE_MANAGER: '0x032094C13B091097418A2324673c6A083ae643A0',
    REWARD_MANAGER: '0x4Ba2513f193D72a750810Bd29B0F5f181512630A',
  },
  'base-sepolia': {
    ZVP_TOKEN: '0xfca53548e81bfde8c46ccb7857bd798862426c41',
    VOTE_MANAGER: '0x4ff1f333c36b23a08102fc54e0bdbed4d0fe342b',
    REWARD_MANAGER: '0x0000000000000000000000000000000000000000',
  },
};

export const getContractAddresses = async (network: NetworkType): Promise<ContractAddresses> => {
  try {
    const configKey = network === 'sepolia' ? 'contracts_sepolia' : 'contracts_base_sepolia';
    const { data } = await backend.appConfig.get(configKey);
    
    if (data?.value?.zvp && data?.value?.voteManager) {
      return {
        ZVP_TOKEN: data.value.zvp,
        VOTE_MANAGER: data.value.voteManager,
        REWARD_MANAGER: data.value.rewardManager || CONTRACT_ADDRESSES[network].REWARD_MANAGER,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch contract addresses from database:', error);
  }
  
  return CONTRACT_ADDRESSES[network];
};

export const getDefaultContractAddresses = (network: NetworkType): ContractAddresses => {
  return CONTRACT_ADDRESSES[network];
};