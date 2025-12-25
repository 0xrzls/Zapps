import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { ZVP_ABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';

export const useWalletBalance = () => {
  const { address, balance: nativeBalance, network } = useWallet();
  const [rvpBalance, setRvpBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchRvpBalance = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        console.error('No ethereum provider found');
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(ethereum);
      const addresses = await getContractAddresses(network);
      
      if (!addresses.ZVP_TOKEN) {
        console.error('ZVP contract address not found for network:', network);
        setRvpBalance(0);
        setLoading(false);
        return;
      }

      const zvpContract = new ethers.Contract(addresses.ZVP_TOKEN, ZVP_ABI, provider);
      const balance = await zvpContract.balanceOf(address);
      const decimals = await zvpContract.decimals();
      
      setRvpBalance(Number(ethers.formatUnits(balance, decimals)));
    } catch (err) {
      console.error('Failed to fetch ZVP balance:', err);
      setRvpBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const refreshNativeBalance = async () => {
    console.log('Balance refresh requested');
  };

  useEffect(() => {
    if (address) {
      fetchRvpBalance();
      
      const interval = setInterval(fetchRvpBalance, 10000);
      
      return () => clearInterval(interval);
    } else {
      setRvpBalance(0);
    }
  }, [address, network]);

  return {
    nativeBalance,
    rvpBalance,
    loading,
    refreshRvpBalance: fetchRvpBalance,
    refreshNativeBalance,
  };
};