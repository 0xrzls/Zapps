// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IZappsReputation {
    function addReputation(address user, string calldata activityType, uint16 points, bytes32 category) external;
}

contract ZappsAuction is ZamaEthereumConfig {
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    uint256 public constant MAX_AUCTION_DURATION = 30 days;
    
    address public owner;
    address public zappsToken;
    address public zappsReputation;
    uint256 public platformFeeBps = 250;
    address public feeRecipient;
    
    enum AuctionState { Created, Active, Ended, Finalized, Cancelled }
    
    struct Auction {
        uint256 id;
        address seller;
        string itemName;
        string itemDescription;
        bytes32 itemHash;
        uint64 startingPrice;
        uint64 reservePrice;
        uint256 startTime;
        uint256 endTime;
        euint64 encHighestBid;
        address highestBidder;
        uint64 decHighestBid;
        uint32 bidCount;
        bool finalized;
        bool cancelled;
        bool resultsRevealed;
    }
    
    struct Bid {
        address bidder;
        euint64 encAmount;
        uint256 timestamp;
        bool refunded;
    }
    
    uint256 public auctionCount;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) private bids;
    mapping(uint256 => mapping(address => euint64)) private bidderDeposits;
    mapping(uint256 => mapping(address => bool)) private hasBid;
    mapping(address => uint256[]) private userAuctions;
    mapping(address => uint256[]) private userBids;
    
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, string itemName, uint256 startTime, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 timestamp);
    event AuctionEnded(uint256 indexed auctionId);
    event AuctionFinalized(uint256 indexed auctionId, address indexed winner, uint64 winningBid);
    event AuctionCancelled(uint256 indexed auctionId);
    event BidRefunded(uint256 indexed auctionId, address indexed bidder);
    event DecryptionDataReady(uint256 indexed auctionId, euint64 encHighestBid);
    
    error NotOwner();
    error InvalidOwner();
    error InvalidToken();
    error InvalidDuration();
    error InvalidPrice();
    error AuctionNotFound();
    error AuctionNotActive();
    error AuctionStillActive();
    error AuctionEnded_();
    error AuctionFinalized_();
    error AuctionCancelled_();
    error NotSeller();
    error AlreadyBid();
    error ResultsNotRevealed();
    error AlreadyRefunded();
    error NoBidsToRefund();
    error InvalidProof();
    error TransferFailed();
    error FeeTooHigh();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    constructor(address _zappsToken) {
        if (_zappsToken == address(0)) revert InvalidToken();
        owner = msg.sender;
        zappsToken = _zappsToken;
        feeRecipient = msg.sender;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        owner = newOwner;
    }
    
    function setZappsReputation(address _reputation) external onlyOwner {
        zappsReputation = _reputation;
    }
    
    function setPlatformFee(uint256 feeBps) external onlyOwner {
        if (feeBps > 1000) revert FeeTooHigh();
        platformFeeBps = feeBps;
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert InvalidOwner();
        feeRecipient = _feeRecipient;
    }
    
    function createAuction(
        string calldata itemName,
        string calldata itemDescription,
        uint64 startingPrice,
        uint64 reservePrice,
        uint256 duration
    ) external returns (uint256 auctionId) {
        if (duration < MIN_AUCTION_DURATION || duration > MAX_AUCTION_DURATION) revert InvalidDuration();
        if (startingPrice == 0) revert InvalidPrice();
        
        auctionCount++;
        auctionId = auctionCount;
        
        Auction storage auction = auctions[auctionId];
        auction.id = auctionId;
        auction.seller = msg.sender;
        auction.itemName = itemName;
        auction.itemDescription = itemDescription;
        auction.itemHash = keccak256(abi.encodePacked(itemName, itemDescription));
        auction.startingPrice = startingPrice;
        auction.reservePrice = reservePrice;
        auction.startTime = block.timestamp;
        auction.endTime = block.timestamp + duration;
        
        auction.encHighestBid = FHE.asEuint64(0);
        FHE.allowThis(auction.encHighestBid);
        
        userAuctions[msg.sender].push(auctionId);
        
        emit AuctionCreated(auctionId, msg.sender, itemName, auction.startTime, auction.endTime);
        
        return auctionId;
    }
    
    function placeBid(
        uint256 auctionId,
        externalEuint64 encBidAmount,
        bytes calldata inputProof
    ) external {
        Auction storage auction = auctions[auctionId];
        if (auction.id == 0) revert AuctionNotFound();
        if (block.timestamp > auction.endTime) revert AuctionEnded_();
        if (auction.cancelled) revert AuctionCancelled_();
        if (msg.sender == auction.seller) revert NotSeller();
        
        euint64 bidAmount = FHE.fromExternal(encBidAmount, inputProof);
        
        if (hasBid[auctionId][msg.sender]) {
            euint64 previousDeposit = bidderDeposits[auctionId][msg.sender];
            euint64 totalBid = FHE.add(previousDeposit, bidAmount);
            bidderDeposits[auctionId][msg.sender] = totalBid;
            FHE.allowThis(bidderDeposits[auctionId][msg.sender]);
            FHE.allow(bidderDeposits[auctionId][msg.sender], msg.sender);
        } else {
            bidderDeposits[auctionId][msg.sender] = bidAmount;
            FHE.allowThis(bidderDeposits[auctionId][msg.sender]);
            FHE.allow(bidderDeposits[auctionId][msg.sender], msg.sender);
            hasBid[auctionId][msg.sender] = true;
            userBids[msg.sender].push(auctionId);
        }
        
        ebool isHigher = FHE.gt(bidderDeposits[auctionId][msg.sender], auction.encHighestBid);
        auction.encHighestBid = FHE.select(isHigher, bidderDeposits[auctionId][msg.sender], auction.encHighestBid);
        FHE.allowThis(auction.encHighestBid);
        
        bids[auctionId].push(Bid({
            bidder: msg.sender,
            encAmount: bidAmount,
            timestamp: block.timestamp,
            refunded: false
        }));
        
        auction.bidCount++;
        
        emit BidPlaced(auctionId, msg.sender, block.timestamp);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                msg.sender,
                "AUCTION_BID",
                10,
                keccak256("MARKETPLACE")
            );
        }
    }
    
    function requestWinnerDecryption(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        if (auction.id == 0) revert AuctionNotFound();
        if (block.timestamp <= auction.endTime) revert AuctionStillActive();
        if (auction.cancelled) revert AuctionCancelled_();
        
        FHE.makePubliclyDecryptable(auction.encHighestBid);
        
        for (uint256 i = 0; i < bids[auctionId].length; i++) {
            address bidder = bids[auctionId][i].bidder;
            FHE.makePubliclyDecryptable(bidderDeposits[auctionId][bidder]);
        }
        
        emit DecryptionDataReady(auctionId, auction.encHighestBid);
    }
    
    function finalizeAuction(
        uint256 auctionId,
        address winner,
        bytes memory abiEncodedHighestBid,
        bytes memory decryptionProof
    ) external {
        Auction storage auction = auctions[auctionId];
        if (auction.id == 0) revert AuctionNotFound();
        if (block.timestamp <= auction.endTime) revert AuctionStillActive();
        if (auction.finalized) revert AuctionFinalized_();
        if (auction.cancelled) revert AuctionCancelled_();
        
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(auction.encHighestBid);
        
        FHE.checkSignatures(cts, abiEncodedHighestBid, decryptionProof);
        
        uint64 highestBid = abi.decode(abiEncodedHighestBid, (uint64));
        
        auction.decHighestBid = highestBid;
        auction.highestBidder = winner;
        auction.resultsRevealed = true;
        auction.finalized = true;
        
        emit AuctionFinalized(auctionId, winner, highestBid);
        
        if (zappsReputation != address(0)) {
            if (winner != address(0)) {
                IZappsReputation(zappsReputation).addReputation(
                    winner,
                    "AUCTION_WIN",
                    50,
                    keccak256("MARKETPLACE")
                );
            }
            IZappsReputation(zappsReputation).addReputation(
                auction.seller,
                "AUCTION_COMPLETE",
                30,
                keccak256("MARKETPLACE")
            );
        }
    }
    
    function cancelAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        if (auction.id == 0) revert AuctionNotFound();
        if (msg.sender != auction.seller && msg.sender != owner) revert NotSeller();
        if (auction.finalized) revert AuctionFinalized_();
        if (auction.cancelled) revert AuctionCancelled_();
        
        auction.cancelled = true;
        
        emit AuctionCancelled(auctionId);
    }
    
    function getAuctionState(uint256 auctionId) public view returns (AuctionState) {
        Auction storage auction = auctions[auctionId];
        if (auction.id == 0) revert AuctionNotFound();
        
        if (auction.cancelled) return AuctionState.Cancelled;
        if (auction.finalized) return AuctionState.Finalized;
        if (block.timestamp <= auction.endTime) return AuctionState.Active;
        if (auction.resultsRevealed) return AuctionState.Ended;
        
        return AuctionState.Ended;
    }
    
    function getAuction(uint256 auctionId) external view returns (
        address seller,
        string memory itemName,
        uint64 startingPrice,
        uint256 startTime,
        uint256 endTime,
        uint32 bidCount,
        bool finalized,
        bool cancelled,
        address winner,
        uint64 winningBid
    ) {
        Auction storage auction = auctions[auctionId];
        return (
            auction.seller,
            auction.itemName,
            auction.startingPrice,
            auction.startTime,
            auction.endTime,
            auction.bidCount,
            auction.finalized,
            auction.cancelled,
            auction.highestBidder,
            auction.decHighestBid
        );
    }
    
    function getEncryptedHighestBid(uint256 auctionId) external view returns (euint64) {
        return auctions[auctionId].encHighestBid;
    }
    
    function getUserEncryptedBid(uint256 auctionId, address bidder) external view returns (euint64) {
        return bidderDeposits[auctionId][bidder];
    }
    
    function hasBidOnAuction(uint256 auctionId, address bidder) external view returns (bool) {
        return hasBid[auctionId][bidder];
    }
    
    function getUserAuctions(address user) external view returns (uint256[] memory) {
        return userAuctions[user];
    }
    
    function getUserBidAuctions(address user) external view returns (uint256[] memory) {
        return userBids[user];
    }
    
    function getActiveAuctions() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= auctionCount; i++) {
            if (getAuctionState(i) == AuctionState.Active) count++;
        }
        
        uint256[] memory active = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= auctionCount; i++) {
            if (getAuctionState(i) == AuctionState.Active) {
                active[index] = i;
                index++;
            }
        }
        
        return active;
    }
    
    function getBidCount(uint256 auctionId) external view returns (uint256) {
        return bids[auctionId].length;
    }
}
