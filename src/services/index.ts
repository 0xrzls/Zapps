
import { 
  StaticDAppService,
  StaticOperatorService,
  StaticBannerService,
  StaticCampaignService,
  StaticAnnouncementService,
  StaticLearnService,
  StaticProfileService,
  StaticVoteService,
  StaticScoreService,
  StaticReportService,
  StaticStorageService,
  StaticFunctionService,
  StaticNewsService,
  StaticQuestService,
  StaticRewardService,
  StaticEmojiService,
  StaticDiscussionService,
  StaticReactionService,
  StaticAuthService,
  StaticAuthCoreService,
  StaticUserRewardService,
  StaticReferralService,
  StaticQuestCompletionService,
  StaticUserRewardClaimService,
  StaticAppConfigService,
  StaticFHELogService,
  StaticPushSubscriptionService,
  StaticSubmissionService,
  StaticPageViewService,
  StaticAnalyticsService,
  StaticAttachmentService,
  StaticTwitterCacheService,
  staticRealtimeService,
} from './static';

const dappsService = new StaticDAppService();
const operatorsService = new StaticOperatorService();
const bannersService = new StaticBannerService();
const campaignsService = new StaticCampaignService();
const announcementsService = new StaticAnnouncementService();
const learnService = new StaticLearnService();
const profilesService = new StaticProfileService();
const votesService = new StaticVoteService();
const scoresService = new StaticScoreService();
const reportsService = new StaticReportService();
const storageService = new StaticStorageService();
const functionsService = new StaticFunctionService();
const newsService = new StaticNewsService();
const questsService = new StaticQuestService();
const rewardsService = new StaticRewardService();
const emojisService = new StaticEmojiService();
const discussionsService = new StaticDiscussionService();
const reactionsService = new StaticReactionService();
const authService = new StaticAuthService();
const authCoreService = new StaticAuthCoreService();
const userRewardsService = new StaticUserRewardService();
const referralsService = new StaticReferralService();
const questCompletionsService = new StaticQuestCompletionService();
const userRewardClaimsService = new StaticUserRewardClaimService();
const appConfigService = new StaticAppConfigService();
const fheLogsService = new StaticFHELogService();
const pushSubscriptionsService = new StaticPushSubscriptionService();
const submissionsService = new StaticSubmissionService();
const pageViewsService = new StaticPageViewService();
const analyticsService = new StaticAnalyticsService();
const attachmentsService = new StaticAttachmentService();
const twitterCacheService = new StaticTwitterCacheService();

export const backend = {
  get dapps() { return dappsService; },
  get operators() { return operatorsService; },
  get banners() { return bannersService; },
  get campaigns() { return campaignsService; },
  get announcements() { return announcementsService; },
  get learn() { return learnService; },
  get profiles() { return profilesService; },
  get votes() { return votesService; },
  get scores() { return scoresService; },
  get reports() { return reportsService; },
  get storage() { return storageService; },
  get functions() { return functionsService; },
  get news() { return newsService; },
  get quests() { return questsService; },
  get rewards() { return rewardsService; },
  get emojis() { return emojisService; },
  get discussions() { return discussionsService; },
  get reactions() { return reactionsService; },
  get auth() { return authService; },
  get authCore() { return authCoreService; },
  get userRewards() { return userRewardsService; },
  get referrals() { return referralsService; },
  get questCompletions() { return questCompletionsService; },
  get userRewardClaims() { return userRewardClaimsService; },
  get appConfig() { return appConfigService; },
  get fheLogs() { return fheLogsService; },
  get pushSubscriptions() { return pushSubscriptionsService; },
  get submissions() { return submissionsService; },
  get pageViews() { return pageViewsService; },
  get realtime() { return staticRealtimeService; },
  get analytics() { return analyticsService; },
  get attachments() { return attachmentsService; },
  get twitterCache() { return twitterCacheService; },
};

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export * from './static';
