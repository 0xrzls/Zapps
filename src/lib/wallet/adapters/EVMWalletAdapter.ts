import { WalletAdapter, NetworkType, WalletType } from '../types';
import { getNetworkConfig } from '../config';
import { ethers } from 'ethers';

export class EVMWalletAdapter implements WalletAdapter {
  type: WalletType;
  network: NetworkType;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private connected: boolean = false;
  private address: string | null = null;
  private ethereum: any = null;

  constructor(type: WalletType, network: NetworkType) {
    this.type = type;
    this.network = network;
  }

  async connect(): Promise<string> {
    const config = getNetworkConfig(this.network);

    if (this.type === 'metamask') {
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        throw new Error('MetaMask wallet not found. Please install MetaMask extension.');
      }

      if (!ethereum.isMetaMask) {
        throw new Error('Invalid MetaMask provider');
      }

      try {
        this.ethereum = ethereum;
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        this.address = accounts[0];
        await this.switchNetwork();
        this.provider = new ethers.BrowserProvider(ethereum);
        this.signer = await this.provider.getSigner();
        this.connected = true;
        return this.address;
      } catch (error: any) {
        console.error('Failed to connect MetaMask:', error);
        throw new Error(error.message || 'Failed to connect MetaMask wallet');
      }
    }

    if (this.type === 'walletconnect') {
      try {
        const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
        
        const provider = await EthereumProvider.init({
          projectId: '5718da88819c6d550d82153551e49a2d',
          chains: [parseInt(config.chainId || '1')],
          showQrModal: true,
          rpcMap: {
            [parseInt(config.chainId || '1')]: config.rpcUrl,
          },
        });

        await provider.connect();
        
        this.ethereum = provider;
        this.address = provider.accounts[0];
        this.provider = new ethers.BrowserProvider(provider as any);
        this.signer = await this.provider.getSigner();
        this.connected = true;
        
        return this.address;
      } catch (error: any) {
        console.error('Failed to connect WalletConnect:', error);
        throw new Error(error.message || 'Failed to connect WalletConnect');
      }
    }

    throw new Error(`Wallet type ${this.type} not implemented for EVM yet`);
  }

  private async switchNetwork(): Promise<void> {
    if (!this.ethereum) return;

    const config = getNetworkConfig(this.network);
    const chainIdHex = '0x' + parseInt(config.chainId || '1').toString(16);

    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await this.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: this.getChainName(),
                nativeCurrency: {
                  name: config.nativeToken,
                  symbol: config.nativeToken,
                  decimals: 18,
                },
                rpcUrls: [config.rpcUrl],
                blockExplorerUrls: [config.explorerUrl],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add network to wallet');
        }
      } else {
        throw switchError;
      }
    }
  }

  private getChainName(): string {
    switch (this.network) {
      case 'sepolia':
        return 'Sepolia Testnet';
      case 'base-sepolia':
        return 'Base Sepolia Testnet';
      default:
        return 'Unknown Network';
    }
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.connected = false;
    this.address = null;
    this.ethereum = null;
  }

  isConnected(): boolean {
    return this.connected && this.address !== null;
  }

  getPublicKey(): string | null {
    return this.address;
  }

  async getBalance(): Promise<number> {
    if (!this.provider || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.provider.getBalance(this.address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  async signMessage(message: Uint8Array | string): Promise<Uint8Array> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const messageString = typeof message === 'string' 
        ? message 
        : ethers.hexlify(message);
      
      const signature = await this.signer.signMessage(messageString);
      return ethers.getBytes(signature);
    } catch (error: any) {
      console.error('Failed to sign message:', error);
      throw new Error(error.message || 'Failed to sign message');
    }
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      return await this.signer.signTransaction(transaction);
    } catch (error: any) {
      console.error('Failed to sign transaction:', error);
      throw new Error(error.message || 'Failed to sign transaction');
    }
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.signer.sendTransaction(transaction);
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Failed to send transaction:', error);
      throw new Error(error.message || 'Failed to send transaction');
    }
  }

  onAccountChange(callback: (address: string | null) => void): () => void {
    if (!this.ethereum) {
      return () => {};
    }

    const handler = (accounts: string[]) => {
      this.address = accounts[0] || null;
      callback(this.address);
    };

    this.ethereum.on('accountsChanged', handler);

    return () => {
      this.ethereum?.removeListener('accountsChanged', handler);
    };
  }

  onDisconnect(callback: () => void): () => void {
    if (!this.ethereum) {
      return () => {};
    }

    const handler = () => {
      this.connected = false;
      this.address = null;
      callback();
    };

    this.ethereum.on('disconnect', handler);

    return () => {
      this.ethereum?.removeListener('disconnect', handler);
    };
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }
}