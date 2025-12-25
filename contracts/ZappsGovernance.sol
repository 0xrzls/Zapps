// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64, euint32, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IZappsReputation {
    function addReputation(address user, string calldata activityType, uint16 points, bytes32 category) external;
}

contract ZappsGovernance is ZamaEthereumConfig {
    uint256 public constant VOTING_DELAY = 1 days;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint16 public constant MIN_REPUTATION_TO_PROPOSE = 500;
    uint256 public constant MIN_TOKENS_TO_VOTE = 100 * 10**18;
    
    address public owner;
    address public zappsToken;
    address public zappsReputation;
    
    enum ProposalState { Pending, Active, Defeated, Succeeded, Queued, Executed, Cancelled, Expired }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes32 contentHash;
        uint256 startTime;
        uint256 endTime;
        uint256 executionTime;
        euint64 encForVotes;
        euint64 encAgainstVotes;
        euint64 encAbstainVotes;
        uint64 decForVotes;
        uint64 decAgainstVotes;
        uint64 decAbstainVotes;
        uint32 voterCount;
        bool executed;
        bool cancelled;
        bool resultsRevealed;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
    }
    
    struct VoteReceipt {
        bool hasVoted;
        uint8 support;
        euint64 encWeight;
    }
    
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => VoteReceipt)) private receipts;
    mapping(address => uint256[]) private userProposals;
    mapping(address => uint256[]) private userVotes;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, uint256 startTime, uint256 endTime);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support);
    event ProposalCancelled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event ResultsRevealed(uint256 indexed proposalId, uint64 forVotes, uint64 againstVotes, uint64 abstainVotes);
    event DecryptionDataReady(uint256 indexed proposalId, euint64 encFor, euint64 encAgainst, euint64 encAbstain);
    
    error NotOwner();
    error InvalidOwner();
    error InvalidToken();
    error ProposalNotFound();
    error InvalidProposalState();
    error AlreadyVoted();
    error VotingNotStarted();
    error VotingEnded();
    error InvalidSupport();
    error NotProposer();
    error ExecutionTooEarly();
    error AlreadyExecuted();
    error ExecutionFailed();
    error ResultsAlreadyRevealed();
    error InvalidProof();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    constructor(address _zappsToken) {
        if (_zappsToken == address(0)) revert InvalidToken();
        owner = msg.sender;
        zappsToken = _zappsToken;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        owner = newOwner;
    }
    
    function setZappsReputation(address _reputation) external onlyOwner {
        zappsReputation = _reputation;
    }
    
    function propose(
        string calldata title,
        string calldata description,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) external returns (uint256 proposalId) {
        require(targets.length == values.length && values.length == calldatas.length, "Length mismatch");
        require(targets.length > 0, "Empty proposal");
        
        proposalCount++;
        proposalId = proposalCount;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.contentHash = keccak256(abi.encodePacked(title, description));
        proposal.startTime = block.timestamp + VOTING_DELAY;
        proposal.endTime = proposal.startTime + VOTING_PERIOD;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        
        proposal.encForVotes = FHE.asEuint64(0);
        proposal.encAgainstVotes = FHE.asEuint64(0);
        proposal.encAbstainVotes = FHE.asEuint64(0);
        
        FHE.allowThis(proposal.encForVotes);
        FHE.allowThis(proposal.encAgainstVotes);
        FHE.allowThis(proposal.encAbstainVotes);
        
        userProposals[msg.sender].push(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, title, proposal.startTime, proposal.endTime);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                msg.sender,
                "GOVERNANCE_PROPOSE",
                50,
                keccak256("GOVERNANCE")
            );
        }
        
        return proposalId;
    }
    
    function castVote(
        uint256 proposalId,
        uint8 support,
        externalEuint64 encVotingPower,
        bytes calldata inputProof
    ) external {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (block.timestamp < proposal.startTime) revert VotingNotStarted();
        if (block.timestamp > proposal.endTime) revert VotingEnded();
        if (support > 2) revert InvalidSupport();
        
        VoteReceipt storage receipt = receipts[proposalId][msg.sender];
        if (receipt.hasVoted) revert AlreadyVoted();
        
        euint64 votingPower = FHE.fromExternal(encVotingPower, inputProof);
        
        if (support == 0) {
            proposal.encAgainstVotes = FHE.add(proposal.encAgainstVotes, votingPower);
            FHE.allowThis(proposal.encAgainstVotes);
        } else if (support == 1) {
            proposal.encForVotes = FHE.add(proposal.encForVotes, votingPower);
            FHE.allowThis(proposal.encForVotes);
        } else {
            proposal.encAbstainVotes = FHE.add(proposal.encAbstainVotes, votingPower);
            FHE.allowThis(proposal.encAbstainVotes);
        }
        
        receipt.hasVoted = true;
        receipt.support = support;
        receipt.encWeight = votingPower;
        
        FHE.allowThis(receipt.encWeight);
        FHE.allow(receipt.encWeight, msg.sender);
        
        proposal.voterCount++;
        userVotes[msg.sender].push(proposalId);
        
        emit VoteCast(proposalId, msg.sender, support);
        
        if (zappsReputation != address(0)) {
            IZappsReputation(zappsReputation).addReputation(
                msg.sender,
                "GOVERNANCE_VOTE",
                30,
                keccak256("GOVERNANCE")
            );
        }
    }
    
    function requestResultsDecryption(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (block.timestamp <= proposal.endTime) revert VotingNotStarted();
        
        FHE.makePubliclyDecryptable(proposal.encForVotes);
        FHE.makePubliclyDecryptable(proposal.encAgainstVotes);
        FHE.makePubliclyDecryptable(proposal.encAbstainVotes);
        
        emit DecryptionDataReady(proposalId, proposal.encForVotes, proposal.encAgainstVotes, proposal.encAbstainVotes);
    }
    
    function verifyAndStoreResults(
        uint256 proposalId,
        bytes memory abiEncodedValues,
        bytes memory decryptionProof
    ) external {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (proposal.resultsRevealed) revert ResultsAlreadyRevealed();
        
        bytes32[] memory cts = new bytes32[](3);
        cts[0] = FHE.toBytes32(proposal.encForVotes);
        cts[1] = FHE.toBytes32(proposal.encAgainstVotes);
        cts[2] = FHE.toBytes32(proposal.encAbstainVotes);
        
        FHE.checkSignatures(cts, abiEncodedValues, decryptionProof);
        
        (uint64 forVotes, uint64 againstVotes, uint64 abstainVotes) = abi.decode(
            abiEncodedValues,
            (uint64, uint64, uint64)
        );
        
        proposal.decForVotes = forVotes;
        proposal.decAgainstVotes = againstVotes;
        proposal.decAbstainVotes = abstainVotes;
        proposal.resultsRevealed = true;
        
        if (forVotes > againstVotes) {
            proposal.executionTime = block.timestamp + EXECUTION_DELAY;
        }
        
        emit ResultsRevealed(proposalId, forVotes, againstVotes, abstainVotes);
    }
    
    function execute(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (!proposal.resultsRevealed) revert InvalidProposalState();
        if (proposal.executed) revert AlreadyExecuted();
        if (proposal.cancelled) revert InvalidProposalState();
        if (proposal.decForVotes <= proposal.decAgainstVotes) revert InvalidProposalState();
        if (block.timestamp < proposal.executionTime) revert ExecutionTooEarly();
        
        proposal.executed = true;
        
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(proposal.calldatas[i]);
            if (!success) revert ExecutionFailed();
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (msg.sender != proposal.proposer && msg.sender != owner) revert NotProposer();
        if (proposal.executed) revert AlreadyExecuted();
        
        proposal.cancelled = true;
        
        emit ProposalCancelled(proposalId);
    }
    
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        
        if (proposal.cancelled) return ProposalState.Cancelled;
        if (proposal.executed) return ProposalState.Executed;
        if (block.timestamp < proposal.startTime) return ProposalState.Pending;
        if (block.timestamp <= proposal.endTime) return ProposalState.Active;
        
        if (!proposal.resultsRevealed) return ProposalState.Active;
        
        if (proposal.decForVotes <= proposal.decAgainstVotes) return ProposalState.Defeated;
        
        if (proposal.executionTime > 0) {
            if (block.timestamp < proposal.executionTime) return ProposalState.Queued;
            if (block.timestamp > proposal.executionTime + 14 days) return ProposalState.Expired;
            return ProposalState.Succeeded;
        }
        
        return ProposalState.Defeated;
    }
    
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        uint256 startTime,
        uint256 endTime,
        uint32 voterCount,
        bool executed,
        bool cancelled,
        bool resultsRevealed,
        uint64 forVotes,
        uint64 againstVotes,
        uint64 abstainVotes
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.startTime,
            proposal.endTime,
            proposal.voterCount,
            proposal.executed,
            proposal.cancelled,
            proposal.resultsRevealed,
            proposal.decForVotes,
            proposal.decAgainstVotes,
            proposal.decAbstainVotes
        );
    }
    
    function getEncryptedVotes(uint256 proposalId) external view returns (euint64, euint64, euint64) {
        Proposal storage proposal = proposals[proposalId];
        return (proposal.encForVotes, proposal.encAgainstVotes, proposal.encAbstainVotes);
    }
    
    function getReceipt(uint256 proposalId, address voter) external view returns (
        bool hasVoted,
        uint8 support,
        euint64 encWeight
    ) {
        VoteReceipt storage receipt = receipts[proposalId][voter];
        return (receipt.hasVoted, receipt.support, receipt.encWeight);
    }
    
    function getUserProposals(address user) external view returns (uint256[] memory) {
        return userProposals[user];
    }
    
    function getUserVotes(address user) external view returns (uint256[] memory) {
        return userVotes[user];
    }
    
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (state(i) == ProposalState.Active) count++;
        }
        
        uint256[] memory active = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (state(i) == ProposalState.Active) {
                active[index] = i;
                index++;
            }
        }
        
        return active;
    }
    
    receive() external payable {}
}
