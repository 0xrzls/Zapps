import type { Profile, ServiceResult } from '../types';
import type { IProfileService } from '../interfaces';

const PROFILES_KEY = 'zapps_profiles';

function loadProfiles(): Record<string, Profile> {
  try {
    const stored = localStorage.getItem(PROFILES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProfiles(profiles: Record<string, Profile>): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 14).toUpperCase();
}

export class StaticProfileService implements IProfileService {
  async getByWallet(walletAddress: string): Promise<ServiceResult<Profile>> {
    try {
      const profiles = loadProfiles();
      const profile = profiles[walletAddress.toLowerCase()] || null;
      return { data: profile, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async create(profile: Partial<Profile>): Promise<ServiceResult<Profile>> {
    try {
      if (!profile.wallet_address) {
        return { data: null, error: new Error('wallet_address is required') };
      }
      
      const profiles = loadProfiles();
      const key = profile.wallet_address.toLowerCase();
      
      const newProfile: Profile = {
        wallet_address: profile.wallet_address,
        referral_code: profile.referral_code || generateReferralCode(),
        referred_by: profile.referred_by || null,
        rvp_balance: profile.rvp_balance || 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      profiles[key] = newProfile;
      saveProfiles(profiles);
      
      return { data: newProfile, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async update(walletAddress: string, data: Partial<Profile>): Promise<ServiceResult<Profile>> {
    try {
      const profiles = loadProfiles();
      const key = walletAddress.toLowerCase();
      
      if (!profiles[key]) {
        return { data: null, error: new Error('Profile not found') };
      }
      
      profiles[key] = {
        ...profiles[key],
        ...data,
        updated_at: new Date().toISOString(),
      };
      
      saveProfiles(profiles);
      return { data: profiles[key], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async upsert(profile: Partial<Profile>): Promise<ServiceResult<Profile>> {
    if (!profile.wallet_address) {
      return { data: null, error: new Error('wallet_address is required') };
    }
    
    const existing = await this.getByWallet(profile.wallet_address);
    
    if (existing.data) {
      return this.update(profile.wallet_address, profile);
    } else {
      return this.create(profile);
    }
  }

  async getByReferralCode(code: string): Promise<ServiceResult<Profile>> {
    try {
      const profiles = loadProfiles();
      const profile = Object.values(profiles).find(p => p.referral_code === code) || null;
      return { data: profile, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}
