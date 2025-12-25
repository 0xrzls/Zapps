
import type { ServiceResult } from '../types';

function emptyArrayResult<T>(): ServiceResult<T[]> {
  return { data: [], error: null };
}

function nullResult<T>(): ServiceResult<T> {
  return { data: null, error: null };
}

function successResult(): ServiceResult<boolean> {
  return { data: true, error: null };
}

export class StaticScoreService {
  async getByDAppId(dappId: string): Promise<ServiceResult<any>> { return nullResult(); }
  async getByDApp(dappId: string): Promise<ServiceResult<any>> { return nullResult(); }
  async getAll(): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getAllWithDApps(options?: any): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async update(dappId: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async upsert(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async insert(data: any): Promise<ServiceResult<any>> { return nullResult(); }
}

export class StaticReportService {
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async getByDAppId(dappId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
}

export class StaticStorageService {
  async upload(bucket: string, path: string, file: File): Promise<ServiceResult<string>> {
    return { data: null, error: new Error('File upload disabled') };
  }
  async getPublicUrl(bucket: string, path: string): Promise<string> { return ''; }
}

export class StaticFunctionService {
  async invoke<T = any>(name: string, payload?: any): Promise<ServiceResult<T>> {
    return { data: { authUrl: null, success: false, error: 'Disabled', data: null, transferredAchievements: [] } as T, error: null };
  }
}

export class StaticNewsService {
  async getAll(options?: any): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getById(id: string): Promise<ServiceResult<any>> { return nullResult(); }
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async update(id: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async delete(id: string): Promise<ServiceResult<boolean>> { return successResult(); }
}

export class StaticQuestService {
  async getByCampaignId(campaignId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getByCampaign(campaignId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async update(id: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async delete(id: string): Promise<ServiceResult<boolean>> { return successResult(); }
}

export class StaticRewardService {
  async getByCampaignId(campaignId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getByCampaign(campaignId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async update(id: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async delete(id: string): Promise<ServiceResult<boolean>> { return successResult(); }
}

export class StaticEmojiService {
  async getActive(): Promise<ServiceResult<any[]>> {
    return { data: [
      { id: '1', emoji_code: '👍', emoji_label: 'thumbs up', display_order: 1, is_active: true },
      { id: '2', emoji_code: '❤️', emoji_label: 'heart', display_order: 2, is_active: true },
    ], error: null };
  }
  async getAll(): Promise<ServiceResult<any[]>> { return this.getActive(); }
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async update(id: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async delete(id: string): Promise<ServiceResult<boolean>> { return successResult(); }
}

export class StaticDiscussionService {
  async getByDAppId(dappId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getByDApp(dappId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async delete(id: string, dappId: string): Promise<ServiceResult<boolean>> { return successResult(); }
}

export class StaticReactionService {
  async getByDiscussionId(discussionId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async toggle(discussionId: string, userId: string, emojiCode: string): Promise<ServiceResult<any>> { return nullResult(); }
}

export class StaticAuthService {
  async signInWithWallet(address: string): Promise<ServiceResult<any>> { return { data: { wallet_address: address }, error: null }; }
  async signOut(): Promise<ServiceResult<boolean>> { return successResult(); }
  async getCurrentUser(): Promise<ServiceResult<any>> { return nullResult(); }
  async hasRole(role: string, userId: string): Promise<{ data: boolean }> { return { data: false }; }
}

export class StaticAuthCoreService {
  async getSession(): Promise<any> { return null; }
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  async signInWithPassword(credentials: any): Promise<any> { return { data: null, error: { message: 'Disabled' } }; }
  async signUp(credentials: any): Promise<any> { return { data: null, error: { message: 'Disabled' } }; }
  async signOut(): Promise<any> { return { error: null }; }
}

export class StaticUserRewardService {
  async getByWallet(wallet: string): Promise<ServiceResult<any>> { return nullResult(); }
  async upsert(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async update(wallet: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
}

export class StaticReferralService {
  async getByReferrer(wallet: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getByReferrerAndReferred(referrer: string, referred: string): Promise<ServiceResult<any>> { return nullResult(); }
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async update(id: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async trackReferral(code: string, wallet: string): Promise<ServiceResult<any>> { return nullResult(); }
}

export class StaticQuestCompletionService {
  async getByUserAndCampaign(userId: string, campaignId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getByUser(userId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getByUserAndQuest(userId: string, questId: string): Promise<ServiceResult<any>> { return { data: { verified: false }, error: null }; }
  async getByUserAndQuestIds(userId: string, questIds: string[]): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async update(id: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async updateByUserAndQuest(userId: string, questId: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async upsert(data: any): Promise<ServiceResult<any>> { return nullResult(); }
}

export class StaticUserRewardClaimService {
  async getByUserAndCampaign(userId: string, campaignId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
}

export class StaticAppConfigService {
  async get(key: string): Promise<ServiceResult<any>> { return { data: { value: null }, error: null }; }
  async set(key: string, value: any): Promise<ServiceResult<any>> { return nullResult(); }
}

export class StaticFHELogService {
  async getByDAppId(dappId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getByDApp(dappId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getAll(options?: any): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
}

export class StaticPushSubscriptionService {
  async subscribe(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async unsubscribe(endpoint: string): Promise<ServiceResult<boolean>> { return successResult(); }
  async upsert(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async deleteByEndpoint(endpoint: string): Promise<ServiceResult<boolean>> { return successResult(); }
}

export class StaticSubmissionService {
  async create(data: any): Promise<ServiceResult<any>> { return nullResult(); }
  async getAll(options?: any): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async update(id: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
}

export class StaticPageViewService {
  async record(dappId: string): Promise<ServiceResult<any>> { return nullResult(); }
  async getByDApp(dappId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
}

export const staticRealtimeService = {
  subscribeToDiscussions: (...args: any[]) => ({ unsubscribe: () => {} }),
  subscribeToReactions: (...args: any[]) => ({ unsubscribe: () => {} }),
  subscribe: (...args: any[]) => ({ unsubscribe: () => {} }),
};

export class StaticAnalyticsService {
  async getPageViews(startDate: string, endDate: string): Promise<ServiceResult<any>> { return { data: { total: 0 }, error: null }; }
}

export class StaticAttachmentService {
  async getByDiscussionId(discussionId: string): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async getAll(options?: any): Promise<ServiceResult<any[]>> { return emptyArrayResult(); }
  async update(id: string, data: any): Promise<ServiceResult<any>> { return nullResult(); }
}

export class StaticTwitterCacheService {
  async get(username: string): Promise<ServiceResult<any>> { return nullResult(); }
}
