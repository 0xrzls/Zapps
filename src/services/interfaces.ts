import type {
  DApp,
  Campaign,
  Profile,
  DAppVote,
  DAppScore,
  Discussion,
  DiscussionReaction,
  Banner,
  GenesisOperator,
  LearnContent,
  News,
  CampaignQuest,
  CampaignReward,
  Announcement,
  UserRole,
  EmojiSettings,
  QueryOptions,
  ServiceResult,
  RealtimeCallback,
  Subscription,
} from './types';

export interface IDAppService {
  getAll(options?: QueryOptions): Promise<ServiceResult<DApp[]>>;
  getById(id: string): Promise<ServiceResult<DApp>>;
  getBySlug(slug: string): Promise<ServiceResult<DApp>>;
  getFeatured(limit?: number): Promise<ServiceResult<DApp[]>>;
  getByCategory(category: string, options?: QueryOptions): Promise<ServiceResult<DApp[]>>;
  search(query: string, options?: QueryOptions): Promise<ServiceResult<DApp[]>>;
  create(dapp: Partial<DApp>): Promise<ServiceResult<DApp>>;
  update(id: string, data: Partial<DApp>): Promise<ServiceResult<DApp>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
  incrementViewCount(id: string): Promise<ServiceResult<boolean>>;
}

export interface ICampaignService {
  getAll(options?: QueryOptions): Promise<ServiceResult<Campaign[]>>;
  getAllWithMetadata(options?: QueryOptions): Promise<ServiceResult<Campaign[]>>;
  getById(id: string): Promise<ServiceResult<Campaign>>;
  getByOnChainId(onChainId: number): Promise<ServiceResult<Campaign>>;
  getActive(options?: QueryOptions): Promise<ServiceResult<Campaign[]>>;
  getFeatured(limit?: number): Promise<ServiceResult<Campaign[]>>;
  getByDApp(dappId: string): Promise<ServiceResult<Campaign[]>>;
  getOneTimeRewards(options?: QueryOptions): Promise<ServiceResult<Campaign[]>>;
  create(campaign: Partial<Campaign>): Promise<ServiceResult<Campaign>>;
  update(id: string, data: Partial<Campaign>): Promise<ServiceResult<Campaign>>;
  updateByOnChainId(onChainId: number, data: Partial<Campaign>): Promise<ServiceResult<Campaign>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
}

export interface IProfileService {
  getByWallet(walletAddress: string): Promise<ServiceResult<Profile>>;
  create(profile: Partial<Profile>): Promise<ServiceResult<Profile>>;
  update(walletAddress: string, data: Partial<Profile>): Promise<ServiceResult<Profile>>;
  upsert(profile: Partial<Profile>): Promise<ServiceResult<Profile>>;
  getByReferralCode(code: string): Promise<ServiceResult<Profile>>;
}

export interface IVoteService {
  getByDApp(dappId: string): Promise<ServiceResult<DAppVote[]>>;
  getByUser(userId: string): Promise<ServiceResult<DAppVote[]>>;
  getUserVoteForDApp(userId: string, dappId: string): Promise<ServiceResult<DAppVote>>;
  create(vote: Partial<DAppVote>): Promise<ServiceResult<DAppVote>>;
  update(id: string, data: Partial<DAppVote>): Promise<ServiceResult<DAppVote>>;
  getTotalForDApp(dappId: string): Promise<ServiceResult<number>>;
}

export interface IScoreService {
  getAll(options?: QueryOptions): Promise<ServiceResult<DAppScore[]>>;
  getAllWithDApps(options?: QueryOptions): Promise<ServiceResult<any[]>>;
  getByDApp(dappId: string): Promise<ServiceResult<DAppScore>>;
  insert(scores: Partial<DAppScore>[]): Promise<ServiceResult<DAppScore[]>>;
  upsert(score: Partial<DAppScore>): Promise<ServiceResult<DAppScore>>;
  update(dappId: string, data: Partial<DAppScore>): Promise<ServiceResult<DAppScore>>;
}

export interface IDiscussionService {
  getByDApp(dappId: string): Promise<ServiceResult<Discussion[]>>;
  create(discussion: Partial<Discussion>): Promise<ServiceResult<Discussion>>;
  update(id: string, data: Partial<Discussion>): Promise<ServiceResult<Discussion>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
  subscribeToChanges(dappId: string, callback: RealtimeCallback<Discussion>): Subscription;
}

export interface IReactionService {
  getByDiscussion(discussionId: string): Promise<ServiceResult<DiscussionReaction[]>>;
  getAll(): Promise<ServiceResult<DiscussionReaction[]>>;
  create(reaction: Partial<DiscussionReaction>): Promise<ServiceResult<DiscussionReaction>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
  deleteByUserAndDiscussion(userId: string, discussionId: string, emojiCode: string): Promise<ServiceResult<boolean>>;
  subscribeToChanges(callback: (payload: any) => void): { unsubscribe: () => void };
}

