
import { ethers } from 'ethers';

type FhevmInstance = {
  createEncryptedInput: (contractAddress: string, userAddress: string) => any;
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (publicKey: string, contractAddresses: string[], startTimestamp: string | number, durationDays: string | number) => any;
  publicDecrypt: (handles: (string | Uint8Array)[]) => Promise<any>;
  userDecrypt: (handles: any[], privateKey: string, publicKey: string, signature: string, contractAddresses: string[], userAddress: string, startTimestamp: string | number, durationDays: string | number) => Promise<any>;
  getPublicKey: () => { publicKeyId: string; publicKey: Uint8Array } | null;
  getPublicParams: (bits: number) => { publicParams: Uint8Array; publicParamsId: string } | null;
};

function getRelayerSDK(): { 
  initSDK: () => Promise<boolean>; 
  createInstance: (config: any) => Promise<FhevmInstance>;
  SepoliaConfig: any;
} | null {
  const global = window as any;
  return global.relayerSDK || null;
}

const RELAYER_SDK_CDN_URL = 'https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs';

async function reloadRelayerSDK(): Promise<void> {
  console.log('[FHEVM] Reloading relayer SDK script...');
  
  const oldScripts = document.querySelectorAll('script[src*="relayer-sdk-js"]');
  oldScripts.forEach(script => {
    console.log('[FHEVM] Removing old script:', script.getAttribute('src'));
    script.remove();
  });
  
  const global = window as any;
  delete global.relayerSDK;
  
  sdkInitialized = false;
  sdkUsedForVote = false;
  cachedInstance = null;
  cachedInstanceAccount = null;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RELAYER_SDK_CDN_URL + '?t=' + Date.now(); 
    script.async = false;
    
    script.onload = () => {
      console.log('[FHEVM] Relayer SDK script reloaded successfully');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('[FHEVM] Failed to reload relayer SDK script:', error);
      reject(new Error('Failed to reload relayer SDK script'));
    };
    
    document.head.appendChild(script);
  });
}
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';

import ZappsVotingABI from './abis-json/ZappsVoting.json';
import ZappsTokenABI from './abis-json/ZappsToken.json';
import ZappsRewardsABI from './abis-json/ZappsRewards.json';
import ZappsRegistryABI from './abis-json/ZappsRegistry.json';
import ZappsAccessControllerABI from './abis-json/ZappsAccessController.json';
import ZappsReputationABI from './abis-json/ZappsReputation.json';
import ZappsSocialABI from './abis-json/ZappsSocial.json';
import ZappsDiscussionABI from './abis-json/ZappsDiscussion.json';
import ZappsGovernanceABI from './abis-json/ZappsGovernance.json';
import ZappsAuctionABI from './abis-json/ZappsAuction.json';

export const ZAPPS_ADDRESSES = {
  REGISTRY: '0x18C61e42D58960b2e043Ee3ba41931e294145f04',
  ACCESS_CONTROLLER: '0x69D2bCCAA9675Ab6Bde0305BE2Ab4fBC5473F175',
  TOKEN: '0x3CC72623493F3DED3007193f8dABdC37319fcD34',
  REPUTATION: '0xf420d433cbc66AAE7d2F606D1DFE9D14CE1F241b',
  VOTING: '0x753845153876736B50741EDFA584fF97fBECbd50',
  SOCIAL: '0x139f1ED9cE6d887cc5668F30c60a253583e19412',
  REWARDS: '0x02016fcCb33D5935707072fCd88AbC61fE4C94af',
  DISCUSSION: '0x9809E7642CBe888fa05847c3c84c7f9F18fF9EeE',
  GOVERNANCE: '0xb42494660AD8Dbac57A11aE3141d11f09F98972a',
  AUCTION: '0xd8Ba1cC72d720327340CdB0BEE582D6b58E0B958',
} as const;

export function uuidToBytes32(uuid: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(uuid));
}

export enum TargetType {
  DApp = 0,
  User = 1,
  Content = 2,
  Other = 3,
}

let sdkInitialized = false;

let sdkUsedForVote = false;

