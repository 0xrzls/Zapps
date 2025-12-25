// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, euint16, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ZappsReputation is ZamaEthereumConfig, Ownable {
    uint16 public constant MAX_REPUTATION = 1000;
    uint16 public constant MIN_REPUTATION = 0;
    uint256 public constant DECAY_PERIOD = 30 days;
    uint16 public constant DECAY_RATE = 1;
    
    struct ReputationData {
        euint16 encScore;
        uint256 lastUpdate;
        uint256 lastDecayTime;
        euint16 encVotingRep;
        euint16 encSocialRep;
        euint16 encCommunityRep;
        euint16 encGovernanceRep;
        euint16 encCreatorRep;
        bool initialized;
    }
    
    struct ReputationLevel {
        string name;
        uint16 minScore;
        uint16 maxScore;
    }
    
    mapping(address => ReputationData) public userReputation;
    mapping(address => bool) public authorizedModules;
    ReputationLevel[] public reputationLevels;
    mapping(bytes32 => uint256) public activityMultipliers;
    
    uint256 public totalUsers;
    
    event ReputationUpdated(address indexed user, uint16 points, string reason);
    event ReputationDecayed(address indexed user);
    event ModuleAuthorized(address indexed module, bool status);
    
    error NotAuthorized();
    error InvalidUser();
    error MultiplierTooHigh();
    
    modifier onlyAuthorizedModule() {
        if (!authorizedModules[msg.sender] && msg.sender != owner()) revert NotAuthorized();
        _;
    }
    
    constructor() Ownable(msg.sender) {
        reputationLevels.push(ReputationLevel("Newcomer", 0, 99));
        reputationLevels.push(ReputationLevel("Contributor", 100, 299));
        reputationLevels.push(ReputationLevel("Active Member", 300, 499));
        reputationLevels.push(ReputationLevel("Trusted", 500, 699));
        reputationLevels.push(ReputationLevel("Veteran", 700, 849));
        reputationLevels.push(ReputationLevel("Legend", 850, 949));
        reputationLevels.push(ReputationLevel("Mythic", 950, 1000));
        
        activityMultipliers[keccak256("VOTE_APP")] = 100;
        activityMultipliers[keccak256("VOTE_KOL")] = 150;
        activityMultipliers[keccak256("VOTE_CONTENT")] = 120;
        activityMultipliers[keccak256("POST_CREATE")] = 200;
        activityMultipliers[keccak256("COMMENT_CREATE")] = 50;
        activityMultipliers[keccak256("COMMUNITY_JOIN")] = 100;
        activityMultipliers[keccak256("GOVERNANCE_VOTE")] = 300;
        activityMultipliers[keccak256("CONTENT_REWARD")] = 500;
        activityMultipliers[keccak256("EARLY_DISCOVERY")] = 250;
        activityMultipliers[keccak256("REFERRAL_SUCCESS")] = 200;
        activityMultipliers[keccak256("SOCIAL_ENGAGE")] = 100;
        activityMultipliers[keccak256("DISCUSSION_ACTIVE")] = 80;
        activityMultipliers[keccak256("DAILY_LOGIN")] = 50;
        activityMultipliers[keccak256("CONTENT_QUALITY")] = 500;
    }
    
    function authorizeModule(address module, bool status) external onlyOwner {
        authorizedModules[module] = status;
        emit ModuleAuthorized(module, status);
    }
    
    function setActivityMultiplier(string calldata activityType, uint256 multiplier) external onlyOwner {
        if (multiplier > 10000) revert MultiplierTooHigh();
        activityMultipliers[keccak256(bytes(activityType))] = multiplier;
    }
    
    function _initializeUser(address user) internal {
        ReputationData storage rep = userReputation[user];
        if (!rep.initialized) {
            rep.encScore = FHE.asEuint16(0);
            rep.encVotingRep = FHE.asEuint16(0);
            rep.encSocialRep = FHE.asEuint16(0);
            rep.encCommunityRep = FHE.asEuint16(0);
            rep.encGovernanceRep = FHE.asEuint16(0);
            rep.encCreatorRep = FHE.asEuint16(0);
            rep.lastDecayTime = block.timestamp;
            rep.initialized = true;
            totalUsers++;
            
            FHE.allowThis(rep.encScore);
            FHE.allow(rep.encScore, user);
        }
    }
    
    function addReputation(
        address user,
        string calldata activityType,
        uint16 basePoints,
        bytes32 category
    ) external onlyAuthorizedModule {
        if (user == address(0)) revert InvalidUser();
        
        _initializeUser(user);
        _applyDecay(user);
        
        uint256 multiplier = activityMultipliers[keccak256(bytes(activityType))];
        if (multiplier == 0) multiplier = 100;
        uint16 points = uint16((uint256(basePoints) * multiplier) / 10000);
        if (points == 0 && basePoints > 0) points = 1;
        
        ReputationData storage rep = userReputation[user];
        
        euint16 pointsEnc = FHE.asEuint16(points);
        euint16 newScore = FHE.add(rep.encScore, pointsEnc);
        euint16 maxRep = FHE.asEuint16(MAX_REPUTATION);
        rep.encScore = FHE.select(FHE.gt(newScore, maxRep), maxRep, newScore);
        
        if (category == keccak256("VOTING")) {
            rep.encVotingRep = FHE.add(rep.encVotingRep, pointsEnc);
            FHE.allowThis(rep.encVotingRep);
            FHE.allow(rep.encVotingRep, user);
        } else if (category == keccak256("SOCIAL")) {
            rep.encSocialRep = FHE.add(rep.encSocialRep, pointsEnc);
            FHE.allowThis(rep.encSocialRep);
            FHE.allow(rep.encSocialRep, user);
        } else if (category == keccak256("COMMUNITY")) {
            rep.encCommunityRep = FHE.add(rep.encCommunityRep, pointsEnc);
            FHE.allowThis(rep.encCommunityRep);
            FHE.allow(rep.encCommunityRep, user);
        } else if (category == keccak256("GOVERNANCE")) {
            rep.encGovernanceRep = FHE.add(rep.encGovernanceRep, pointsEnc);
            FHE.allowThis(rep.encGovernanceRep);
            FHE.allow(rep.encGovernanceRep, user);
        } else if (category == keccak256("CREATOR")) {
            rep.encCreatorRep = FHE.add(rep.encCreatorRep, pointsEnc);
            FHE.allowThis(rep.encCreatorRep);
            FHE.allow(rep.encCreatorRep, user);
        }
        
        rep.lastUpdate = block.timestamp;
        
        FHE.allowThis(rep.encScore);
        FHE.allow(rep.encScore, user);
        
        emit ReputationUpdated(user, points, activityType);
    }
    
    function slashReputation(
        address user,
        uint16 points,
        string calldata reason
    ) external onlyAuthorizedModule {
        ReputationData storage rep = userReputation[user];
        if (!rep.initialized) return;
        
        euint16 penalty = FHE.asEuint16(points);
        euint16 minRep = FHE.asEuint16(MIN_REPUTATION);
        
        ebool isUnderflow = FHE.lt(rep.encScore, penalty);
        rep.encScore = FHE.select(isUnderflow, minRep, FHE.sub(rep.encScore, penalty));
        
        rep.lastUpdate = block.timestamp;
        
        FHE.allowThis(rep.encScore);
        FHE.allow(rep.encScore, user);
        
        emit ReputationUpdated(user, points, reason);
    }
    
    function _applyDecay(address user) internal {
        ReputationData storage rep = userReputation[user];
        
        if (!rep.initialized || rep.lastDecayTime == 0) {
            rep.lastDecayTime = block.timestamp;
            return;
        }
        
        uint256 periodsPassed = (block.timestamp - rep.lastDecayTime) / DECAY_PERIOD;
        
        if (periodsPassed > 0) {
            uint16 decayPercent = uint16(DECAY_RATE * periodsPassed);
            if (decayPercent > 100) decayPercent = 100;
            
            euint16 decayPercentEnc = FHE.asEuint16(decayPercent);
            euint16 multiplied = FHE.mul(rep.encScore, decayPercentEnc);
            euint16 decayAmount = FHE.div(multiplied, uint16(100));
            
            euint16 minRep = FHE.asEuint16(MIN_REPUTATION);
            ebool isUnderflow = FHE.lt(rep.encScore, decayAmount);
            rep.encScore = FHE.select(isUnderflow, minRep, FHE.sub(rep.encScore, decayAmount));
            
            FHE.allowThis(rep.encScore);
            FHE.allow(rep.encScore, user);
            
            rep.lastDecayTime = block.timestamp;
            
            emit ReputationDecayed(user);
        }
    }
    
    function triggerDecay(address user) external {
        _applyDecay(user);
    }
    
    function getEncryptedReputation(address user) external view returns (euint16) {
        return userReputation[user].encScore;
    }
    
    function getReputationBreakdown(address user) external view returns (
        euint16 voting,
        euint16 social,
        euint16 community,
        euint16 governance,
        euint16 creator
    ) {
        ReputationData storage rep = userReputation[user];
        return (
            rep.encVotingRep,
            rep.encSocialRep,
            rep.encCommunityRep,
            rep.encGovernanceRep,
            rep.encCreatorRep
        );
    }
    
    function checkMinimumReputation(address user, uint16 minRequired) external returns (ebool) {
        euint16 minReq = FHE.asEuint16(minRequired);
        ebool result = FHE.ge(userReputation[user].encScore, minReq);
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        return result;
    }
    
    function makeReputationPubliclyDecryptable(address user) external {
        ReputationData storage rep = userReputation[user];
        if (rep.initialized) {
            FHE.makePubliclyDecryptable(rep.encScore);
        }
    }
    
    function getUserInfo(address user) external view returns (
        uint256 lastUpdate,
        uint256 lastDecayTime,
        bool initialized
    ) {
        ReputationData storage rep = userReputation[user];
        return (rep.lastUpdate, rep.lastDecayTime, rep.initialized);
    }
    
    function getReputationLevels() external view returns (ReputationLevel[] memory) {
        return reputationLevels;
    }
    
    function getActivityMultiplier(string calldata activityType) external view returns (uint256) {
        return activityMultipliers[keccak256(bytes(activityType))];
    }
}
