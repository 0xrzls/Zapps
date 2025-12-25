import type { DApp, QueryOptions, ServiceResult } from '../types';
import type { IDAppService } from '../interfaces';
import { generateDAppSlug } from '@/lib/utils';

let dappsCache: DApp[] | null = null;

async function loadDApps(): Promise<DApp[]> {
  if (dappsCache) return dappsCache;
  
  try {
    const response = await fetch('/data/dapps.json');
    const data = await response.json();
    
    dappsCache = data.map((d: any) => ({
      ...d,
      created_at: d.created_at || new Date().toISOString(),
      updated_at: d.updated_at || new Date().toISOString(),
    }));
    return dappsCache!;
  } catch (error) {
    console.error('Failed to load dapps.json:', error);
    return [];
  }
}

export class StaticDAppService implements IDAppService {
  async getAll(options?: QueryOptions): Promise<ServiceResult<DApp[]>> {
    try {
      let dapps = await loadDApps();
      
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          dapps = dapps.filter((d: any) => d[key] === value);
        });
      }
      
      if (options?.orderBy) {
        dapps = [...dapps].sort((a: any, b: any) => {
          const aVal = a[options.orderBy!];
          const bVal = b[options.orderBy!];
          if (options.ascending) return aVal > bVal ? 1 : -1;
          return aVal < bVal ? 1 : -1;
        });
      }
      
      if (options?.offset) {
        dapps = dapps.slice(options.offset);
      }
      
      if (options?.limit) {
        dapps = dapps.slice(0, options.limit);
      }
      
      return { data: dapps, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getById(id: string): Promise<ServiceResult<DApp>> {
    try {
      const dapps = await loadDApps();
      const dapp = dapps.find(d => d.id === id) || null;
      return { data: dapp, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getBySlug(slug: string): Promise<ServiceResult<DApp>> {
    try {
      const dapps = await loadDApps();
      const dapp = dapps.find(d => generateDAppSlug(d.name) === slug) || null;
      return { data: dapp, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getFeatured(limit = 10): Promise<ServiceResult<DApp[]>> {
    try {
      const dapps = await loadDApps();
      const featured = dapps.filter(d => d.is_featured).slice(0, limit);
      return { data: featured, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getByCategory(category: string, options?: QueryOptions): Promise<ServiceResult<DApp[]>> {
    try {
      let dapps = await loadDApps();
      dapps = dapps.filter(d => d.category === category);
      
      if (options?.limit) {
        dapps = dapps.slice(0, options.limit);
      }
      
      return { data: dapps, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async search(query: string, options?: QueryOptions): Promise<ServiceResult<DApp[]>> {
    try {
      const dapps = await loadDApps();
      const lowerQuery = query.toLowerCase();
      let results = dapps.filter(d => 
        d.name.toLowerCase().includes(lowerQuery) ||
        d.description.toLowerCase().includes(lowerQuery)
      );
      
      if (options?.limit) {
        results = results.slice(0, options.limit);
      }
      
      return { data: results, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async create(dapp: Partial<DApp>): Promise<ServiceResult<DApp>> {
    console.warn('StaticDAppService.create: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async update(id: string, data: Partial<DApp>): Promise<ServiceResult<DApp>> {
    console.warn('StaticDAppService.update: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    console.warn('StaticDAppService.delete: Static data cannot be modified');
    return { data: false, error: new Error('Static data cannot be modified') };
  }

  async incrementViewCount(id: string): Promise<ServiceResult<boolean>> {
    
    return { data: true, error: null };
  }
}
