
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';

interface OnChainMessage {
  hash: string;
  author: string;
  contentHash: string;
  timestamp: number;
  parentHash: string;
  isEncrypted: boolean;
  isDeleted: boolean;
  upvotes: number;
  downvotes: number;
}

interface RoomInfo {
  owner: string;
  isPublic: boolean;
  requiresReputation: boolean;
  minReputationToPost: number;
  messageCount: number;
  participantCount: number;
  createdAt: number;
  isActive: boolean;
}

interface UserStats {
  messageCount: number;
  lastMessageTimestamp: number;
  banned: boolean;
  moderator: boolean;
  participated: boolean;
}

export function useOnChainDiscussion(dappId: string) {
  const { isConnected, network, address } = useWallet();
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [onChainMessages, setOnChainMessages] = useState<OnChainMessage[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discussionContract, setDiscussionContract] = useState<any>(null);

  useEffect(() => {
    const initContract = async () => {
      if (!isConnected || network !== 'sepolia') {
        setDiscussionContract(null);
        return;
      }

      try {
        const adapter = (window as any).__walletAdapter;
        if (!adapter) return;

        const { ZappsDiscussion } = await import('@/lib/contracts/zappsDiscussion');
        const { EVMWalletAdapter } = await import('@/lib/wallet/adapters/EVMWalletAdapter');
        
        if (adapter instanceof EVMWalletAdapter) {
          const discussion = new ZappsDiscussion(adapter);
          setDiscussionContract(discussion);
        }
      } catch (err) {
        console.error('[useOnChainDiscussion] Failed to init contract:', err);
        setError('Failed to initialize on-chain discussion');
      }
    };

    initContract();
  }, [isConnected, network]);

  const fetchRoomInfo = useCallback(async () => {
    if (!discussionContract || !dappId) return;

    try {
      const info = await discussionContract.getRoomInfo(dappId);
      setRoomInfo(info);
    } catch (err) {
      console.error('[useOnChainDiscussion] Failed to fetch room info:', err);
    }
  }, [discussionContract, dappId]);

  const fetchMessages = useCallback(async () => {
    if (!discussionContract || !dappId) return;

    setLoading(true);
    try {
      const messageHashes = await discussionContract.getRecentMessages(dappId, 50);
      const messages: OnChainMessage[] = [];

      for (const hash of messageHashes) {
        const msg = await discussionContract.getMessage(hash);
        if (msg && !msg.isDeleted) {
          messages.push(msg);
        }
      }

      messages.sort((a, b) => b.timestamp - a.timestamp);
      setOnChainMessages(messages);
    } catch (err) {
      console.error('[useOnChainDiscussion] Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [discussionContract, dappId]);

  const fetchUserStats = useCallback(async () => {
    if (!discussionContract || !dappId || !address) return;

    try {
      const stats = await discussionContract.getUserStats(dappId, address);
      setUserStats(stats);
    } catch (err) {
      console.error('[useOnChainDiscussion] Failed to fetch user stats:', err);
    }
  }, [discussionContract, dappId, address]);

  const createRoom = useCallback(async (
    isPublic = true,
    requiresReputation = false,
    minReputation = 0
  ) => {
    if (!discussionContract) {
      throw new Error('Contract not initialized');
    }

    const tx = await discussionContract.createRoom(dappId, isPublic, requiresReputation, minReputation);
    await tx.wait();
    await fetchRoomInfo();
    return tx;
  }, [discussionContract, dappId, fetchRoomInfo]);

  const postMessageOnChain = useCallback(async (
    contentHash: string,
    parentHash: string = ethers.ZeroHash,
    isEncrypted = true  
  ) => {
    if (!discussionContract) {
      throw new Error('Contract not initialized');
    }

    const tx = await discussionContract.postMessage(dappId, contentHash, parentHash, isEncrypted);
    await tx.wait();
    await fetchMessages();
    return tx;
  }, [discussionContract, dappId, fetchMessages]);

  const upvoteMessage = useCallback(async (messageHash: string) => {
    if (!discussionContract) {
      throw new Error('Contract not initialized');
    }

    const tx = await discussionContract.upvoteMessage(messageHash);
    await tx.wait();
    await fetchMessages();
    return tx;
  }, [discussionContract, fetchMessages]);

  const downvoteMessage = useCallback(async (messageHash: string) => {
    if (!discussionContract) {
      throw new Error('Contract not initialized');
    }

    const tx = await discussionContract.downvoteMessage(messageHash);
    await tx.wait();
    await fetchMessages();
    return tx;
  }, [discussionContract, fetchMessages]);

  const deleteMessage = useCallback(async (messageHash: string) => {
    if (!discussionContract) {
      throw new Error('Contract not initialized');
    }

    const tx = await discussionContract.deleteMessage(dappId, messageHash);
    await tx.wait();
    await fetchMessages();
    return tx;
  }, [discussionContract, dappId, fetchMessages]);

  useEffect(() => {
    if (discussionContract && dappId) {
      fetchRoomInfo();
      fetchMessages();
      if (address) {
        fetchUserStats();
      }
    }
  }, [discussionContract, dappId, address, fetchRoomInfo, fetchMessages, fetchUserStats]);

  return {
    roomInfo,
    onChainMessages,
    userStats,
    loading,
    error,
    isOnChainAvailable: !!discussionContract && network === 'sepolia',
    createRoom,
    postMessageOnChain,
    upvoteMessage,
    downvoteMessage,
    deleteMessage,
    refreshMessages: fetchMessages,
    refreshRoomInfo: fetchRoomInfo,
  };
}
