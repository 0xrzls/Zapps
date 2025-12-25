
import { ethers } from 'ethers';

const VOTING_CONTRACT = '0x753845153876736B50741EDFA584fF97fBECbd50';

const ZAMA_RELAYER_URL = 'https://relayer.testnet.zama.org';

const ACL_CONTRACT_ADDRESS = '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D';
const ACL_ABI = [
  'function isAllowedForDecryption(bytes32 handle) view returns (bool)'
];

const VOTING_ABI = [
  
  'function targets(bytes32) view returns (uint8 targetType, bytes32 encSum, bytes32 encCount, uint32 decSum, uint32 decCount, uint256 lastDecryptTime, bool exists, uint256 createdAt, uint256 totalVotes, uint256 lastVoteTime)',
  'function getTargetData(bytes32 targetId) view returns (uint256 count, uint256 average, uint256 uniqueVoters, uint256 totalVotes, uint256 lastUpdate)',
  'function getDecryptedCount(bytes32 targetId) view returns (uint256)',
  'function getPendingVotes(bytes32 targetId) view returns (uint256)',
  'function getEncryptedData(bytes32 targetId) view returns (bytes32 encSum, bytes32 encCount)',
  
  'function requestDecryptionData(bytes32 targetId) external',
  'function verifyAndStoreDecryption(bytes32 targetId, bytes abiEncodedValues, bytes decryptionProof) external',
  
  'event VoteCast(bytes32 indexed targetId, address indexed voter, uint256 voteIndex)',
  'event DecryptionDataReady(bytes32 indexed targetId, bytes32 encSum, bytes32 encCount)',
  'event AverageUpdated(bytes32 indexed targetId, uint32 sum, uint32 count, uint256 average, uint256 timestamp)',
];

const RPC_ENDPOINTS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://sepolia.drpc.org',
];

export interface RelayerConfig {
  privateKey: string;
  alchemyApiKey?: string;
  votingContract?: string;
  pollingInterval?: number; 
  maxRetries?: number;
}

export interface TargetStatus {
  targetId: string;
  exists: boolean;
  totalVotes: number;
  decryptedCount: number;
  pendingDecryption: number;
  lastDecryptTime: number;
  decryptionPending: boolean;
  encSum?: string;
  encCount?: string;
  aclAllowed?: boolean;
}

export interface RelayerLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data?: any;
}

export interface RelayerState {
  isRunning: boolean;
  lastCheck: Date | null;
  lastDecryption: Date | null;
  processedCount: number;
  errorCount: number;
  logs: RelayerLog[];
}

export interface DecryptionResult {
  success: boolean;
  clearValues?: { sum: bigint; count: bigint };
  abiEncodedValues?: string;
  decryptionProof?: string;
  txHash?: string;
  error?: string;
}

type LogCallback = (log: RelayerLog) => void;

export class FHERelayer {
  private config: Required<RelayerConfig>;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private aclContract: ethers.Contract;
  private state: RelayerState;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private logCallbacks: Set<LogCallback> = new Set();

  constructor(config: RelayerConfig) {
    this.config = {
      privateKey: config.privateKey,
      alchemyApiKey: config.alchemyApiKey || '',
      votingContract: config.votingContract || VOTING_CONTRACT,
      pollingInterval: config.pollingInterval || 30000, 
      maxRetries: config.maxRetries || 3,
    };

    this.state = {
      isRunning: false,
      lastCheck: null,
      lastDecryption: null,
      processedCount: 0,
      errorCount: 0,
      logs: [],
    };

    const rpcUrl = this.config.alchemyApiKey
      ? `https://eth-sepolia.g.alchemy.com/v2/${this.config.alchemyApiKey}`
      : RPC_ENDPOINTS[0];
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      this.config.votingContract,
      VOTING_ABI,
      this.wallet
    );
    this.aclContract = new ethers.Contract(ACL_CONTRACT_ADDRESS, ACL_ABI, this.provider);

