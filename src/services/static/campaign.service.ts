import type { Campaign, QueryOptions, ServiceResult } from '../types';
import type { ICampaignService } from '../interfaces';

let campaignsCache: Campaign[] | null = null;

async function loadCampaigns(): Promise<Campaign[]> {
  if (campaignsCache) return campaignsCache;
  
  try {
    const response = await fetch('/data/campaigns.json');
    const data = await response.json();
    campaignsCache = data.map((c: any) => ({
      ...c,
      created_at: c.created_at || new Date().toISOString(),
      updated_at: c.updated_at || new Date().toISOString(),
    }));
    return campaignsCache!;
  } catch (error) {
    console.error('Failed to load campaigns.json:', error);
    return [];
  }
}

export class StaticCampaignService implements ICampaignService {
  async getAll(options?: QueryOptions): Promise<ServiceResult<Campaign[]>> {
    try {
      let campaigns = await loadCampaigns();
      
      if (options?.orderBy) {
        campaigns = [...campaigns].sort((a: any, b: any) => {
          const aVal = a[options.orderBy!];
          const bVal = b[options.orderBy!];
          if (options.ascending) return aVal > bVal ? 1 : -1;
          return aVal < bVal ? 1 : -1;
        });
      }
      
      if (options?.limit) {
        campaigns = campaigns.slice(0, options.limit);
      }
      
      return { data: campaigns, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getAllWithMetadata(options?: QueryOptions): Promise<ServiceResult<Campaign[]>> {
    return this.getAll(options);
  }

  async getById(id: string): Promise<ServiceResult<Campaign>> {
    try {
      const campaigns = await loadCampaigns();
      const campaign = campaigns.find(c => c.id === id) || null;
      return { data: campaign, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getByOnChainId(onChainId: number): Promise<ServiceResult<Campaign>> {
    try {
      const campaigns = await loadCampaigns();
      const campaign = campaigns.find((c: any) => c.campaign_metadata?.on_chain_id === onChainId) || null;
      return { data: campaign, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getActive(options?: QueryOptions): Promise<ServiceResult<Campaign[]>> {
    try {
      let campaigns = await loadCampaigns();
      campaigns = campaigns.filter(c => c.is_active && c.status === 'active');
      
      if (options?.limit) {
        campaigns = campaigns.slice(0, options.limit);
      }
      
      return { data: campaigns, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getFeatured(limit = 10): Promise<ServiceResult<Campaign[]>> {
    try {
      const campaigns = await loadCampaigns();
      const featured = campaigns.filter(c => c.is_featured).slice(0, limit);
      return { data: featured, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getByDApp(dappId: string): Promise<ServiceResult<Campaign[]>> {
    try {
      const campaigns = await loadCampaigns();
      const filtered = campaigns.filter(c => c.dapp_id === dappId);
      return { data: filtered, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getOneTimeRewards(options?: QueryOptions): Promise<ServiceResult<Campaign[]>> {
    try {
      let campaigns = await loadCampaigns();
      campaigns = campaigns.filter(c => c.display_target === 'one_time_rewards');
      
      if (options?.limit) {
        campaigns = campaigns.slice(0, options.limit);
      }
      
      return { data: campaigns, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async create(campaign: Partial<Campaign>): Promise<ServiceResult<Campaign>> {
    console.warn('StaticCampaignService.create: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async update(id: string, data: Partial<Campaign>): Promise<ServiceResult<Campaign>> {
    console.warn('StaticCampaignService.update: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async updateByOnChainId(onChainId: number, data: Partial<Campaign>): Promise<ServiceResult<Campaign>> {
    console.warn('StaticCampaignService.updateByOnChainId: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    console.warn('StaticCampaignService.delete: Static data cannot be modified');
    return { data: false, error: new Error('Static data cannot be modified') };
  }
}
