import type { LearnContent, QueryOptions, ServiceResult } from '../types';
import type { ILearnContentService } from '../interfaces';

let learnCache: LearnContent[] | null = null;

async function loadLearn(): Promise<LearnContent[]> {
  if (learnCache) return learnCache;
  
  try {
    const response = await fetch('/data/learn.json');
    const data = await response.json();
    learnCache = data.map((l: any) => ({
      ...l,
      created_at: l.created_at || new Date().toISOString(),
      updated_at: l.updated_at || new Date().toISOString(),
    }));
    return learnCache!;
  } catch (error) {
    console.error('Failed to load learn.json:', error);
    return [];
  }
}

export class StaticLearnService implements ILearnContentService {
  async getAll(options?: QueryOptions): Promise<ServiceResult<LearnContent[]>> {
    try {
      let content = await loadLearn();
      
      if (options?.orderBy) {
        content = [...content].sort((a: any, b: any) => {
          const aVal = a[options.orderBy!];
          const bVal = b[options.orderBy!];
          if (options.ascending) return aVal > bVal ? 1 : -1;
          return aVal < bVal ? 1 : -1;
        });
      }
      
      if (options?.limit) {
        content = content.slice(0, options.limit);
      }
      
      return { data: content, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getByType(type: string, options?: QueryOptions): Promise<ServiceResult<LearnContent[]>> {
    try {
      let content = await loadLearn();
      content = content.filter(c => c.content_type === type);
      
      if (options?.limit) {
        content = content.slice(0, options.limit);
      }
      
      return { data: content, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async create(content: Partial<LearnContent>): Promise<ServiceResult<LearnContent>> {
    console.warn('StaticLearnService.create: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async update(id: string, data: Partial<LearnContent>): Promise<ServiceResult<LearnContent>> {
    console.warn('StaticLearnService.update: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    console.warn('StaticLearnService.delete: Static data cannot be modified');
    return { data: false, error: new Error('Static data cannot be modified') };
  }
}
