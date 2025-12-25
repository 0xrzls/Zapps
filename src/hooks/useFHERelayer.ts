
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FHERelayer, 
  RelayerConfig, 
  RelayerState, 
  RelayerLog,
  TargetStatus,
  createRelayerFromEnv 
} from '@/lib/fheRelayer';

export interface UseFHERelayerReturn {
  
  isAvailable: boolean;
  isRunning: boolean;
  relayerAddress: string | null;
  balance: string | null;
  state: RelayerState | null;
  logs: RelayerLog[];
  
  initialize: (config?: RelayerConfig) => void;
  start: (targetIds?: string[]) => void;
  stop: () => void;
  checkTarget: (dappId: string) => Promise<TargetStatus | null>;
  requestDecryption: (dappId: string) => Promise<string | null>;
  checkAndDecrypt: (dappId: string) => Promise<{ status: TargetStatus; txHash: string | null } | null>;
  decryptFast: (dappId: string) => Promise<{ success: boolean; clearValues?: { sum: bigint; count: bigint }; error?: string } | null>;
  refreshBalance: () => Promise<void>;
  clearLogs: () => void;
}

const STORAGE_KEY = 'fhe_relayer_key';

export function useFHERelayer(): UseFHERelayerReturn {
  const [relayer, setRelayer] = useState<FHERelayer | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [relayerAddress, setRelayerAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [state, setState] = useState<RelayerState | null>(null);
  const [logs, setLogs] = useState<RelayerLog[]>([]);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    
    let envRelayer = createRelayerFromEnv();
    
    if (!envRelayer) {
      const storedKey = localStorage.getItem(STORAGE_KEY);
      if (storedKey) {
        try {
          envRelayer = new FHERelayer({
            privateKey: storedKey,
            alchemyApiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
          });
          console.log('[useFHERelayer] Initialized from localStorage');
        } catch (e) {
          console.error('[useFHERelayer] Invalid stored key:', e);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
    
    if (envRelayer) {
      setRelayer(envRelayer);
      setIsAvailable(true);
      setRelayerAddress(envRelayer.getAddress());
      setState(envRelayer.getState());
      
      unsubscribeRef.current = envRelayer.onLog((log) => {
        setLogs(prev => [...prev.slice(-99), log]);
        setState(envRelayer.getState());
      });
      
      envRelayer.getBalance().then(setBalance).catch(console.error);
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (relayer) {
        relayer.stopWatching();
      }
    };
  }, []);

  const initialize = useCallback((config?: RelayerConfig) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    const privateKey = config?.privateKey || import.meta.env.VITE_RELAYER_PRIVATE_KEY;
    if (!privateKey) {
      console.error('[useFHERelayer] No private key provided');
      setIsAvailable(false);
      return;
    }
    
    if (config?.privateKey) {
      localStorage.setItem(STORAGE_KEY, config.privateKey);
      console.log('[useFHERelayer] Private key stored in localStorage');
    }
    
    const newRelayer = new FHERelayer({
      privateKey,
      alchemyApiKey: config?.alchemyApiKey || import.meta.env.VITE_ALCHEMY_API_KEY,
      ...config,
    });
    
    setRelayer(newRelayer);
    setIsAvailable(true);
    setRelayerAddress(newRelayer.getAddress());
    setState(newRelayer.getState());
    setLogs([]);
    
    unsubscribeRef.current = newRelayer.onLog((log) => {
      setLogs(prev => [...prev.slice(-99), log]);
      setState(newRelayer.getState());
    });
    
    newRelayer.getBalance().then(setBalance).catch(console.error);
  }, []);

  const start = useCallback((targetIds?: string[]) => {
    if (relayer) {
      relayer.startWatching(targetIds);
      setState(relayer.getState());
    }
  }, [relayer]);

  const stop = useCallback(() => {
    if (relayer) {
      relayer.stopWatching();
      setState(relayer.getState());
    }
  }, [relayer]);

  const checkTarget = useCallback(async (dappId: string): Promise<TargetStatus | null> => {
    if (!relayer) return null;
    try {
      return await relayer.checkTarget(dappId);
    } catch (error) {
      console.error('[useFHERelayer] checkTarget error:', error);
      return null;
    }
  }, [relayer]);

  const requestDecryption = useCallback(async (dappId: string): Promise<string | null> => {
    if (!relayer) return null;
    try {
      return await relayer.requestDecryption(dappId);
    } catch (error) {
      console.error('[useFHERelayer] requestDecryption error:', error);
      return null;
    }
  }, [relayer]);

  const checkAndDecrypt = useCallback(async (dappId: string) => {
    if (!relayer) return null;
    try {
      return await relayer.checkAndDecrypt(dappId);
    } catch (error) {
      console.error('[useFHERelayer] checkAndDecrypt error:', error);
      return null;
    }
  }, [relayer]);

  const decryptFast = useCallback(async (dappId: string) => {
    if (!relayer) return null;
    try {
      return await relayer.decryptFast(dappId);
    } catch (error) {
      console.error('[useFHERelayer] decryptFast error:', error);
      return null;
    }
  }, [relayer]);

  const refreshBalance = useCallback(async () => {
    if (relayer) {
      const bal = await relayer.getBalance();
      setBalance(bal);
    }
  }, [relayer]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    isAvailable,
    isRunning: state?.isRunning || false,
    relayerAddress,
    balance,
    state,
    logs,
    initialize,
    start,
    stop,
    checkTarget,
    requestDecryption,
    checkAndDecrypt,
    decryptFast,
    refreshBalance,
    clearLogs,
  };
}