export function resetFHEVM(): void {
  console.log('[FHEVM] Full SDK reset requested');
  sdkInitialized = false;
  sdkUsedForVote = false;
  cachedInstance = null;
  cachedInstanceAccount = null;
}

export async function initializeFHEVM(forceFullReset: boolean = false): Promise<FhevmInstance> {
  
  if (forceFullReset) {
    console.log('[FHEVM] Force full reset - reloading SDK script...');
    await reloadRelayerSDK();
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const sdk = getRelayerSDK();
  if (!sdk) {
    throw new Error('Relayer SDK not loaded from CDN. Please ensure the script is loaded.');
  }

  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error('No Ethereum provider found. Please install MetaMask.');
  }
  
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet not connected. Please connect your wallet first.');
  }
  
  const currentAccount = accounts[0]?.toLowerCase();

  if (!sdkInitialized) {
    console.log('[FHEVM] Loading WASM via CDN SDK...');
    await sdk.initSDK();
    sdkInitialized = true;
    console.log('[FHEVM] WASM loaded successfully');
  }
  
  console.log('[FHEVM] Creating fresh instance for account:', currentAccount);
  
  const config = { 
    ...sdk.SepoliaConfig, 
    network: ethereum
  };
  
  const instance = await sdk.createInstance(config);
  
  console.log('[FHEVM] Fresh instance created successfully');
  
  return instance;
}

let cachedInstance: FhevmInstance | null = null;
let cachedInstanceAccount: string | null = null;

export async function getCachedFHEVM(): Promise<FhevmInstance> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error('No Ethereum provider found.');
  }
  
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  const currentAccount = accounts?.[0]?.toLowerCase();
  
  if (cachedInstance && cachedInstanceAccount === currentAccount) {
    console.log('[FHEVM] Using cached instance for read operation');
    return cachedInstance;
  }
  
  cachedInstance = await initializeFHEVM();
  cachedInstanceAccount = currentAccount;
  return cachedInstance;
}

export class ZappsVoting {
  private adapter: EVMWalletAdapter;
  private instance: FhevmInstance | null = null;
  private initialized = false;

  constructor(adapter: EVMWalletAdapter) {
    this.adapter = adapter;
  }

  async initialize(): Promise<void> {
    if (this.initialized && this.instance) {
      console.log('[ZappsVoting] Already initialized');
      return;
    }

    try {
      console.log('[ZappsVoting] Initializing FHEVM...');
      this.instance = await initializeFHEVM();
      
      if (!this.instance) {
        throw new Error('FHEVM instance is null after initialization');
      }
      
      if (typeof this.instance.createEncryptedInput !== 'function') {
        throw new Error('FHEVM instance missing createEncryptedInput method');
      }
      
      this.initialized = true;
      console.log('[ZappsVoting] FHEVM initialized successfully, instance methods:', 
        Object.keys(this.instance).filter(k => typeof (this.instance as any)[k] === 'function')
      );
    } catch (error) {
      console.error('[ZappsVoting] Failed to initialize FHEVM:', error);
      this.initialized = false;
      this.instance = null;
      throw error;
    }
  }

