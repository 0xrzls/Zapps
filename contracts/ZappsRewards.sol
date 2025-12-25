// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IZappsToken {
    function mint(address to, uint64 amount) external;
}

interface IZappsReputation {
    function addReputation(address user, string calldata activityType, uint16 points, bytes32 category) external;
}

contract ZappsRewards is ZamaEthereumConfig {
    uint32 public constant MAX_REFERRALS = 100;
    uint256 public constant DAILY_STREAK_WINDOW = 1 days;
    
    address public owner;
    address public zappsToken;
    address public zappsReputation;
    
    uint64 public dailyReward = 10 * 10**6;
    uint64 public referrerReward = 30 * 10**6;
    uint64 public referredReward = 20 * 10**6;
    uint64 public streakBonusMultiplier = 10;
    
    struct UserRewardState {
        uint256 lastLoginTime;
        euint32 encLoginStreak;
        euint64 encDailyEarned;
        euint64 encReferralEarned;
        euint64 encQuestEarned;
        euint64 encContentEarned;
        euint64 encTotalEarned;
        address referrer;
        euint32 encReferralCount;
        bool initialized;
    }
    
    struct Quest {
        string name;
        string description;
        uint64 rewardAmount;
        uint16 reputationPoints;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 maxCompletions;
        uint256 currentCompletions;
    }
    
    struct Achievement {
        string name;
        uint64 rewardAmount;
        uint16 reputationBonus;
        bool isSecret;
    }
    
    mapping(address => UserRewardState) private users;
    mapping(address => mapping(address => bool)) private hasReferred;
    mapping(address => mapping(bytes32 => bool)) private completedQuests;
    mapping(address => mapping(bytes32 => bool)) private unlockedAchievements;
    mapping(bytes32 => Quest) public quests;
    mapping(bytes32 => Achievement) public achievements;
    
    euint64 private encTotalDistributed;
    
    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);
    event DailyRewardClaimed(address indexed user, uint64 reward);
    event ReferralRegistered(address indexed referrer, address indexed referred);
    event ReferralRewardClaimed(address indexed user, bool isReferrer);
    event QuestCreated(bytes32 indexed questId, string name);
    event QuestCompleted(address indexed user, bytes32 indexed questId);
    event AchievementCreated(bytes32 indexed achievementId, string name);
    event AchievementUnlocked(address indexed user, bytes32 indexed achievementId);
    event ContentRewarded(address indexed creator, uint64 amount);
    
    error NotOwner();
    error InvalidOwner();
    error InvalidToken();
    error InvalidAmount();
    error AlreadyClaimed();
    error CannotSelfRefer();
    error InvalidReferrer();
    error AlreadyUsedReferral();
    error AlreadyReferred();
    error QuestNotActive();
    error QuestExpired();
    error QuestAlreadyCompleted();
    error QuestMaxCompletions();
    error AchievementAlreadyUnlocked();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    constructor(address _zappsToken) {
        if (_zappsToken == address(0)) revert InvalidToken();
        owner = msg.sender;
        zappsToken = _zappsToken;
        encTotalDistributed = FHE.asEuint64(0);
        FHE.allowThis(encTotalDistributed);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function setZappsReputation(address _reputation) external onlyOwner {
        zappsReputation = _reputation;
    }
    
    function setDailyReward(uint64 amount) external onlyOwner {
        if (amount == 0) revert InvalidAmount();
        dailyReward = amount;
    }
    
    function setReferralRewards(uint64 _referrerReward, uint64 _referredReward) external onlyOwner {
        if (_referrerReward == 0 || _referredReward == 0) revert InvalidAmount();
        referrerReward = _referrerReward;
        referredReward = _referredReward;
    }
    
    function setStreakBonusMultiplier(uint64 multiplier) external onlyOwner {
        streakBonusMultiplier = multiplier;
    }
    
    function _initializeUser(address user) internal {
        UserRewardState storage state = users[user];
        if (!state.initialized) {
            state.encLoginStreak = FHE.asEuint32(0);
            state.encDailyEarned = FHE.asEuint64(0);
            state.encReferralEarned = FHE.asEuint64(0);
            state.encQuestEarned = FHE.asEuint64(0);
            state.encContentEarned = FHE.asEuint64(0);
            state.encTotalEarned = FHE.asEuint64(0);
            state.encReferralCount = FHE.asEuint32(0);
            state.initialized = true;
            
            FHE.allowThis(state.encLoginStreak);
            FHE.allowThis(state.encTotalEarned);
            FHE.allow(state.encLoginStreak, user);
            FHE.allow(state.encTotalEarned, user);
        }
    }
    
    function claimDailyReward() external returns (uint64 reward) {
        _initializeUser(msg.sender);
        UserRewardState storage user = users[msg.sender];
        
        if (block.timestamp < user.lastLoginTime + DAILY_STREAK_WINDOW) revert AlreadyClaimed();
        
        bool isConsecutive = user.lastLoginTime > 0 && 
            (block.timestamp - user.lastLoginTime) < (DAILY_STREAK_WINDOW * 2);
        
        euint32 one = FHE.asEuint32(1);
        user.encLoginStreak = isConsecutive 
            ? FHE.add(user.encLoginStreak, one)
            : one;
        
        FHE.allowThis(user.encLoginStreak);
        FHE.allow(user.encLoginStreak, msg.sender);
        
        reward = dailyReward;
        user.lastLoginTime = block.timestamp;
        
        _addReward(msg.sender, reward, RewardType.DAILY);
        
        emit DailyRewardClaimed(msg.sender, reward);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                msg.sender,
                "DAILY_LOGIN",
                5,
                keccak256("ENGAGEMENT")
            );
        }
        
        return reward;
    }
    
    function registerReferral(address referrer) external {
        if (referrer == msg.sender) revert CannotSelfRefer();
        if (referrer == address(0)) revert InvalidReferrer();
        
        _initializeUser(msg.sender);
        _initializeUser(referrer);
        
        UserRewardState storage referred = users[msg.sender];
        UserRewardState storage referrerUser = users[referrer];
        
        if (referred.referrer != address(0)) revert AlreadyUsedReferral();
        if (hasReferred[referrer][msg.sender]) revert AlreadyReferred();
        
        referred.referrer = referrer;
        hasReferred[referrer][msg.sender] = true;
        
        referrerUser.encReferralCount = FHE.add(referrerUser.encReferralCount, FHE.asEuint32(1));
        FHE.allowThis(referrerUser.encReferralCount);
        FHE.allow(referrerUser.encReferralCount, referrer);
        
        _addReward(referrer, referrerReward, RewardType.REFERRAL);
        _addReward(msg.sender, referredReward, RewardType.REFERRAL);
        
        emit ReferralRegistered(referrer, msg.sender);
        emit ReferralRewardClaimed(referrer, true);
        emit ReferralRewardClaimed(msg.sender, false);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                referrer,
                "REFERRAL_SUCCESS",
                20,
                keccak256("GROWTH")
            );
        }
    }
    
    function createQuest(
        bytes32 questId,
        string calldata name,
        string calldata description,
        uint64 rewardAmount,
        uint16 reputationPoints,
        uint256 duration,
        uint256 maxCompletions
    ) external onlyOwner {
        Quest storage quest = quests[questId];
        quest.name = name;
        quest.description = description;
        quest.rewardAmount = rewardAmount;
        quest.reputationPoints = reputationPoints;
        quest.startTime = block.timestamp;
        quest.endTime = block.timestamp + duration;
        quest.isActive = true;
        quest.maxCompletions = maxCompletions;
        
        emit QuestCreated(questId, name);
    }
    
    function deactivateQuest(bytes32 questId) external onlyOwner {
        quests[questId].isActive = false;
    }
    
    function completeQuest(address user, bytes32 questId) external onlyOwner returns (uint64) {
        Quest storage quest = quests[questId];
        if (!quest.isActive) revert QuestNotActive();
        if (block.timestamp > quest.endTime) revert QuestExpired();
        if (completedQuests[user][questId]) revert QuestAlreadyCompleted();
        if (quest.maxCompletions > 0 && quest.currentCompletions >= quest.maxCompletions) {
            revert QuestMaxCompletions();
        }
        
        _initializeUser(user);
        completedQuests[user][questId] = true;
        quest.currentCompletions++;
        
        _addReward(user, quest.rewardAmount, RewardType.QUEST);
        
        emit QuestCompleted(user, questId);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                user,
                quest.name,
                quest.reputationPoints,
                keccak256("QUEST")
            );
        }
        
        return quest.rewardAmount;
    }
    
    function createAchievement(
        bytes32 achievementId,
        string calldata name,
        uint64 rewardAmount,
        uint16 reputationBonus,
        bool isSecret
    ) external onlyOwner {
        Achievement storage achievement = achievements[achievementId];
        achievement.name = name;
        achievement.rewardAmount = rewardAmount;
        achievement.reputationBonus = reputationBonus;
        achievement.isSecret = isSecret;
        
        emit AchievementCreated(achievementId, name);
    }
    
    function unlockAchievement(address user, bytes32 achievementId) external onlyOwner returns (uint64) {
        Achievement storage achievement = achievements[achievementId];
        if (unlockedAchievements[user][achievementId]) revert AchievementAlreadyUnlocked();
        
        _initializeUser(user);
        unlockedAchievements[user][achievementId] = true;
        
        _addReward(user, achievement.rewardAmount, RewardType.OTHER);
        
        emit AchievementUnlocked(user, achievementId);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                user,
                achievement.name,
                achievement.reputationBonus,
                keccak256("ACHIEVEMENT")
            );
        }
        
        return achievement.rewardAmount;
    }
    
    function rewardContent(address creator, uint64 amount) external onlyOwner {
        _initializeUser(creator);
        _addReward(creator, amount, RewardType.CONTENT);
        
        emit ContentRewarded(creator, amount);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                creator,
                "CONTENT_QUALITY",
                50,
                keccak256("CREATOR")
            );
        }
    }
    
    enum RewardType { DAILY, REFERRAL, QUEST, CONTENT, OTHER }
    
    function _addReward(address user, uint64 amount, RewardType rewardType) internal {
        UserRewardState storage userState = users[user];
        
        euint64 encAmount = FHE.asEuint64(amount);
        
        if (rewardType == RewardType.DAILY) {
            userState.encDailyEarned = FHE.add(userState.encDailyEarned, encAmount);
            FHE.allowThis(userState.encDailyEarned);
            FHE.allow(userState.encDailyEarned, user);
        } else if (rewardType == RewardType.REFERRAL) {
            userState.encReferralEarned = FHE.add(userState.encReferralEarned, encAmount);
            FHE.allowThis(userState.encReferralEarned);
            FHE.allow(userState.encReferralEarned, user);
        } else if (rewardType == RewardType.QUEST) {
            userState.encQuestEarned = FHE.add(userState.encQuestEarned, encAmount);
            FHE.allowThis(userState.encQuestEarned);
            FHE.allow(userState.encQuestEarned, user);
        } else if (rewardType == RewardType.CONTENT) {
            userState.encContentEarned = FHE.add(userState.encContentEarned, encAmount);
            FHE.allowThis(userState.encContentEarned);
            FHE.allow(userState.encContentEarned, user);
        }
        
        userState.encTotalEarned = FHE.add(userState.encTotalEarned, encAmount);
        FHE.allowThis(userState.encTotalEarned);
        FHE.allow(userState.encTotalEarned, user);
        
        IZappsToken(zappsToken).mint(user, amount);
        
        encTotalDistributed = FHE.add(encTotalDistributed, encAmount);
        FHE.allowThis(encTotalDistributed);
    }
    
    function getEncryptedEarnings(address user) external view returns (euint64) {
        return users[user].encTotalEarned;
    }
    
    function getEncryptedDailyEarned(address user) external view returns (euint64) {
        return users[user].encDailyEarned;
    }
    
    function getEncryptedReferralEarned(address user) external view returns (euint64) {
        return users[user].encReferralEarned;
    }
    
    function getEncryptedQuestEarned(address user) external view returns (euint64) {
        return users[user].encQuestEarned;
    }
    
    function getEncryptedContentEarned(address user) external view returns (euint64) {
        return users[user].encContentEarned;
    }
    
    function getEncryptedLoginStreak(address user) external view returns (euint32) {
        return users[user].encLoginStreak;
    }
    
    function getEncryptedReferralCount(address user) external view returns (euint32) {
        return users[user].encReferralCount;
    }
    
    function getDailyLoginInfo(address user) external view returns (
        uint256 lastLogin,
        address referrer,
        bool canClaim
    ) {
        UserRewardState storage userState = users[user];
        bool _canClaim = block.timestamp >= userState.lastLoginTime + DAILY_STREAK_WINDOW;
        return (userState.lastLoginTime, userState.referrer, _canClaim);
    }
    
    function hasCompletedQuest(address user, bytes32 questId) external view returns (bool) {
        return completedQuests[user][questId];
    }
    
    function hasUnlockedAchievement(address user, bytes32 achievementId) external view returns (bool) {
        return unlockedAchievements[user][achievementId];
    }
    
    function getQuestInfo(bytes32 questId) external view returns (
        string memory name,
        uint64 rewardAmount,
        uint256 endTime,
        bool isActive,
        uint256 completions,
        uint256 maxCompletions
    ) {
        Quest storage quest = quests[questId];
        return (
            quest.name,
            quest.rewardAmount,
            quest.endTime,
            quest.isActive,
            quest.currentCompletions,
            quest.maxCompletions
        );
    }
}
