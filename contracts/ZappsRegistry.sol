// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

contract ZappsRegistry {
    address public owner;
    
    struct ContractInfo {
        address contractAddress;
        string name;
        string version;
        bool isActive;
        uint256 deployedAt;
        uint256 updatedAt;
    }
    
    mapping(bytes32 => ContractInfo) public contracts;
    bytes32[] public contractKeys;
    
    mapping(address => bool) public authorizedDeployers;
    
    bytes32 public constant TOKEN = keccak256("TOKEN");
    bytes32 public constant VOTING = keccak256("VOTING");
    bytes32 public constant SOCIAL = keccak256("SOCIAL");
    bytes32 public constant REPUTATION = keccak256("REPUTATION");
    bytes32 public constant REWARDS = keccak256("REWARDS");
    bytes32 public constant DISCUSSION = keccak256("DISCUSSION");
    bytes32 public constant ACCESS_CONTROLLER = keccak256("ACCESS_CONTROLLER");
    bytes32 public constant GOVERNANCE = keccak256("GOVERNANCE");
    bytes32 public constant AUCTION = keccak256("AUCTION");
    
    event ContractRegistered(bytes32 indexed key, address indexed contractAddress, string name);
    event ContractUpdated(bytes32 indexed key, address indexed oldAddress, address indexed newAddress);
    event ContractDeactivated(bytes32 indexed key);
    event ContractReactivated(bytes32 indexed key);
    event DeployerAuthorized(address indexed deployer, bool status);
    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);
    
    error NotOwner();
    error NotAuthorized();
    error InvalidAddress();
    error ContractNotFound();
    error ContractAlreadyExists();
    error ContractInactive();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    modifier onlyAuthorized() {
        if (msg.sender != owner && !authorizedDeployers[msg.sender]) revert NotAuthorized();
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedDeployers[msg.sender] = true;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function authorizeDeployer(address deployer, bool status) external onlyOwner {
        if (deployer == address(0)) revert InvalidAddress();
        authorizedDeployers[deployer] = status;
        emit DeployerAuthorized(deployer, status);
    }
    
    function registerContract(
        bytes32 key,
        address contractAddress,
        string calldata name,
        string calldata version
    ) external onlyAuthorized {
        if (contractAddress == address(0)) revert InvalidAddress();
        if (contracts[key].contractAddress != address(0)) revert ContractAlreadyExists();
        
        contracts[key] = ContractInfo({
            contractAddress: contractAddress,
            name: name,
            version: version,
            isActive: true,
            deployedAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        contractKeys.push(key);
        
        emit ContractRegistered(key, contractAddress, name);
    }
    
    function updateContract(
        bytes32 key,
        address newAddress,
        string calldata newVersion
    ) external onlyAuthorized {
        if (newAddress == address(0)) revert InvalidAddress();
        if (contracts[key].contractAddress == address(0)) revert ContractNotFound();
        
        address oldAddress = contracts[key].contractAddress;
        contracts[key].contractAddress = newAddress;
        contracts[key].version = newVersion;
        contracts[key].updatedAt = block.timestamp;
        
        emit ContractUpdated(key, oldAddress, newAddress);
    }
    
    function deactivateContract(bytes32 key) external onlyOwner {
        if (contracts[key].contractAddress == address(0)) revert ContractNotFound();
        
        contracts[key].isActive = false;
        contracts[key].updatedAt = block.timestamp;
        
        emit ContractDeactivated(key);
    }
    
    function reactivateContract(bytes32 key) external onlyOwner {
        if (contracts[key].contractAddress == address(0)) revert ContractNotFound();
        
        contracts[key].isActive = true;
        contracts[key].updatedAt = block.timestamp;
        
        emit ContractReactivated(key);
    }
    
    function getContract(bytes32 key) external view returns (
        address contractAddress,
        string memory name,
        string memory version,
        bool isActive,
        uint256 deployedAt,
        uint256 updatedAt
    ) {
        ContractInfo storage info = contracts[key];
        return (
            info.contractAddress,
            info.name,
            info.version,
            info.isActive,
            info.deployedAt,
            info.updatedAt
        );
    }
    
    function getContractAddress(bytes32 key) external view returns (address) {
        if (!contracts[key].isActive) revert ContractInactive();
        return contracts[key].contractAddress;
    }
    
    function getActiveContractAddress(bytes32 key) external view returns (address) {
        ContractInfo storage info = contracts[key];
        if (info.contractAddress == address(0)) revert ContractNotFound();
        if (!info.isActive) revert ContractInactive();
        return info.contractAddress;
    }
    
    function isContractActive(bytes32 key) external view returns (bool) {
        return contracts[key].isActive;
    }
    
    function getAllContractKeys() external view returns (bytes32[] memory) {
        return contractKeys;
    }
    
    function getActiveContracts() external view returns (
        bytes32[] memory keys,
        address[] memory addresses,
        string[] memory names
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < contractKeys.length; i++) {
            if (contracts[contractKeys[i]].isActive) {
                activeCount++;
            }
        }
        
        keys = new bytes32[](activeCount);
        addresses = new address[](activeCount);
        names = new string[](activeCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < contractKeys.length; i++) {
            if (contracts[contractKeys[i]].isActive) {
                keys[index] = contractKeys[i];
                addresses[index] = contracts[contractKeys[i]].contractAddress;
                names[index] = contracts[contractKeys[i]].name;
                index++;
            }
        }
        
        return (keys, addresses, names);
    }
    
    function getTokenAddress() external view returns (address) {
        return contracts[TOKEN].contractAddress;
    }
    
    function getVotingAddress() external view returns (address) {
        return contracts[VOTING].contractAddress;
    }
    
    function getSocialAddress() external view returns (address) {
        return contracts[SOCIAL].contractAddress;
    }
    
    function getReputationAddress() external view returns (address) {
        return contracts[REPUTATION].contractAddress;
    }
    
    function getRewardsAddress() external view returns (address) {
        return contracts[REWARDS].contractAddress;
    }
    
    function getDiscussionAddress() external view returns (address) {
        return contracts[DISCUSSION].contractAddress;
    }
    
    function getAccessControllerAddress() external view returns (address) {
        return contracts[ACCESS_CONTROLLER].contractAddress;
    }
    
    function getGovernanceAddress() external view returns (address) {
        return contracts[GOVERNANCE].contractAddress;
    }
    
    function getAuctionAddress() external view returns (address) {
        return contracts[AUCTION].contractAddress;
    }
    
    function totalContracts() external view returns (uint256) {
        return contractKeys.length;
    }
}
