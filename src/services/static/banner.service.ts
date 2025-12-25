import type { Banner, QueryOptions, ServiceResult } from '../types';
import type { IBannerService } from '../interfaces';

let bannersCache: Banner[] | null = null;

async function loadBanners(): Promise<Banner[]> {
  if (bannersCache) return bannersCache;
  
  try {
    const response = await fetch('/data/banners.json');
    const data = await response.json();
    bannersCache = data.map((b: any) => ({
      ...b,
      created_at: b.created_at || new Date().toISOString(),
      updated_at: b.updated_at || new Date().toISOString(),
    }));
    return bannersCache!;
  } catch (error) {
    console.error('Failed to load banners.json:', error);
    return [];
  }
}

export class StaticBannerService implements IBannerService {
  async getByType(type: string): Promise<ServiceResult<Banner[]>> {
    try {
      const banners = await loadBanners();
      const filtered = banners
        .filter(b => b.banner_type === type)
        .sort((a, b) => a.display_order - b.display_order);
      return { data: filtered, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getActive(type: string): Promise<ServiceResult<Banner[]>> {
    try {
      const banners = await loadBanners();
      const active = banners
        .filter(b => b.banner_type === type && b.is_active)
        .sort((a, b) => a.display_order - b.display_order);
      return { data: active, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async create(banner: Partial<Banner>): Promise<ServiceResult<Banner>> {
    console.warn('StaticBannerService.create: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async update(id: string, data: Partial<Banner>): Promise<ServiceResult<Banner>> {
    console.warn('StaticBannerService.update: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    console.warn('StaticBannerService.delete: Static data cannot be modified');
    return { data: false, error: new Error('Static data cannot be modified') };
  }
}
