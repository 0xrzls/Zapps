import type { Announcement, QueryOptions, ServiceResult } from '../types';
import type { IAnnouncementService } from '../interfaces';

let announcementsCache: Announcement[] | null = null;

async function loadAnnouncements(): Promise<Announcement[]> {
  if (announcementsCache) return announcementsCache;
  
  try {
    const response = await fetch('/data/announcements.json');
    const data = await response.json();
    announcementsCache = data.map((a: any) => ({
      ...a,
      created_at: a.created_at || new Date().toISOString(),
      updated_at: a.updated_at || new Date().toISOString(),
    }));
    return announcementsCache!;
  } catch (error) {
    console.error('Failed to load announcements.json:', error);
    return [];
  }
}

export class StaticAnnouncementService implements IAnnouncementService {
  async getAll(options?: QueryOptions): Promise<ServiceResult<Announcement[]>> {
    try {
      let announcements = await loadAnnouncements();
      
      if (options?.orderBy) {
        announcements = [...announcements].sort((a: any, b: any) => {
          const aVal = a[options.orderBy!];
          const bVal = b[options.orderBy!];
          if (options.ascending) return aVal > bVal ? 1 : -1;
          return aVal < bVal ? 1 : -1;
        });
      }
      
      if (options?.limit) {
        announcements = announcements.slice(0, options.limit);
      }
      
      return { data: announcements, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getActive(): Promise<ServiceResult<Announcement[]>> {
    try {
      const announcements = await loadAnnouncements();
      const active = announcements.filter(a => a.is_active);
      return { data: active, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async create(announcement: Partial<Announcement>): Promise<ServiceResult<Announcement>> {
    console.warn('StaticAnnouncementService.create: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async update(id: string, data: Partial<Announcement>): Promise<ServiceResult<Announcement>> {
    console.warn('StaticAnnouncementService.update: Static data cannot be modified');
    return { data: null, error: new Error('Static data cannot be modified') };
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    console.warn('StaticAnnouncementService.delete: Static data cannot be modified');
    return { data: false, error: new Error('Static data cannot be modified') };
  }
}
