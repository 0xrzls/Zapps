import { WalletAdapter, WalletType, NetworkType } from './types';
import { EVMWalletAdapter } from './adapters/EVMWalletAdapter';
import { isEVMNetwork, FEATURES } from './config';

export class WalletFactory {
  static create(walletType: WalletType, network: NetworkType): WalletAdapter {
    if (!FEATURES.EVM_ENABLED) {
      throw new Error('EVM network support is not enabled.');
    }

    if (walletType === 'metamask' || walletType === 'walletconnect') {
      return new EVMWalletAdapter(walletType, network);
    }

    throw new Error(`Wallet type ${walletType} not supported`);
  }

  static isWalletAvailable(walletType: WalletType, network?: NetworkType): boolean {
    switch (walletType) {
      case 'metamask':
        return !!(window as any).ethereum?.isMetaMask;
      case 'walletconnect':
        return true;
      default:
        return false;
    }
  }

  static getAvailableWallets(network: NetworkType): WalletType[] {
    const wallets: WalletType[] = [];

    if (FEATURES.EVM_ENABLED) {
      if (this.isWalletAvailable('metamask', network)) wallets.push('metamask');
      wallets.push('walletconnect');
    }

    return wallets;
  }
}