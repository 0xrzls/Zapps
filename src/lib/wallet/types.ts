export type NetworkType = 'sepolia' | 'base-sepolia';
export type WalletType = 'metamask' | 'walletconnect';

export interface WalletConfig {
  network: NetworkType;
  rpcUrl: string;
  chainId?: string;
  explorerUrl?: string;
  nativeToken: string;
}

export interface WalletAdapter {
  type: WalletType;
  network: NetworkType;
  
  connect(): Promise<string>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  getPublicKey(): string | null;
  getBalance(): Promise<number>;
  
  signMessage(message: Uint8Array | string): Promise<Uint8Array>;
  signTransaction(transaction: any): Promise<any>;
  sendTransaction(transaction: any): Promise<string>;
  
  onAccountChange(callback: (address: string | null) => void): () => void;
  onDisconnect(callback: () => void): () => void;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  walletType: WalletType | null;
  network: NetworkType;
  balance: number;
}

export interface WalletContextType extends WalletState {
  publicKey: string | null;
  connectWallet: (type: WalletType) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (network: NetworkType) => Promise<void>;
  signMessage: (message: string) => Promise<Uint8Array | null>;
  sendTransaction: (transaction: any) => Promise<string | null>;
  showWalletModal: boolean;
  setShowWalletModal: (show: boolean) => void;
  openClaimReferralModal?: () => void;
}