export interface IBannerService {
  getByType(type: string): Promise<ServiceResult<Banner[]>>;
  getActive(type: string): Promise<ServiceResult<Banner[]>>;
  create(banner: Partial<Banner>): Promise<ServiceResult<Banner>>;
  update(id: string, data: Partial<Banner>): Promise<ServiceResult<Banner>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
}

export interface IGenesisOperatorService {
  getAll(options?: QueryOptions): Promise<ServiceResult<GenesisOperator[]>>;
  getActive(): Promise<ServiceResult<GenesisOperator[]>>;
  create(operator: Partial<GenesisOperator>): Promise<ServiceResult<GenesisOperator>>;
  update(id: string, data: Partial<GenesisOperator>): Promise<ServiceResult<GenesisOperator>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
}

export interface ILearnContentService {
  getAll(options?: QueryOptions): Promise<ServiceResult<LearnContent[]>>;
  getByType(type: string, options?: QueryOptions): Promise<ServiceResult<LearnContent[]>>;
  create(content: Partial<LearnContent>): Promise<ServiceResult<LearnContent>>;
  update(id: string, data: Partial<LearnContent>): Promise<ServiceResult<LearnContent>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
}

export interface INewsService {
  getAll(options?: QueryOptions): Promise<ServiceResult<News[]>>;
  getById(id: string): Promise<ServiceResult<News>>;
  getByCategory(category: string, options?: QueryOptions): Promise<ServiceResult<News[]>>;
  search(query: string, options?: QueryOptions): Promise<ServiceResult<News[]>>;
  create(news: Partial<News>): Promise<ServiceResult<News>>;
  update(id: string, data: Partial<News>): Promise<ServiceResult<News>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
}

export interface IQuestService {
  getByCampaign(campaignId: string): Promise<ServiceResult<CampaignQuest[]>>;
  create(quest: Partial<CampaignQuest>): Promise<ServiceResult<CampaignQuest>>;
  update(id: string, data: Partial<CampaignQuest>): Promise<ServiceResult<CampaignQuest>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
}

export interface IRewardService {
  getByCampaign(campaignId: string): Promise<ServiceResult<CampaignReward[]>>;
  create(reward: Partial<CampaignReward>): Promise<ServiceResult<CampaignReward>>;
  update(id: string, data: Partial<CampaignReward>): Promise<ServiceResult<CampaignReward>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
}

export interface IAnnouncementService {
  getAll(options?: QueryOptions): Promise<ServiceResult<Announcement[]>>;
  getActive(): Promise<ServiceResult<Announcement[]>>;
  create(announcement: Partial<Announcement>): Promise<ServiceResult<Announcement>>;
  update(id: string, data: Partial<Announcement>): Promise<ServiceResult<Announcement>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
}

export interface IEmojiService {
  getAll(): Promise<ServiceResult<EmojiSettings[]>>;
  getActive(): Promise<ServiceResult<EmojiSettings[]>>;
  create(emoji: Partial<EmojiSettings>): Promise<ServiceResult<EmojiSettings>>;
  update(id: string, data: Partial<EmojiSettings>): Promise<ServiceResult<EmojiSettings>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
}

export interface IAuthService {
  getUserRoles(userId: string): Promise<ServiceResult<UserRole[]>>;
  hasRole(userId: string, role: 'admin' | 'user'): Promise<ServiceResult<boolean>>;
  assignRole(userId: string, role: 'admin' | 'user'): Promise<ServiceResult<UserRole>>;
}

export interface IStorageService {
  upload(bucket: string, path: string, file: File): Promise<ServiceResult<string>>;
  getPublicUrl(bucket: string, path: string): string;
  delete(bucket: string, path: string): Promise<ServiceResult<boolean>>;
  list(bucket: string, folder?: string): Promise<ServiceResult<string[]>>;
}

export interface IFunctionService {
  invoke<T = any>(functionName: string, body?: any): Promise<ServiceResult<T>>;
}

export interface IBackendService {
  dapps: IDAppService;
  campaigns: ICampaignService;
  profiles: IProfileService;
  votes: IVoteService;
  scores: IScoreService;
  discussions: IDiscussionService;
  reactions: IReactionService;
  banners: IBannerService;
  operators: IGenesisOperatorService;
  learn: ILearnContentService;
  news: INewsService;
  quests: IQuestService;
  rewards: IRewardService;
  announcements: IAnnouncementService;
  emojis: IEmojiService;
  auth: IAuthService;
  storage: IStorageService;
  functions: IFunctionService;
}