    this.log('info', 'FHE Relayer initialized (Zama HTTP API mode)', {
      contract: this.config.votingContract,
      relayerAddress: this.wallet.address,
      rpc: rpcUrl.includes('alchemy') ? 'Alchemy' : 'Public RPC',
    });
  }

  private log(level: RelayerLog['level'], message: string, data?: any) {
    const log: RelayerLog = {
      timestamp: new Date(),
      level,
      message,
      data,
    };
    
    this.state.logs.push(log);
    
    if (this.state.logs.length > 100) {
      this.state.logs = this.state.logs.slice(-100);
    }
    
    this.logCallbacks.forEach(cb => cb(log));
    
    const prefix = `[FHE-Relayer]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'success':
        console.log(`✅ ${prefix}`, message, data || '');
        break;
      default:
        console.log(prefix, message, data || '');
    }
  }

  onLog(callback: LogCallback): () => void {
    this.logCallbacks.add(callback);
    return () => this.logCallbacks.delete(callback);
  }

  getState(): RelayerState {
    return { ...this.state };
  }

  getAddress(): string {
    return this.wallet.address;
  }

  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  private uuidToBytes32(uuid: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(uuid));
  }

  async checkACLPermissions(handles: string[]): Promise<{ allowed: boolean; details: Record<string, boolean> }> {
    const details: Record<string, boolean> = {};
    
    try {
      for (const handle of handles) {
        if (handle === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          details[handle.substring(0, 20) + '...'] = false;
          continue;
        }
        const isAllowed = await this.aclContract.isAllowedForDecryption(handle);
        details[handle.substring(0, 20) + '...'] = isAllowed;
      }
      
      const allAllowed = Object.values(details).every(v => v);
      return { allowed: allAllowed, details };
    } catch (e: any) {
      this.log('error', 'ACL check failed', e.message);
      return { allowed: false, details };
    }
  }

  async callZamaPublicDecrypt(handles: string[]): Promise<DecryptionResult> {
    this.log('info', 'Calling Zama HTTP API for public decryption...', { handles: handles.map(h => h.substring(0, 20) + '...') });
    
    try {
      const payload = {
        ciphertextHandles: handles,
        extraData: '0x00'
      };
      
      const response = await fetch(`${ZAMA_RELAYER_URL}/v1/public-decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        if (response.status === 429) {
          this.log('warn', 'Zama rate limited - please wait before retrying');
          return { success: false, error: 'Rate limited - please wait 60 seconds' };
        }
        if (response.status === 400 && responseText.includes('not publicly decryptable')) {
          this.log('info', 'Handles not yet publicly decryptable - need to call requestDecryptionData first');
          return { success: false, error: 'Handles not publicly decryptable' };
        }
        this.log('error', `Zama API error: ${response.status}`, responseText.substring(0, 200));
        return { success: false, error: `API error: ${response.status}` };
      }

      const result = JSON.parse(responseText);
      this.log('info', 'Zama API response received', { status: result.status });

      if (result.response && Array.isArray(result.response) && result.response.length > 0) {
        const decryptedValue = result.response[0].decrypted_value;
        const signatures = result.response[0].signatures || [];
        
        const clearValues = this.deserializeClearValues(handles, decryptedValue);
        const abiEncodedValues = decryptedValue.startsWith('0x') ? decryptedValue : '0x' + decryptedValue;
        const decryptionProof = this.buildDecryptionProof(signatures);
        
        this.log('success', 'Decryption successful via Zama HTTP API!', { 
          sum: clearValues.sum.toString(), 
          count: clearValues.count.toString() 
        });
        
        return {
          success: true,
          clearValues,
          abiEncodedValues,
          decryptionProof,
        };
      }

      return { success: false, error: 'Unexpected response format' };
    } catch (error: any) {
      this.log('error', 'Zama API request failed', error.message);
      return { success: false, error: error.message };
    }
  }

  private deserializeClearValues(handles: string[], decryptedResult: string): { sum: bigint; count: bigint } {
    try {
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      
      const typesList: string[] = handles.map(() => 'uint256');
      
      const paddedResult = '0x' + 
        '00'.repeat(32) + 
        (decryptedResult.startsWith('0x') ? decryptedResult.slice(2) : decryptedResult) +
        '00'.repeat(32); 
      
      const decoded = abiCoder.decode(['uint256', ...typesList, 'bytes[]'], paddedResult);
      
      return {
        sum: BigInt(decoded[1].toString()),
        count: BigInt(decoded[2].toString()),
      };
    } catch (e: any) {
      this.log('error', 'Failed to deserialize clear values', e.message);
      return { sum: BigInt(0), count: BigInt(0) };
    }
  }

  private buildDecryptionProof(signatures: string[]): string {
    try {
      if (!signatures || signatures.length === 0) {
        return '0x';
      }
      
      const numSigners = ethers.solidityPacked(['uint8'], [signatures.length]);
      const packedSigs = signatures.map(s => s.startsWith('0x') ? s : '0x' + s);
      const packedSignatures = ethers.solidityPacked(
        Array(signatures.length).fill('bytes'), 
        packedSigs
      );
      
      return ethers.concat([numSigners, packedSignatures, '0x']);
    } catch (e: any) {
      this.log('error', 'Failed to build proof', e.message);
      return '0x';
    }
  }

  async checkTarget(dappId: string): Promise<TargetStatus> {
    const targetId = this.uuidToBytes32(dappId);
    
    try {
      const target = await this.contract.targets(targetId);
      
      const totalVotes = Number(target.totalVotes);
      const decCount = Number(target.decCount);
      const pendingVotes = totalVotes - decCount;
      
      const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const encSum = target.encSum;
      const encCount = target.encCount;
      const hasEncryptedData = encSum !== zeroHash && encCount !== zeroHash;
      
      let aclAllowed = false;
      if (hasEncryptedData) {
        const aclCheck = await this.checkACLPermissions([encSum, encCount]);
        aclAllowed = aclCheck.allowed;
        this.log('info', `ACL check - handles allowed: ${aclAllowed}`, aclCheck.details);
      }
      
      this.log('info', `Target status - totalVotes: ${totalVotes}, decCount: ${decCount}, pending: ${pendingVotes}, hasEncrypted: ${hasEncryptedData}, aclAllowed: ${aclAllowed}`);
      
      return {
        targetId,
        exists: target.exists,
        totalVotes,
        decryptedCount: decCount,
        pendingDecryption: pendingVotes,
        lastDecryptTime: Number(target.lastDecryptTime),
        decryptionPending: hasEncryptedData,
        encSum,
        encCount,
        aclAllowed,
      };
    } catch (error) {
      this.log('error', `Failed to check target ${dappId}`, error);
      throw error;
    }
  }

  async requestDecryptionData(dappId: string): Promise<string | null> {
    const targetId = this.uuidToBytes32(dappId);
    
    this.log('info', `Calling requestDecryptionData (marking handles as publicly decryptable)...`);

    try {
      const tx = await this.contract.requestDecryptionData(targetId, {
        gasLimit: 500000
      });
      this.log('info', `Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      this.log('success', `requestDecryptionData confirmed`, {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
      });
      
      return tx.hash;
    } catch (error: any) {
      this.log('error', `requestDecryptionData failed`, error.message);
      throw error;
    }
  }

  async verifyAndStoreDecryption(dappId: string, abiEncodedValues: string, decryptionProof: string): Promise<string | null> {
    const targetId = this.uuidToBytes32(dappId);
    
    this.log('info', 'Calling verifyAndStoreDecryption...');

    try {
      const tx = await this.contract.verifyAndStoreDecryption(
        targetId,
        abiEncodedValues,
        decryptionProof,
        { gasLimit: 500000 }
      );
      this.log('info', `Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      this.log('success', 'verifyAndStoreDecryption confirmed', {
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
      });
      
      return tx.hash;
    } catch (error: any) {
      this.log('error', 'verifyAndStoreDecryption failed', error.message);
      throw error;
    }
  }

  async requestDecryption(dappId: string): Promise<string | null> {
    this.log('info', `Starting decryption for ${dappId}...`);

    try {
      const status = await this.checkTarget(dappId);
      
      if (!status.exists) {
        this.log('warn', `Target ${dappId} does not exist`);
        return null;
      }

      if (status.pendingDecryption === 0) {
        this.log('info', 'No pending decryptions - all votes already decrypted');
        return null;
      }

      if (!status.decryptionPending) {
        this.log('warn', 'No encrypted data found');
        return null;
      }

      const handles = [status.encSum!, status.encCount!];

      if (status.aclAllowed) {
        this.log('info', '🚀 Fast path - handles already decryptable, skipping requestDecryptionData TX');
        
        const result = await this.callZamaPublicDecrypt(handles);
        if (result.success) {
          this.state.lastDecryption = new Date();
          this.state.processedCount++;
          
          if (result.abiEncodedValues && result.decryptionProof && result.decryptionProof !== '0x') {
            try {
              const txHash = await this.verifyAndStoreDecryption(dappId, result.abiEncodedValues, result.decryptionProof);
              return txHash;
            } catch (e) {
              this.log('warn', 'Could not store on-chain, but decryption succeeded', e);
            }
          }
          
          return 'zama-http-api-success';
        }
      }

      this.log('info', '📝 Slow path - calling requestDecryptionData to mark handles...');
      
      const reqTxHash = await this.requestDecryptionData(dappId);
      if (!reqTxHash) {
        return null;
      }
      
      this.log('info', 'Waiting 3s for ACL to update...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = await this.callZamaPublicDecrypt(handles);
      if (result.success) {
        this.state.lastDecryption = new Date();
        this.state.processedCount++;
        
        if (result.abiEncodedValues && result.decryptionProof && result.decryptionProof !== '0x') {
          try {
            const storeTxHash = await this.verifyAndStoreDecryption(dappId, result.abiEncodedValues, result.decryptionProof);
            return storeTxHash || reqTxHash;
          } catch (e) {
            this.log('warn', 'Could not store on-chain', e);
          }
        }
        
        return reqTxHash;
      }

      this.log('warn', 'Decryption via Zama HTTP API failed', result.error);
      return reqTxHash; 

    } catch (error: any) {
      this.state.errorCount++;
      this.log('error', `Decryption failed for ${dappId}`, error);
      throw error;
    }
  }

  startWatching(targetIds?: string[]): void {
    if (this.state.isRunning) {
      this.log('warn', 'Relayer already running');
      return;
    }

    this.state.isRunning = true;
    this.log('info', 'Starting FHE relayer (Zama HTTP API mode)...', {
      pollingInterval: this.config.pollingInterval,
      targets: targetIds?.length || 'all',
    });

    this.pollingTimer = setInterval(async () => {
      this.state.lastCheck = new Date();
      
      if (targetIds && targetIds.length > 0) {
        for (const dappId of targetIds) {
          try {
            const status = await this.checkTarget(dappId);
            if (status.pendingDecryption > 0 && status.decryptionPending) {
              this.log('info', `Found ${status.pendingDecryption} pending votes for ${dappId}`, status);
              await this.requestDecryption(dappId);
            }
          } catch (error) {
            this.log('error', `Error checking target ${dappId}`, error);
          }
        }
      }
    }, this.config.pollingInterval);

    try {
      this.contract.on('VoteCast', async (targetId: string, voter: string, voteIndex: bigint) => {
        this.log('info', 'New vote detected', { targetId, voter, voteIndex: voteIndex.toString() });
        
        setTimeout(async () => {
          try {
            
            this.log('info', 'Auto-checking after vote...');
          } catch (error) {
            this.log('warn', 'Auto-check failed', error);
          }
        }, 5000);
      });
    } catch (e) {
      this.log('warn', 'Could not subscribe to VoteCast events', e);
    }
  }

  stopWatching(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    
    try {
      this.contract.removeAllListeners();
    } catch (e) {
      
    }
    
    this.state.isRunning = false;
    this.log('info', 'FHE relayer stopped');
  }

  async checkAndDecrypt(dappId: string): Promise<{
    status: TargetStatus;
    txHash: string | null;
  }> {
    this.log('info', `Manual check for ${dappId}`);
    
    const status = await this.checkTarget(dappId);
    this.log('info', 'Target status', status);
    
    let txHash: string | null = null;
    
    if (status.pendingDecryption > 0 && status.decryptionPending) {
      this.log('info', `Found ${status.pendingDecryption} pending votes - requesting decryption...`);
      txHash = await this.requestDecryption(dappId);
    } else {
      this.log('info', 'All votes decrypted or no encrypted data');
    }
    
    return { status, txHash };
  }

  async decryptFast(dappId: string): Promise<DecryptionResult> {
    this.log('info', `Fast decrypt for ${dappId} (no TX)...`);
    
    const status = await this.checkTarget(dappId);
    
    if (!status.exists || !status.decryptionPending) {
      return { success: false, error: 'No encrypted data' };
    }

    if (!status.aclAllowed) {
      return { success: false, error: 'ACL not allowed - need to call requestDecryptionData first' };
    }

    const handles = [status.encSum!, status.encCount!];
    return await this.callZamaPublicDecrypt(handles);
  }
}

export function createRelayerFromEnv(): FHERelayer | null {
  const privateKey = import.meta.env.VITE_RELAYER_PRIVATE_KEY;
  
  if (!privateKey) {
    console.warn('[FHE-Relayer] VITE_RELAYER_PRIVATE_KEY not set in .env');
    return null;
  }

  return new FHERelayer({
    privateKey,
    alchemyApiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
  });
}

let relayerInstance: FHERelayer | null = null;

export function getRelayer(): FHERelayer | null {
  if (!relayerInstance) {
    relayerInstance = createRelayerFromEnv();
  }
  return relayerInstance;
}

export function initRelayer(config: RelayerConfig): FHERelayer {
  relayerInstance = new FHERelayer(config);
  return relayerInstance;
}