  private getVotingContract(): ethers.Contract {
    const signer = this.adapter.getSigner();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.VOTING,
      ZappsVotingABI.abi,
      signer
    );
  }

  private getTokenContract(): ethers.Contract {
    const signer = this.adapter.getSigner();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.TOKEN,
      ZappsTokenABI.abi,
      signer
    );
  }

  async getVotePrice(): Promise<bigint> {
    const contract = this.getVotingContract();
    return await contract.votePrice();
  }

  async getConfidentialBalance(address: string): Promise<string> {
    const tokenContract = this.getTokenContract();
    return await tokenContract.confidentialBalanceOf(address);
  }

  async getTargetData(dappId: string): Promise<{
    targetType: number;
    sum: number;
    count: number;
    average: bigint;
    totalVotes: bigint;
    uniqueVoters: bigint;
    lastUpdate: bigint;
  }> {
    const contract = this.getVotingContract();
    const targetId = uuidToBytes32(dappId);
    
    try {
      const result = await contract.getTargetData(targetId);
      return {
        targetType: result.targetType,
        sum: result.sum,
        count: result.count,
        average: result.average,
        totalVotes: result.totalVotes,
        uniqueVoters: result.uniqueVoters,
        lastUpdate: result.lastUpdate,
      };
    } catch (error: any) {
      
      const reason = error?.reason || error?.message || '';
      if (reason.includes('TargetNotExists') || error?.revert?.name === 'TargetNotExists') {
        console.log('[ZappsVoting] Target not initialized yet, returning zeros');
        return {
          targetType: 0,
          sum: 0,
          count: 0,
          average: 0n,
          totalVotes: 0n,
          uniqueVoters: 0n,
          lastUpdate: 0n,
        };
      }
      throw error;
    }
  }

  async getUserVoteInfo(dappId: string, userAddress: string): Promise<{
    voteCount: number;
    timestamps: bigint[];
    canVote: boolean;
  }> {
    const contract = this.getVotingContract();
    const targetId = uuidToBytes32(dappId);
    
    try {
      const result = await contract.getUserVoteInfo(targetId, userAddress);
      return {
        voteCount: result.voteCount,
        timestamps: result.timestamps,
        canVote: result.canVote,
      };
    } catch (error: any) {
      
      const reason = error?.reason || error?.message || '';
      if (reason.includes('TargetNotExists') || error?.revert?.name === 'TargetNotExists') {
        console.log('[ZappsVoting] Target not initialized, user can vote');
        return {
          voteCount: 0,
          timestamps: [],
          canVote: true,
        };
      }
      throw error;
    }
  }

  async getMaxVotesPerTarget(): Promise<number> {
    const contract = this.getVotingContract();
    return Number(await contract.MAX_VOTES_PER_TARGET());
  }

  async getRatingBounds(): Promise<{ min: number; max: number }> {
    const contract = this.getVotingContract();
    const [min, max] = await Promise.all([
      contract.MIN_RATING(),
      contract.MAX_RATING(),
    ]);
    return { min: Number(min), max: Number(max) };
  }

  async getAverageRating(dappId: string): Promise<bigint> {
    const contract = this.getVotingContract();
    const targetId = uuidToBytes32(dappId);
    return await contract.getAverageRating(targetId);
  }

  async vote(
    dappId: string,
    rating: number,
    targetType: TargetType = TargetType.DApp
  ): Promise<ethers.ContractTransactionResponse> {
    
    console.log('[ZappsVoting] Force reloading SDK before vote to ensure fresh instance...');
    this.instance = await initializeFHEVM(true); 
    this.initialized = true;
    
    if (!this.instance) {
      throw new Error('FHEVM instance is null. Initialization may have failed.');
    }
    
    if (typeof this.instance.createEncryptedInput !== 'function') {
      throw new Error('FHEVM instance is invalid - missing createEncryptedInput method');
    }

    const contract = this.getVotingContract();
    const targetId = uuidToBytes32(dappId);
    const rawAddress = this.adapter.getPublicKey();

    if (!rawAddress) {
      throw new Error('Wallet not connected');
    }

    const address = ethers.getAddress(rawAddress);
    const votingAddress = ethers.getAddress(ZAPPS_ADDRESSES.VOTING);

    console.log('[ZappsVoting] Submitting vote:', {
      targetId,
      rating,
      targetType,
      voter: address,
      contract: votingAddress,
      instanceType: typeof this.instance,
      hasCreateEncryptedInput: typeof this.instance.createEncryptedInput,
    });

    try {
      
      console.log('[ZappsVoting] Creating encrypted input...');
      const input = this.instance.createEncryptedInput(
        votingAddress,
        address
      );
      
      console.log('[ZappsVoting] Adding rating value:', rating);
      input.add8(rating);
      
      console.log('[ZappsVoting] Encrypting...');
      const encryptedInput = await input.encrypt();
      
      console.log('[ZappsVoting] Encrypted input ready:', {
        handle: encryptedInput.handles[0],
        proofLength: encryptedInput.inputProof?.length,
      });

      const tx = await contract.vote(
        targetId,
        targetType,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      console.log('[ZappsVoting] Vote transaction submitted:', tx.hash);
      
      sdkUsedForVote = true;
      
      return tx;
    } catch (error: any) {
      console.error('[ZappsVoting] Vote failed:', error);
      
      if (error?.message?.includes('expected instance of Le')) {
        console.log('[ZappsVoting] Instance error detected after full reset - SDK issue');
        this.initialized = false;
        this.instance = null;
        throw new Error('FHE encryption failed. Please refresh the page and try again.');
      }
      
      throw error;
    }
  }

  async getEncryptedData(dappId: string): Promise<{ encSum: string; encCount: string } | null> {
    const contract = this.getVotingContract();
    const targetId = uuidToBytes32(dappId);
    
    try {
      const result = await contract.getEncryptedData(targetId);
      
      const encSum = result[0];
      const encCount = result[1];
      
      if (encSum === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
          encCount === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('[ZappsVoting] No encrypted data available for target');
        return null;
      }
      
      return { encSum, encCount };
    } catch (error: any) {
      const reason = error?.reason || error?.message || '';
      if (reason.includes('TargetNotExists') || error?.revert?.name === 'TargetNotExists') {
        console.log('[ZappsVoting] Target not exists, no encrypted data');
        return null;
      }
      throw error;
    }
  }

  async publicDecryptRating(dappId: string, retryCount = 0): Promise<{ sum: number; count: number; average: number } | null> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 5000;
    
    console.log('[ZappsVoting] publicDecryptRating starting for dappId:', dappId, 'retry:', retryCount);

    console.log('[ZappsVoting] Fetching encrypted handles from contract...');
    const encData = await this.getEncryptedData(dappId);
    if (!encData) {
      console.log('[ZappsVoting] No encrypted data to decrypt (target may not exist or has no votes)');
      return null;
    }

    const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    if (encData.encSum === zeroHash || encData.encCount === zeroHash) {
      console.log('[ZappsVoting] Encrypted handles are zero - no data to decrypt');
      return null;
    }

    console.log('[ZappsVoting] Got encrypted handles:', {
      encSum: encData.encSum,
      encCount: encData.encCount,
    });

    try {
      
      console.log('[ZappsVoting] Getting Relayer SDK from window...');
      let sdk = getRelayerSDK();
      
      if (!sdk) {
        console.log('[ZappsVoting] SDK not loaded, waiting 2s...');
        await new Promise(r => setTimeout(r, 2000));
        sdk = getRelayerSDK();
        
        if (!sdk) {
          console.error('[ZappsVoting] Relayer SDK still not available');
          return null;
        }
      }

      console.log('[ZappsVoting] Initializing SDK...');
      await sdk.initSDK();
      console.log('[ZappsVoting] SDK initialized');

      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        console.error('[ZappsVoting] No ethereum provider');
        return null;
      }

      console.log('[ZappsVoting] Creating fresh FHEVM instance...');
      const config = { ...sdk.SepoliaConfig, network: ethereum };
      const freshInstance = await sdk.createInstance(config);
      console.log('[ZappsVoting] Fresh instance created');

      if (typeof freshInstance.publicDecrypt !== 'function') {
        console.error('[ZappsVoting] publicDecrypt not available on fresh instance');
        return null;
      }

      console.log('[ZappsVoting] Calling publicDecrypt on Zama Gateway...');
      const startTime = Date.now();
      
      const result = await freshInstance.publicDecrypt([encData.encSum, encData.encCount]);
      
      const elapsed = Date.now() - startTime;
      console.log(`[ZappsVoting] publicDecrypt completed in ${elapsed}ms`);
      console.log('[ZappsVoting] Result:', JSON.stringify(result, (_, v) => typeof v === 'bigint' ? v.toString() : v));

      if (!result || !result.clearValues) {
        console.error('[ZappsVoting] Invalid result structure from publicDecrypt');
        console.log('[ZappsVoting] Result keys:', Object.keys(result || {}));
        return null;
      }

      const sumValue = result.clearValues[encData.encSum];
      const countValue = result.clearValues[encData.encCount];
      
      console.log('[ZappsVoting] Decrypted values - sum:', sumValue, 'count:', countValue);
      
      const sum = Number(sumValue || 0);
      const count = Number(countValue || 0);
      const average = count > 0 ? sum / count : 0;
      
      console.log('[ZappsVoting] Final decrypted rating:', { sum, count, average });
      
      return { sum, count, average };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error('[ZappsVoting] publicDecrypt failed:', errorMsg);
      
      if (errorMsg.includes('rate') || errorMsg.includes('limit') || errorMsg.includes('429')) {
        console.log('[ZappsVoting] Rate limit detected!');
        
        if (retryCount < MAX_RETRIES) {
          console.log(`[ZappsVoting] Retrying in ${RETRY_DELAY_MS/1000}s... (${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return this.publicDecryptRating(dappId, retryCount + 1);
        }
      }
      
      return null;
    }
  }

  async requestDecryption(dappId: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getVotingContract();
    const targetId = uuidToBytes32(dappId);
    
    console.log('[ZappsVoting] Requesting decryption for:', targetId);
    return await contract.requestDecryptionData(targetId);
  }

  async isPaused(): Promise<boolean> {
    const contract = this.getVotingContract();
    return await contract.paused();
  }

  async getOwner(): Promise<string> {
    const contract = this.getVotingContract();
    return await contract.owner();
  }
}

export class ZappsToken {
  private adapter: EVMWalletAdapter;
  private instance: FhevmInstance | null = null;
  private initialized = false;

  constructor(adapter: EVMWalletAdapter) {
    this.adapter = adapter;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('[ZappsToken] Initializing FHEVM...');
      this.instance = await initializeFHEVM();
      this.initialized = true;
      console.log('[ZappsToken] FHEVM initialized');
    } catch (error) {
      console.error('[ZappsToken] Failed to initialize FHEVM:', error);
      throw error;
    }
  }

  private getContract(): ethers.Contract {
    const signer = this.adapter.getSigner();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.TOKEN,
      ZappsTokenABI.abi,
      signer
    );
  }

  async getConfidentialBalanceHandle(address: string): Promise<string> {
    const contract = this.getContract();
    return await contract.confidentialBalanceOf(address);
  }

  async decryptBalance(address: string, retryCount = 0): Promise<bigint> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 5000; 
    
    if (!this.instance) {
      throw new Error('FHEVM not initialized. Call initialize() first.');
    }

    const checksummedAddress = ethers.getAddress(address);
    const checksummedTokenAddress = ethers.getAddress(ZAPPS_ADDRESSES.TOKEN);

    console.log('[ZappsToken] decryptBalance starting...', {
      user: checksummedAddress,
      token: checksummedTokenAddress,
      retryCount,
    });

    const contract = this.getContract();
    let balanceHandle: string;
    
    try {
      balanceHandle = await contract.confidentialBalanceOf(checksummedAddress);
    } catch (err) {
      console.error('[ZappsToken] Failed to get balance handle:', err);
      throw new Error('Failed to fetch encrypted balance from contract');
    }
    
    if (balanceHandle === ethers.ZeroHash || balanceHandle === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.log('[ZappsToken] No balance handle - returning 0');
      return 0n;
    }

    console.log('[ZappsToken] Got balance handle:', balanceHandle);

    const keypair = this.instance.generateKeypair();
    console.log('[ZappsToken] Generated keypair, publicKey length:', keypair.publicKey.length);
    
    const handleContractPairs = [
      {
        handle: balanceHandle,
        contractAddress: checksummedTokenAddress,
      },
    ];

    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = "10";
    const contractAddresses = [checksummedTokenAddress];

    console.log('[ZappsToken] Creating EIP-712 message...');
    const eip712 = this.instance.createEIP712(
      keypair.publicKey, 
      contractAddresses, 
      startTimeStamp, 
      durationDays
    );

    console.log('[ZappsToken] Requesting wallet signature for balance decryption...');

    const signer = this.adapter.getSigner();
    let signature: string;
    
    try {
      signature = await signer.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message
      );
    } catch (err: any) {
      console.error('[ZappsToken] User rejected signature or error:', err);
      throw new Error(err?.message?.includes('rejected') ? 'Signature rejected by user' : 'Failed to sign decryption request');
    }

    console.log('[ZappsToken] Signature obtained, calling userDecrypt to Zama Gateway...');

    try {
      
      const result = await this.instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        checksummedAddress,
        startTimeStamp,
        durationDays
      );

      console.log('[ZappsToken] userDecrypt result:', result);
      console.log('[ZappsToken] Result keys:', Object.keys(result));
      
      const decryptedBalance = result[balanceHandle];
      if (decryptedBalance === undefined) {
        console.error('[ZappsToken] Balance not found in result! Available keys:', Object.keys(result));
        throw new Error('Decryption returned no value for balance handle');
      }
      
      console.log('[ZappsToken] Decrypted balance:', decryptedBalance, 'type:', typeof decryptedBalance);
      
      return BigInt(decryptedBalance);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.error('[ZappsToken] userDecrypt failed:', errorMsg);
      
      if (errorMsg.includes('rate') || errorMsg.includes('limit') || errorMsg.includes('429') || errorMsg.includes('too many')) {
        console.log('[ZappsToken] Rate limit detected!');
        
        if (retryCount < MAX_RETRIES) {
          console.log(`[ZappsToken] Retrying in ${RETRY_DELAY_MS/1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return this.decryptBalance(address, retryCount + 1);
        }
        
        throw new Error(`Rate limited by Zama Gateway. Please try again in a few minutes.`);
      }
      
      throw new Error(`Decryption failed: ${errorMsg}`);
    }
  }

  async requestBalanceDecryption(address: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    console.log('[ZappsToken] Requesting balance decryption for:', address);
    return await contract.requestBalanceDisclosure(address);
  }

  async getDecryptedBalance(address: string): Promise<bigint | null> {
    const contract = this.getContract();
    try {
      
      const disclosedBalance = await contract.disclosedBalances(address);
      if (disclosedBalance > 0n) {
        return disclosedBalance;
      }
      return null;
    } catch {
      return null;
    }
  }

  async hasPendingDecryption(address: string): Promise<boolean> {
    const contract = this.getContract();
    try {
      return await contract.pendingDecryption(address);
    } catch {
      return false;
    }
  }

  async getTotalSupplyCap(): Promise<bigint> {
    const contract = this.getContract();
    return await contract.TOTAL_SUPPLY_CAP();
  }

  async getConfidentialTotalSupply(): Promise<string> {
    const contract = this.getContract();
    return await contract.confidentialTotalSupply();
  }

  async getDecimals(): Promise<number> {
    const contract = this.getContract();
    return Number(await contract.decimals());
  }

  async getName(): Promise<string> {
    const contract = this.getContract();
    return await contract.name();
  }

  async getSymbol(): Promise<string> {
    const contract = this.getContract();
    return await contract.symbol();
  }

  async isAuthorizedMinter(address: string): Promise<boolean> {
    const contract = this.getContract();
    return await contract.authorizedMinters(address);
  }
}

export async function createZappsVotingInstance(
  adapter: EVMWalletAdapter
): Promise<ZappsVoting> {
  const voting = new ZappsVoting(adapter);
  await voting.initialize();
  return voting;
}

export const ZAPPS_ABIS = {
  Voting: ZappsVotingABI.abi,
  Token: ZappsTokenABI.abi,
  Rewards: ZappsRewardsABI.abi,
  Registry: ZappsRegistryABI.abi,
  AccessController: ZappsAccessControllerABI.abi,
  Reputation: ZappsReputationABI.abi,
  Social: ZappsSocialABI.abi,
  Discussion: ZappsDiscussionABI.abi,
  Governance: ZappsGovernanceABI.abi,
  Auction: ZappsAuctionABI.abi,
};
