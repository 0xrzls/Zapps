import { NetworkType, WalletConfig } from './types';

export const NETWORK_CONFIGS: Record<NetworkType, WalletConfig> = {
  'sepolia': {
    network: 'sepolia',
    rpcUrl: import.meta.env.VITE_RPC_HTTPS || 'https://rpc.sepolia.org',
    chainId: '11155111',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeToken: 'ETH',
  },
  'base-sepolia': {
    network: 'base-sepolia',
    rpcUrl: import.meta.env.VITE_RPC_HTTPS || 'https://sepolia.base.org',
    chainId: '84532',
    explorerUrl: 'https://sepolia.basescan.org',
    nativeToken: 'ETH',
  },
};

export const DEFAULT_NETWORK: NetworkType = 
  (import.meta.env.VITE_NETWORK_TYPE as NetworkType) || 'sepolia';

export const getNetworkConfig = (network: NetworkType): WalletConfig => {
  return NETWORK_CONFIGS[network];
};

export const isEVMNetwork = (network: NetworkType): boolean => {
  return network === 'sepolia' || network === 'base-sepolia';
};

export const FEATURES = {
  EVM_ENABLED: import.meta.env.VITE_FEATURE_EVM !== 'false',
};