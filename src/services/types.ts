export interface DApp {
  id: string;
  name: string;
  description: string;
  long_description?: string | null;
  category: string;
  categories?: string[] | null;
  logo_url?: string | null;
  cover_image?: string | null;
  website_url?: string | null;
  twitter?: string | null;
  discord?: string | null;
  github?: string | null;
  contract_address?: string | null;
  rating?: number | null;
  view_count?: number | null;
  users_count?: number | null;
  tvl?: number | null;
  tags?: string[] | null;
  features?: string[] | null;
  badge?: string | null;
  is_featured?: boolean | null;
  screenshots?: string[] | null;
  desktop_screenshots?: any;
  mobile_screenshots?: any;
  genesis_operator_ids?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  cover_image?: string | null;
  logo?: string | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  is_featured: boolean;
  is_active: boolean;
  dapp_id?: string | null;
  category?: string | null;
  reward_amount?: number | null;
  reward_token?: string | null;
  max_participants?: number | null;
  participants_count?: number | null;
  hosted_by?: string[] | null;
  display_target: string;
  campaign_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  wallet_address: string;
  referral_code?: string | null;
  referred_by?: string | null;
  rvp_balance?: number | null;
  twitter_connected?: boolean | null;
  twitter_username?: string | null;
  twitter_user_id?: string | null;
  twitter_access_token?: string | null;
  twitter_refresh_token?: string | null;
  twitter_code_verifier?: string | null;
  twitter_state?: string | null;
  twitter_verified?: boolean | null;
  twitter_connected_at?: string | null;
  discord_connected?: boolean | null;
  discord_username?: string | null;
  discord_user_id?: string | null;
  discord_access_token?: string | null;
  discord_refresh_token?: string | null;
  discord_state?: string | null;
  discord_verified?: boolean | null;
  discord_connected_at?: string | null;
  discord_token_expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DAppVote {
  id: string;
  dapp_id: string;
  user_id: string;
  vote_amount: number;
  rating?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface DAppScore {
  id: string;
  dapp_id: string;
  social_score?: number | null;
  trust_score?: number | null;
  user_score?: number | null;
  vote_score?: number | null;
  pending_since?: string | null;
  pending_attempts: number;
  last_snapshot_req_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: string;
  dapp_id: string;
  user_id: string;
  message: string;
  parent_id?: string | null;
  is_edited?: boolean | null;
  edited_at?: string | null;
  created_at?: string | null;
}

export interface DiscussionReaction {
  id: string;
  discussion_id: string;
  user_id: string;
  emoji_code: string;
  created_at: string;
}

export interface DiscussionAttachment {
  id: string;
  discussion_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  status: string;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  cta_text?: string | null;
  cta_link?: string | null;
  cta_text_2?: string | null;
  cta_link_2?: string | null;
  banner_type: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenesisOperator {
  id: string;
  name: string;
  logo_url?: string | null;
  website_url?: string | null;
  gradient: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearnContent {
  id: string;
  title: string;
  description: string;
  author: string;
  content_type: string;
  content_url?: string | null;
  thumbnail_url?: string | null;
  duration?: string | null;
  difficulty?: string | null;
  read_time?: string | null;
  views?: number | null;
  publish_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  image_url?: string | null;
  source: string;
  author?: string | null;
  category?: string | null;
  tags?: string[] | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignQuest {
  id: string;
  campaign_id: string;
  title: string;
  description: string;
  quest_type: string;
  quest_order: number;
  points: number;
  link?: string | null;
  guide?: string | null;
  auto_verify?: boolean | null;
  verification_method: string;
  verification_config?: any;
  quest_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CampaignReward {
  id: string;
  campaign_id: string;
  reward_name: string;
  reward_type: string;
  reward_config: any;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type: string;
  display_on_all_pages: boolean;
  display_on_pages?: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface DAppSubmission {
  id: string;
  submitter_name: string;
  submitter_email: string;
  submitter_wallet?: string | null;
  submission_type: string;
  name: string;
  description: string;
  long_description?: string | null;
  category: string;
  logo_url?: string | null;
  cover_image?: string | null;
  website_url?: string | null;
  twitter?: string | null;
  discord?: string | null;
  github?: string | null;
  contract_address?: string | null;
  tags?: string[] | null;
  features?: string[] | null;
  screenshots?: string[] | null;
  desktop_screenshots?: any;
  mobile_screenshots?: any;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string | null;
  dapp_id?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DAppReport {
  id: string;
  dapp_id: string;
  user_id?: string | null;
  reason: string;
  message: string;
  screenshot_url?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DAppPageView {
  id: string;
  dapp_id: string;
  user_id?: string | null;
  session_id?: string | null;
  viewed_at?: string | null;
}

export interface QuestCompletion {
  id: string;
  quest_id: string;
  user_id: string;
  completed?: boolean | null;
  verified?: boolean | null;
  verification_data?: any;
  twitter_user_id?: string | null;
  discord_user_id?: string | null;
  completed_at?: string | null;
  verified_at?: string | null;
  created_at: string;
}

export interface UserQuestProgress {
  id: string;
  quest_id: string;
  user_id: string;
  completed?: boolean | null;
  completed_at?: string | null;
  created_at: string;
}

export interface UserRewardClaim {
  id: string;
  campaign_id: string;
  reward_id: string;
  user_id: string;
  claimed?: boolean | null;
  claim_data?: any;
  claimed_at?: string | null;
  created_at: string;
}

export interface UserReward {
  id: string;
  wallet_address: string;
  last_daily_claim?: string | null;
  twitter_followed?: boolean | null;
  last_twitter_post?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReferralClaim {
  id: string;
  referrer_wallet: string;
  referred_wallet: string;
  votes_count?: number | null;
  reward_claimed?: boolean | null;
  claimed_at?: string | null;
  created_at?: string | null;
}

export interface PushSubscription {
  id: string;
  wallet_address: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
  updated_at: string;
}

export interface EmojiSettings {
  id: string;
  emoji_code: string;
  emoji_label: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FHELog {
  id: string;
  dapp_id: string;
  level: string;
  message: string;
  details?: any;
  created_at: string;
}

export interface TwitterCache {
  id: string;
  username: string;
  tweets: any;
  cached_at: string;
}

export interface AppConfig {
  key: string;
  value: any;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
}

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}) => void;

export interface Subscription {
  unsubscribe: () => void;
}