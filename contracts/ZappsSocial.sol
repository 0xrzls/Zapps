// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IZappsReputation {
    function addReputation(address user, string calldata activityType, uint16 points, bytes32 category) external;
}

contract ZappsSocial is ZamaEthereumConfig {
    address public owner;
    address public zappsReputation;
    
    enum PrivacyMode { PUBLIC, ANON_AUTHOR, GATED, ENCRYPTED }
    enum FollowMode { PUBLIC, ANON, STEALTH }
    
    struct Post {
        address author;
        bytes32 contentHash;
        uint256 timestamp;
        PrivacyMode privacyMode;
        uint16 minReputationRequired;
        euint32 encUpvotes;
        euint32 encDownvotes;
        uint32 pubUpvotes;
        uint32 pubDownvotes;
        bool exists;
    }
    
    struct SocialData {
        euint32 encFollowerCount;
        euint32 encFollowingCount;
        uint32 pubFollowerCount;
        uint32 pubFollowingCount;
        bool initialized;
    }
    
    mapping(bytes32 => Post) public posts;
    mapping(address => SocialData) private socialGraph;
    mapping(address => mapping(address => FollowMode)) private followMode;
    mapping(address => mapping(address => bool)) private isFollowing;
    mapping(address => mapping(address => bool)) private isFollower;
    mapping(bytes32 => mapping(address => bool)) public hasUpvoted;
    mapping(bytes32 => mapping(address => bool)) public hasDownvoted;
    
    bytes32[] public allPosts;
    
    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);
    event PostCreated(bytes32 indexed postId, address indexed author, PrivacyMode mode, uint256 timestamp);
    event PostVoted(bytes32 indexed postId, address indexed voter, bool isUpvote);
    event Followed(address indexed follower, address indexed following, FollowMode mode);
    event Unfollowed(address indexed follower, address indexed following);
    
    error NotOwner();
    error InvalidOwner();
    error PostExists();
    error PostNotExists();
    error AlreadyUpvoted();
    error AlreadyDownvoted();
    error InvalidTarget();
    error AlreadyFollowing();
    error NotFollowing();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function setZappsReputation(address _reputation) external onlyOwner {
        zappsReputation = _reputation;
    }
    
    function _initializeSocialData(address user) internal {
        if (!socialGraph[user].initialized) {
            socialGraph[user].encFollowerCount = FHE.asEuint32(0);
            socialGraph[user].encFollowingCount = FHE.asEuint32(0);
            socialGraph[user].initialized = true;
            
            FHE.allowThis(socialGraph[user].encFollowerCount);
            FHE.allowThis(socialGraph[user].encFollowingCount);
            FHE.allow(socialGraph[user].encFollowerCount, user);
            FHE.allow(socialGraph[user].encFollowingCount, user);
        }
    }
    
    function createPost(
        string calldata content,
        PrivacyMode privacyMode,
        uint16 minReputationRequired
    ) external returns (bytes32 postId) {
        bytes32 contentHash = keccak256(bytes(content));
        postId = keccak256(abi.encodePacked(msg.sender, contentHash, block.timestamp));
        
        if (posts[postId].exists) revert PostExists();
        
        Post storage post = posts[postId];
        post.author = msg.sender;
        post.contentHash = contentHash;
        post.timestamp = block.timestamp;
        post.privacyMode = privacyMode;
        post.minReputationRequired = minReputationRequired;
        post.encUpvotes = FHE.asEuint32(0);
        post.encDownvotes = FHE.asEuint32(0);
        post.exists = true;
        
        FHE.allowThis(post.encUpvotes);
        FHE.allowThis(post.encDownvotes);
        
        allPosts.push(postId);
        
        emit PostCreated(postId, msg.sender, privacyMode, block.timestamp);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                msg.sender,
                "POST_CREATE",
                20,
                keccak256("SOCIAL")
            );
        }
        
        return postId;
    }
    
    function upvote(bytes32 postId) external {
        if (!posts[postId].exists) revert PostNotExists();
        if (hasUpvoted[postId][msg.sender]) revert AlreadyUpvoted();
        
        Post storage post = posts[postId];
        
        if (hasDownvoted[postId][msg.sender]) {
            post.encDownvotes = FHE.sub(post.encDownvotes, FHE.asEuint32(1));
            FHE.allowThis(post.encDownvotes);
            hasDownvoted[postId][msg.sender] = false;
            if (post.pubDownvotes > 0) post.pubDownvotes--;
        }
        
        post.encUpvotes = FHE.add(post.encUpvotes, FHE.asEuint32(1));
        hasUpvoted[postId][msg.sender] = true;
        post.pubUpvotes++;
        
        FHE.allowThis(post.encUpvotes);
        
        emit PostVoted(postId, msg.sender, true);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                post.author,
                "CONTENT_REWARD",
                5,
                keccak256("CREATOR")
            );
        }
    }
    
    function downvote(bytes32 postId) external {
        if (!posts[postId].exists) revert PostNotExists();
        if (hasDownvoted[postId][msg.sender]) revert AlreadyDownvoted();
        
        Post storage post = posts[postId];
        
        if (hasUpvoted[postId][msg.sender]) {
            post.encUpvotes = FHE.sub(post.encUpvotes, FHE.asEuint32(1));
            FHE.allowThis(post.encUpvotes);
            hasUpvoted[postId][msg.sender] = false;
            if (post.pubUpvotes > 0) post.pubUpvotes--;
        }
        
        post.encDownvotes = FHE.add(post.encDownvotes, FHE.asEuint32(1));
        hasDownvoted[postId][msg.sender] = true;
        post.pubDownvotes++;
        
        FHE.allowThis(post.encDownvotes);
        
        emit PostVoted(postId, msg.sender, false);
    }
    
    function follow(address target, FollowMode mode) external {
        if (target == address(0) || target == msg.sender) revert InvalidTarget();
        if (isFollowing[msg.sender][target]) revert AlreadyFollowing();
        
        _initializeSocialData(target);
        _initializeSocialData(msg.sender);
        
        SocialData storage targetData = socialGraph[target];
        SocialData storage followerData = socialGraph[msg.sender];
        
        targetData.encFollowerCount = FHE.add(targetData.encFollowerCount, FHE.asEuint32(1));
        followerData.encFollowingCount = FHE.add(followerData.encFollowingCount, FHE.asEuint32(1));
        targetData.pubFollowerCount++;
        followerData.pubFollowingCount++;
        
        isFollowing[msg.sender][target] = true;
        isFollower[target][msg.sender] = true;
        followMode[msg.sender][target] = mode;
        
        FHE.allowThis(targetData.encFollowerCount);
        FHE.allowThis(followerData.encFollowingCount);
        FHE.allow(targetData.encFollowerCount, target);
        FHE.allow(followerData.encFollowingCount, msg.sender);
        
        emit Followed(msg.sender, target, mode);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                msg.sender,
                "SOCIAL_ENGAGE",
                5,
                keccak256("SOCIAL")
            );
        }
    }
    
    function unfollow(address target) external {
        if (!isFollowing[msg.sender][target]) revert NotFollowing();
        
        SocialData storage targetData = socialGraph[target];
        SocialData storage followerData = socialGraph[msg.sender];
        
        targetData.encFollowerCount = FHE.sub(targetData.encFollowerCount, FHE.asEuint32(1));
        followerData.encFollowingCount = FHE.sub(followerData.encFollowingCount, FHE.asEuint32(1));
        
        if (targetData.pubFollowerCount > 0) targetData.pubFollowerCount--;
        if (followerData.pubFollowingCount > 0) followerData.pubFollowingCount--;
        
        isFollowing[msg.sender][target] = false;
        isFollower[target][msg.sender] = false;
        delete followMode[msg.sender][target];
        
        FHE.allowThis(targetData.encFollowerCount);
        FHE.allowThis(followerData.encFollowingCount);
        FHE.allow(targetData.encFollowerCount, target);
        FHE.allow(followerData.encFollowingCount, msg.sender);
        
        emit Unfollowed(msg.sender, target);
    }
    
    function getPost(bytes32 postId) external view returns (
        address author,
        bytes32 contentHash,
        uint256 timestamp,
        PrivacyMode privacyMode,
        uint32 upvotes,
        uint32 downvotes,
        bool hasUserUpvoted,
        bool hasUserDownvoted
    ) {
        if (!posts[postId].exists) revert PostNotExists();
        Post storage post = posts[postId];
        
        return (
            post.author,
            post.contentHash,
            post.timestamp,
            post.privacyMode,
            post.pubUpvotes,
            post.pubDownvotes,
            hasUpvoted[postId][msg.sender],
            hasDownvoted[postId][msg.sender]
        );
    }
    
    function getEncryptedVoteCounts(bytes32 postId) external view returns (euint32, euint32) {
        if (!posts[postId].exists) revert PostNotExists();
        return (posts[postId].encUpvotes, posts[postId].encDownvotes);
    }
    
    function getEncryptedFollowerCount(address user) external view returns (euint32) {
        return socialGraph[user].encFollowerCount;
    }
    
    function getEncryptedFollowingCount(address user) external view returns (euint32) {
        return socialGraph[user].encFollowingCount;
    }
    
    function getPublicSocialCounts(address user) external view returns (uint32 followers, uint32 following) {
        return (socialGraph[user].pubFollowerCount, socialGraph[user].pubFollowingCount);
    }
    
    function checkIsFollowing(address follower, address target) external view returns (bool) {
        return isFollowing[follower][target];
    }
    
    function getFollowMode(address follower, address target) external view returns (FollowMode) {
        return followMode[follower][target];
    }
    
    function getTotalPosts() external view returns (uint256) {
        return allPosts.length;
    }
    
    function getRecentPosts(uint256 count) external view returns (bytes32[] memory) {
        uint256 total = allPosts.length;
        if (count > total) count = total;
        
        bytes32[] memory recent = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = allPosts[total - 1 - i];
        }
        return recent;
    }
}
