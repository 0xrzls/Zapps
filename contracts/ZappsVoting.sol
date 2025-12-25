// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, euint64, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IZappsToken {
    function burn(address from, uint64 amount) external;
}

interface IZappsReputation {
    function addReputation(address user, string calldata activityType, uint16 points, bytes32 category) external;
}

contract ZappsVoting is ZamaEthereumConfig {
    uint8 public constant MAX_VOTES_PER_TARGET = 3;
    uint8 public constant MIN_RATING = 1;
    uint8 public constant MAX_RATING = 5;
    
    address public owner;
    address public zappsToken;
    address public zappsReputation;
    uint64 public votePrice;
    bool public paused;
    
    enum TargetType { APP, KOL, CONTENT }
    
    struct VoteTarget {
        TargetType targetType;
        euint32 encSum;
        euint32 encCount;
        uint32 decSum;
        uint32 decCount;
        uint256 lastDecryptTime;
        bool exists;
        uint256 createdAt;
        uint256 totalVotes;
        uint256 lastVoteTime;
    }
    
    struct UserVote {
        euint8[] ratings;
        uint256[] timestamps;
        uint8 voteCount;
    }
    
    mapping(bytes32 => VoteTarget) public targets;
    mapping(bytes32 => mapping(address => UserVote)) private userVotes;
    mapping(bytes32 => address[]) private targetVoters;
    mapping(bytes32 => mapping(address => bool)) private hasVoted;
    
    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);
    event VotePriceChanged(uint64 newPrice);
    event Paused(bool isPaused);
    event TargetInitialized(bytes32 indexed targetId, TargetType targetType, uint256 timestamp);
    event VoteSubmitted(bytes32 indexed targetId, address indexed voter, uint8 voteNumber, uint256 timestamp);
    event AverageUpdated(bytes32 indexed targetId, uint32 sum, uint32 count, uint256 average, uint256 timestamp);
    event DecryptionDataReady(bytes32 indexed targetId, euint32 encSum, euint32 encCount);
    
    error NotOwner();
    error IsPaused();
    error TargetNotExists();
    error InvalidToken();
    error InvalidPrice();
    error InvalidOwner();
    error VoteLimitReached();
    error InvalidProof();
    error CountDecreased();
    error SumExceedsMax();
    error SumBelowMin();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    modifier whenNotPaused() {
        if (paused) revert IsPaused();
        _;
    }
    
    modifier validTarget(bytes32 targetId) {
        if (!targets[targetId].exists) revert TargetNotExists();
        _;
    }
    
    constructor(address _zappsToken, uint64 _votePrice) {
        if (_zappsToken == address(0)) revert InvalidToken();
        if (_votePrice == 0) revert InvalidPrice();
        owner = msg.sender;
        zappsToken = _zappsToken;
        votePrice = _votePrice;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }
    
    function setVotePrice(uint64 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidPrice();
        votePrice = newPrice;
        emit VotePriceChanged(newPrice);
    }
    
    function setZappsReputation(address _reputation) external onlyOwner {
        zappsReputation = _reputation;
    }
    
    function _ensureTarget(bytes32 targetId, TargetType targetType) internal {
        if (!targets[targetId].exists) {
            VoteTarget storage target = targets[targetId];
            target.targetType = targetType;
            target.encSum = FHE.asEuint32(0);
            target.encCount = FHE.asEuint32(0);
            target.exists = true;
            target.createdAt = block.timestamp;
            
            FHE.allowThis(target.encSum);
            FHE.allowThis(target.encCount);
            
            emit TargetInitialized(targetId, targetType, block.timestamp);
        }
    }
    
    function _enforceRatingRange(euint8 rating) internal returns (euint8) {
        euint8 minVal = FHE.asEuint8(MIN_RATING);
        euint8 maxVal = FHE.asEuint8(MAX_RATING);
        euint8 clamped = FHE.select(FHE.lt(rating, minVal), minVal, rating);
        clamped = FHE.select(FHE.gt(clamped, maxVal), maxVal, clamped);
        return clamped;
    }
    
    function vote(
        bytes32 targetId,
        TargetType targetType,
        externalEuint8 encRating,
        bytes calldata proof
    ) external whenNotPaused {
        _ensureTarget(targetId, targetType);
        
        UserVote storage userVote = userVotes[targetId][msg.sender];
        if (userVote.voteCount >= MAX_VOTES_PER_TARGET) revert VoteLimitReached();
        
        IZappsToken(zappsToken).burn(msg.sender, votePrice);
        
        euint8 rating = FHE.fromExternal(encRating, proof);
        euint8 clampedRating = _enforceRatingRange(rating);
        euint32 rating32 = FHE.asEuint32(clampedRating);
        
        VoteTarget storage target = targets[targetId];
        target.encSum = FHE.add(target.encSum, rating32);
        target.encCount = FHE.add(target.encCount, FHE.asEuint32(1));
        target.lastVoteTime = block.timestamp;
        
        FHE.allowThis(target.encSum);
        FHE.allowThis(target.encCount);
        FHE.allow(clampedRating, msg.sender);
        
        userVote.ratings.push(clampedRating);
        userVote.timestamps.push(block.timestamp);
        userVote.voteCount++;
        
        if (!hasVoted[targetId][msg.sender]) {
            targetVoters[targetId].push(msg.sender);
            hasVoted[targetId][msg.sender] = true;
        }
        
        target.totalVotes++;
        
        emit VoteSubmitted(targetId, msg.sender, userVote.voteCount, block.timestamp);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                msg.sender,
                targetType == TargetType.APP ? "VOTE_APP" : 
                targetType == TargetType.KOL ? "VOTE_KOL" : "VOTE_CONTENT",
                10,
                keccak256("VOTING")
            );
        }
    }
    
    function requestDecryptionData(bytes32 targetId) external validTarget(targetId) {
        VoteTarget storage target = targets[targetId];
        FHE.makePubliclyDecryptable(target.encSum);
        FHE.makePubliclyDecryptable(target.encCount);
        emit DecryptionDataReady(targetId, target.encSum, target.encCount);
    }
    
    function verifyAndStoreDecryption(
        bytes32 targetId,
        bytes memory abiEncodedValues,
        bytes memory decryptionProof
    ) external validTarget(targetId) {
        VoteTarget storage target = targets[targetId];
        
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(target.encSum);
        cts[1] = FHE.toBytes32(target.encCount);
        
        FHE.checkSignatures(cts, abiEncodedValues, decryptionProof);
        
        (uint32 sum, uint32 count) = abi.decode(abiEncodedValues, (uint32, uint32));
        
        if (count < target.decCount) revert CountDecreased();
        if (sum > count * MAX_RATING) revert SumExceedsMax();
        if (count > 0 && sum < count * MIN_RATING) revert SumBelowMin();
        
        target.decSum = sum;
        target.decCount = count;
        target.lastDecryptTime = block.timestamp;
        
        uint256 average = count > 0 ? (uint256(sum) * 100) / uint256(count) : 0;
        emit AverageUpdated(targetId, sum, count, average, block.timestamp);
    }
    
    function getEncryptedData(bytes32 targetId) external view validTarget(targetId) returns (euint32, euint32) {
        VoteTarget storage target = targets[targetId];
        return (target.encSum, target.encCount);
    }
    
    function getAverageRating(bytes32 targetId) external view validTarget(targetId) returns (uint256) {
        VoteTarget storage target = targets[targetId];
        if (target.decCount == 0) return 0;
        return (uint256(target.decSum) * 100) / uint256(target.decCount);
    }
    
    function getTargetData(bytes32 targetId) external view validTarget(targetId) returns (
        TargetType targetType,
        uint32 sum,
        uint32 count,
        uint256 average,
        uint256 totalVotes,
        uint256 uniqueVoters,
        uint256 lastUpdate
    ) {
        VoteTarget storage target = targets[targetId];
        average = target.decCount > 0 ? (uint256(target.decSum) * 100) / uint256(target.decCount) : 0;
        
        return (
            target.targetType,
            target.decSum,
            target.decCount,
            average,
            target.totalVotes,
            targetVoters[targetId].length,
            target.lastDecryptTime
        );
    }
    
    function getUserVoteInfo(bytes32 targetId, address user) external view returns (
        uint8 voteCount,
        uint256[] memory timestamps,
        bool canVote
    ) {
        UserVote storage userVote = userVotes[targetId][user];
        return (userVote.voteCount, userVote.timestamps, userVote.voteCount < MAX_VOTES_PER_TARGET);
    }
    
    function getTargetVoters(bytes32 targetId) external view validTarget(targetId) returns (address[] memory) {
        return targetVoters[targetId];
    }
    
    function getUserEncryptedRating(bytes32 targetId, address user, uint8 index) external view returns (euint8) {
        UserVote storage userVote = userVotes[targetId][user];
        require(index < userVote.voteCount, "Index out of bounds");
        return userVote.ratings[index];
    }
}
