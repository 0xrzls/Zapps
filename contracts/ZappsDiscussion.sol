// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IZappsReputation {
    function addReputation(address user, string calldata activityType, uint16 points, bytes32 category) external;
}

contract ZappsDiscussion is ZamaEthereumConfig {
    uint256 public constant MAX_MESSAGE_LENGTH = 10000;
    uint256 public constant DEFAULT_COOLDOWN = 30 seconds;
    uint256 public constant MAX_MESSAGES_PER_ROOM = 10000;
    uint256 public constant MAX_ALLOWED_READERS = 50;
    
    address public owner;
    address public zappsReputation;
    address public accessController;
    
    enum MessageVisibility {
        PUBLIC,
        ENCRYPTED,
        PRIVATE_REPLY
    }
    
    struct DiscussionRoom {
        uint256 projectId;
        address roomOwner;
        bool isPublic;
        bool requiresReputation;
        uint16 minReputationToPost;
        uint256 messageCooldown;
        bool isActive;
        uint256 createdAt;
        bytes32[] messageHashes;
        euint32 encParticipantCount;
        uint32 pubParticipantCount;
    }
    
    struct Message {
        address author;
        bytes32 contentHash;
        uint256 timestamp;
        bytes32 parentHash;
        MessageVisibility visibility;
        bool isDeleted;
        euint32 encUpvotes;
        euint32 encDownvotes;
        uint32 pubUpvotes;
        uint32 pubDownvotes;
    }
    
    mapping(uint256 => DiscussionRoom) public rooms;
    mapping(uint256 => mapping(address => bool)) public isModerator;
    mapping(uint256 => mapping(address => bool)) public isBanned;
    mapping(bytes32 => Message) public messages;
    mapping(address => mapping(uint256 => uint256)) public userMessageCount;
    mapping(address => mapping(uint256 => uint256)) public lastMessageTime;
    mapping(address => mapping(uint256 => bool)) public hasParticipated;
    mapping(bytes32 => mapping(address => bool)) public hasUpvoted;
    mapping(bytes32 => mapping(address => bool)) public hasDownvoted;
    mapping(bytes32 => address[]) private allowedReaders;
    mapping(bytes32 => mapping(address => bool)) public canDecrypt;
    mapping(bytes32 => uint256) public allowedReaderCount;
    
    uint256 public totalRooms;
    
    event RoomCreated(uint256 indexed projectId, address indexed owner_, bool isPublic, uint256 timestamp);
    event MessagePosted(uint256 indexed projectId, bytes32 indexed messageHash, address indexed author, bytes32 parentHash, MessageVisibility visibility, uint256 timestamp);
    event MessageVoted(bytes32 indexed messageHash, address indexed voter, bool isUpvote);
    event MessageDeleted(bytes32 indexed messageHash, address indexed moderator, uint256 timestamp);
    event ModeratorAdded(uint256 indexed projectId, address indexed moderator);
    event ModeratorRemoved(uint256 indexed projectId, address indexed moderator);
    event UserBanned(uint256 indexed projectId, address indexed user);
    event UserUnbanned(uint256 indexed projectId, address indexed user);
    event RoomSettingsUpdated(uint256 indexed projectId);
    event ReaderAdded(bytes32 indexed messageHash, address indexed reader, address indexed addedBy);
    event ReaderRemoved(bytes32 indexed messageHash, address indexed reader, address indexed removedBy);
    event PrivateReplyPosted(bytes32 indexed messageHash, bytes32 indexed parentHash, address indexed recipient);
    
    error NotOwner();
    error NotRoomOwner();
    error NotModerator();
    error RoomNotActive();
    error RoomAlreadyExists();
    error UserIsBanned();
    error InsufficientReputation();
    error CooldownActive();
    error RoomFull();
    error InvalidContentLength();
    error ParentNotFound();
    error MessageExists();
    error MessageNotFound();
    error MessageDeleted_();
    error AlreadyUpvoted();
    error AlreadyDownvoted();
    error CannotBanOwner();
    error AlreadyBanned();
    error NotBanned();
    error AlreadyModerator();
    error NotModeratorError();
    error InvalidOwner();
    error InvalidModerator();
    error CooldownTooLong();
    error NotMessageAuthor();
    error ReaderAlreadyAdded();
    error ReaderNotFound();
    error TooManyReaders();
    error InvalidReader();
    error CannotReadMessage();
    error PrivateReplyRequiresParent();
    error InvalidVisibilityForReply();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    modifier onlyRoomOwner(uint256 projectId) {
        if (rooms[projectId].roomOwner != msg.sender) revert NotRoomOwner();
        _;
    }
    
    modifier onlyModerator_(uint256 projectId) {
        if (rooms[projectId].roomOwner != msg.sender && !isModerator[projectId][msg.sender]) {
            revert NotModerator();
        }
        _;
    }
    
    modifier roomExists(uint256 projectId) {
        if (!rooms[projectId].isActive) revert RoomNotActive();
        _;
    }
    
    modifier onlyMessageAuthor(bytes32 messageHash) {
        if (messages[messageHash].author != msg.sender) revert NotMessageAuthor();
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        owner = newOwner;
    }
    
    function setZappsReputation(address _reputation) external onlyOwner {
        zappsReputation = _reputation;
    }
    
    function setAccessController(address _accessController) external onlyOwner {
        accessController = _accessController;
    }
    
    function createRoom(
        uint256 projectId,
        bool isPublic,
        bool requiresReputation,
        uint16 minReputationToPost
    ) external returns (bool) {
        if (rooms[projectId].isActive) revert RoomAlreadyExists();
        
        DiscussionRoom storage room = rooms[projectId];
        room.projectId = projectId;
        room.roomOwner = msg.sender;
        room.isPublic = isPublic;
        room.requiresReputation = requiresReputation;
        room.minReputationToPost = minReputationToPost;
        room.messageCooldown = DEFAULT_COOLDOWN;
        room.isActive = true;
        room.createdAt = block.timestamp;
        
        room.encParticipantCount = FHE.asEuint32(0);
        FHE.allowThis(room.encParticipantCount);
        
        isModerator[projectId][msg.sender] = true;
        
        totalRooms++;
        
        emit RoomCreated(projectId, msg.sender, isPublic, block.timestamp);
        emit ModeratorAdded(projectId, msg.sender);
        
        return true;
    }
    
    function updateRoomSettings(
        uint256 projectId,
        bool isPublic,
        bool requiresReputation,
        uint16 minReputationToPost,
        uint256 messageCooldown
    ) external onlyRoomOwner(projectId) roomExists(projectId) {
        if (messageCooldown > 1 hours) revert CooldownTooLong();
        
        DiscussionRoom storage room = rooms[projectId];
        room.isPublic = isPublic;
        room.requiresReputation = requiresReputation;
        room.minReputationToPost = minReputationToPost;
        room.messageCooldown = messageCooldown;
        
        emit RoomSettingsUpdated(projectId);
    }
    
    function addModerator(uint256 projectId, address moderator) external onlyRoomOwner(projectId) roomExists(projectId) {
        if (moderator == address(0)) revert InvalidModerator();
        if (isModerator[projectId][moderator]) revert AlreadyModerator();
        
        isModerator[projectId][moderator] = true;
        emit ModeratorAdded(projectId, moderator);
    }
    
    function removeModerator(uint256 projectId, address moderator) external onlyRoomOwner(projectId) roomExists(projectId) {
        if (!isModerator[projectId][moderator]) revert NotModeratorError();
        
        isModerator[projectId][moderator] = false;
        emit ModeratorRemoved(projectId, moderator);
    }
    
    function postPublicMessage(
        uint256 projectId,
        string calldata content,
        bytes32 parentHash
    ) external roomExists(projectId) returns (bytes32 messageHash) {
        return _postMessage(projectId, content, parentHash, MessageVisibility.PUBLIC, new address[](0));
    }
    
    function postEncryptedMessage(
        uint256 projectId,
        string calldata content,
        bytes32 parentHash,
        address[] calldata allowedUsers
    ) external roomExists(projectId) returns (bytes32 messageHash) {
        if (allowedUsers.length > MAX_ALLOWED_READERS) revert TooManyReaders();
        return _postMessage(projectId, content, parentHash, MessageVisibility.ENCRYPTED, allowedUsers);
    }
    
    function postPrivateReply(
        uint256 projectId,
        string calldata content,
        bytes32 parentHash
    ) external roomExists(projectId) returns (bytes32 messageHash) {
        if (parentHash == bytes32(0)) revert PrivateReplyRequiresParent();
        if (messages[parentHash].timestamp == 0) revert ParentNotFound();
        
        messageHash = _postMessage(projectId, content, parentHash, MessageVisibility.PRIVATE_REPLY, new address[](0));
        
        address parentAuthor = messages[parentHash].author;
        
        canDecrypt[messageHash][msg.sender] = true;
        canDecrypt[messageHash][parentAuthor] = true;
        
        allowedReaders[messageHash].push(msg.sender);
        allowedReaders[messageHash].push(parentAuthor);
        allowedReaderCount[messageHash] = 2;
        
        emit PrivateReplyPosted(messageHash, parentHash, parentAuthor);
        
        return messageHash;
    }
    
    function postMessage(
        uint256 projectId,
        string calldata content,
        bytes32 parentHash,
        bool encrypt
    ) external roomExists(projectId) returns (bytes32 messageHash) {
        if (encrypt) {
            address[] memory emptyList = new address[](0);
            return _postMessage(projectId, content, parentHash, MessageVisibility.ENCRYPTED, emptyList);
        } else {
            return _postMessage(projectId, content, parentHash, MessageVisibility.PUBLIC, new address[](0));
        }
    }
    
    function _postMessage(
        uint256 projectId,
        string calldata content,
        bytes32 parentHash,
        MessageVisibility visibility,
        address[] memory initialReaders
    ) internal returns (bytes32 messageHash) {
        DiscussionRoom storage room = rooms[projectId];
        
        if (isBanned[projectId][msg.sender]) revert UserIsBanned();
        
        if (block.timestamp < lastMessageTime[msg.sender][projectId] + room.messageCooldown) {
            revert CooldownActive();
        }
        
        if (room.messageHashes.length >= MAX_MESSAGES_PER_ROOM) revert RoomFull();
        
        bytes memory contentBytes = bytes(content);
        if (contentBytes.length == 0 || contentBytes.length > MAX_MESSAGE_LENGTH) {
            revert InvalidContentLength();
        }
        
        if (parentHash != bytes32(0)) {
            if (messages[parentHash].timestamp == 0) revert ParentNotFound();
        }
        
        bytes32 contentHash = keccak256(contentBytes);
        messageHash = keccak256(abi.encodePacked(projectId, msg.sender, contentHash, block.timestamp, uint8(visibility)));
        
        if (messages[messageHash].timestamp != 0) revert MessageExists();
        
        Message storage message = messages[messageHash];
        message.author = msg.sender;
        message.contentHash = contentHash;
        message.timestamp = block.timestamp;
        message.parentHash = parentHash;
        message.visibility = visibility;
        
        message.encUpvotes = FHE.asEuint32(0);
        message.encDownvotes = FHE.asEuint32(0);
        
        FHE.allowThis(message.encUpvotes);
        FHE.allowThis(message.encDownvotes);
        
        room.messageHashes.push(messageHash);
        
        if (visibility == MessageVisibility.ENCRYPTED) {
            canDecrypt[messageHash][msg.sender] = true;
            allowedReaders[messageHash].push(msg.sender);
            allowedReaderCount[messageHash]++;
            
            for (uint256 i = 0; i < initialReaders.length; i++) {
                address reader = initialReaders[i];
                if (reader != address(0) && !canDecrypt[messageHash][reader]) {
                    canDecrypt[messageHash][reader] = true;
                    allowedReaders[messageHash].push(reader);
                    allowedReaderCount[messageHash]++;
                    emit ReaderAdded(messageHash, reader, msg.sender);
                }
            }
        }
        
        userMessageCount[msg.sender][projectId]++;
        lastMessageTime[msg.sender][projectId] = block.timestamp;
        
        if (!hasParticipated[msg.sender][projectId]) {
            hasParticipated[msg.sender][projectId] = true;
            room.encParticipantCount = FHE.add(room.encParticipantCount, FHE.asEuint32(1));
            FHE.allowThis(room.encParticipantCount);
            
            if (room.isPublic) {
                room.pubParticipantCount++;
            }
        }
        
        emit MessagePosted(projectId, messageHash, msg.sender, parentHash, visibility, block.timestamp);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                msg.sender,
                "DISCUSSION_ACTIVE",
                5,
                keccak256("COMMUNITY")
            );
        }
        
        return messageHash;
    }
    
    function addReader(bytes32 messageHash, address reader) external onlyMessageAuthor(messageHash) {
        if (reader == address(0)) revert InvalidReader();
        if (canDecrypt[messageHash][reader]) revert ReaderAlreadyAdded();
        if (allowedReaderCount[messageHash] >= MAX_ALLOWED_READERS) revert TooManyReaders();
        
        Message storage message = messages[messageHash];
        if (message.visibility == MessageVisibility.PUBLIC) revert InvalidVisibilityForReply();
        
        canDecrypt[messageHash][reader] = true;
        allowedReaders[messageHash].push(reader);
        allowedReaderCount[messageHash]++;
        
        emit ReaderAdded(messageHash, reader, msg.sender);
    }
    
    function addReaders(bytes32 messageHash, address[] calldata readers) external onlyMessageAuthor(messageHash) {
        if (allowedReaderCount[messageHash] + readers.length > MAX_ALLOWED_READERS) revert TooManyReaders();
        
        Message storage message = messages[messageHash];
        if (message.visibility == MessageVisibility.PUBLIC) revert InvalidVisibilityForReply();
        
        for (uint256 i = 0; i < readers.length; i++) {
            address reader = readers[i];
            if (reader != address(0) && !canDecrypt[messageHash][reader]) {
                canDecrypt[messageHash][reader] = true;
                allowedReaders[messageHash].push(reader);
                allowedReaderCount[messageHash]++;
                emit ReaderAdded(messageHash, reader, msg.sender);
            }
        }
    }
    
    function removeReader(bytes32 messageHash, address reader) external onlyMessageAuthor(messageHash) {
        if (!canDecrypt[messageHash][reader]) revert ReaderNotFound();
        if (reader == msg.sender) revert InvalidReader();
        
        canDecrypt[messageHash][reader] = false;
        
        emit ReaderRemoved(messageHash, reader, msg.sender);
    }
    
    function upvoteMessage(bytes32 messageHash) external {
        if (messages[messageHash].timestamp == 0) revert MessageNotFound();
        if (messages[messageHash].isDeleted) revert MessageDeleted_();
        if (hasUpvoted[messageHash][msg.sender]) revert AlreadyUpvoted();
        
        Message storage message = messages[messageHash];
        if (message.visibility != MessageVisibility.PUBLIC) {
            if (!canDecrypt[messageHash][msg.sender]) revert CannotReadMessage();
        }
        
        if (hasDownvoted[messageHash][msg.sender]) {
            message.encDownvotes = FHE.sub(message.encDownvotes, FHE.asEuint32(1));
            FHE.allowThis(message.encDownvotes);
            hasDownvoted[messageHash][msg.sender] = false;
            if (message.pubDownvotes > 0) message.pubDownvotes--;
        }
        
        message.encUpvotes = FHE.add(message.encUpvotes, FHE.asEuint32(1));
        hasUpvoted[messageHash][msg.sender] = true;
        message.pubUpvotes++;
        
        FHE.allowThis(message.encUpvotes);
        
        emit MessageVoted(messageHash, msg.sender, true);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                message.author,
                "CONTENT_REWARD",
                2,
                keccak256("CREATOR")
            );
        }
    }
    
    function downvoteMessage(bytes32 messageHash) external {
        if (messages[messageHash].timestamp == 0) revert MessageNotFound();
        if (messages[messageHash].isDeleted) revert MessageDeleted_();
        if (hasDownvoted[messageHash][msg.sender]) revert AlreadyDownvoted();
        
        Message storage message = messages[messageHash];
        if (message.visibility != MessageVisibility.PUBLIC) {
            if (!canDecrypt[messageHash][msg.sender]) revert CannotReadMessage();
        }
        
        if (hasUpvoted[messageHash][msg.sender]) {
            message.encUpvotes = FHE.sub(message.encUpvotes, FHE.asEuint32(1));
            FHE.allowThis(message.encUpvotes);
            hasUpvoted[messageHash][msg.sender] = false;
            if (message.pubUpvotes > 0) message.pubUpvotes--;
        }
        
        message.encDownvotes = FHE.add(message.encDownvotes, FHE.asEuint32(1));
        hasDownvoted[messageHash][msg.sender] = true;
        message.pubDownvotes++;
        
        FHE.allowThis(message.encDownvotes);
        
        emit MessageVoted(messageHash, msg.sender, false);
    }
    
    function deleteMessage(uint256 projectId, bytes32 messageHash) external onlyModerator_(projectId) {
        if (messages[messageHash].timestamp == 0) revert MessageNotFound();
        if (messages[messageHash].isDeleted) revert MessageDeleted_();
        
        messages[messageHash].isDeleted = true;
        
        emit MessageDeleted(messageHash, msg.sender, block.timestamp);
    }
    
    function banUser(uint256 projectId, address user) external onlyModerator_(projectId) roomExists(projectId) {
        if (user == rooms[projectId].roomOwner) revert CannotBanOwner();
        if (isBanned[projectId][user]) revert AlreadyBanned();
        
        isBanned[projectId][user] = true;
        emit UserBanned(projectId, user);
    }
    
    function unbanUser(uint256 projectId, address user) external onlyModerator_(projectId) roomExists(projectId) {
        if (!isBanned[projectId][user]) revert NotBanned();
        
        isBanned[projectId][user] = false;
        emit UserUnbanned(projectId, user);
    }
    
    function getRoomInfo(uint256 projectId) external view returns (
        address roomOwner,
        bool isPublic,
        bool requiresReputation,
        uint16 minReputationToPost,
        uint256 messageCount,
        uint32 participantCount,
        uint256 createdAt,
        bool isActive
    ) {
        DiscussionRoom storage room = rooms[projectId];
        
        participantCount = room.isPublic ? room.pubParticipantCount : 0;
        
        return (
            room.roomOwner,
            room.isPublic,
            room.requiresReputation,
            room.minReputationToPost,
            room.messageHashes.length,
            participantCount,
            room.createdAt,
            room.isActive
        );
    }
    
    function getMessage(bytes32 messageHash) external view returns (
        address author,
        bytes32 contentHash,
        uint256 timestamp,
        bytes32 parentHash,
        MessageVisibility visibility,
        bool isDeleted_,
        uint32 upvotes,
        uint32 downvotes
    ) {
        Message storage message = messages[messageHash];
        
        return (
            message.author,
            message.contentHash,
            message.timestamp,
            message.parentHash,
            message.visibility,
            message.isDeleted,
            message.pubUpvotes,
            message.pubDownvotes
        );
    }
    
    function canReadMessage(bytes32 messageHash, address reader) external view returns (bool) {
        Message storage message = messages[messageHash];
        
        if (message.visibility == MessageVisibility.PUBLIC) {
            return true;
        }
        
        return canDecrypt[messageHash][reader];
    }
    
    function getAllowedReaders(bytes32 messageHash) external view returns (address[] memory) {
        if (messages[messageHash].author != msg.sender) {
            return new address[](0);
        }
        
        return allowedReaders[messageHash];
    }
    
    function getReadableMessages(uint256 projectId, uint256 count) external view roomExists(projectId) returns (bytes32[] memory) {
        DiscussionRoom storage room = rooms[projectId];
        uint256 total = room.messageHashes.length;
        
        if (count > total) count = total;
        
        uint256 readableCount = 0;
        for (uint256 i = 0; i < count && readableCount < count; i++) {
            bytes32 hash = room.messageHashes[total - 1 - i];
            Message storage message = messages[hash];
            
            if (message.visibility == MessageVisibility.PUBLIC || canDecrypt[hash][msg.sender]) {
                readableCount++;
            }
        }
        
        bytes32[] memory readable = new bytes32[](readableCount);
        uint256 index = 0;
        for (uint256 i = 0; i < total && index < readableCount; i++) {
            bytes32 hash = room.messageHashes[total - 1 - i];
            Message storage message = messages[hash];
            
            if (message.visibility == MessageVisibility.PUBLIC || canDecrypt[hash][msg.sender]) {
                readable[index] = hash;
                index++;
            }
        }
        
        return readable;
    }
    
    function getEncryptedVoteCounts(bytes32 messageHash) external view returns (euint32, euint32) {
        return (messages[messageHash].encUpvotes, messages[messageHash].encDownvotes);
    }
    
    function getRecentMessages(uint256 projectId, uint256 count) external view roomExists(projectId) returns (bytes32[] memory) {
        DiscussionRoom storage room = rooms[projectId];
        uint256 total = room.messageHashes.length;
        
        if (count > total) count = total;
        
        bytes32[] memory recent = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = room.messageHashes[total - 1 - i];
        }
        
        return recent;
    }
    
    function getUserStats(uint256 projectId, address user) external view returns (
        uint256 messageCount,
        uint256 lastMessageTimestamp,
        bool banned,
        bool moderator,
        bool participated
    ) {
        return (
            userMessageCount[user][projectId],
            lastMessageTime[user][projectId],
            isBanned[projectId][user],
            isModerator[projectId][user],
            hasParticipated[user][projectId]
        );
    }
    
    function getEncryptedParticipantCount(uint256 projectId) external view returns (euint32) {
        return rooms[projectId].encParticipantCount;
    }
    
    function getPrivateReplies(uint256 projectId, bytes32 parentHash) external view roomExists(projectId) returns (bytes32[] memory) {
        DiscussionRoom storage room = rooms[projectId];
        uint256 total = room.messageHashes.length;
        
        uint256 replyCount = 0;
        for (uint256 i = 0; i < total; i++) {
            bytes32 hash = room.messageHashes[i];
            Message storage message = messages[hash];
            
            if (message.parentHash == parentHash && 
                message.visibility == MessageVisibility.PRIVATE_REPLY &&
                canDecrypt[hash][msg.sender]) {
                replyCount++;
            }
        }
        
        bytes32[] memory replies = new bytes32[](replyCount);
        uint256 index = 0;
        for (uint256 i = 0; i < total && index < replyCount; i++) {
            bytes32 hash = room.messageHashes[i];
            Message storage message = messages[hash];
            
            if (message.parentHash == parentHash && 
                message.visibility == MessageVisibility.PRIVATE_REPLY &&
                canDecrypt[hash][msg.sender]) {
                replies[index] = hash;
                index++;
            }
        }
        
        return replies;
    }
}
