// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

contract ZappsAccessController {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR");
    bytes32 public constant QUEST_MANAGER_ROLE = keccak256("QUEST_MANAGER");
    bytes32 public constant REWARD_DISTRIBUTOR_ROLE = keccak256("REWARD_DISTRIBUTOR");
    bytes32 public constant REPUTATION_MANAGER_ROLE = keccak256("REPUTATION_MANAGER");
    
    address public owner;
    
    mapping(bytes32 => mapping(address => bool)) private roles;
    mapping(address => bool) public authorizedModules;
    mapping(address => mapping(address => bool)) public modulePermissions;
    
    bool public globalPaused;
    mapping(address => bool) public contractPaused;
    
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event ModuleAuthorized(address indexed module, bool status);
    event ModulePermissionSet(address indexed caller, address indexed target, bool allowed);
    event GlobalPauseToggled(bool paused);
    event ContractPauseToggled(address indexed contractAddr, bool paused);
    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);
    
    error NotOwner();
    error MissingRole();
    error GloballyPaused();
    error InvalidOwner();
    error InvalidAccount();
    error AlreadyHasRole();
    error DoesNotHaveRole();
    error InvalidModule();
    error InvalidAddresses();
    error InvalidContract();
    error LengthMismatch();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    modifier onlyRole(bytes32 role) {
        if (!hasRole(role, msg.sender)) revert MissingRole();
        _;
    }
    
    modifier whenNotPaused() {
        if (globalPaused) revert GloballyPaused();
        _;
    }
    
    constructor() {
        owner = msg.sender;
        roles[OWNER_ROLE][msg.sender] = true;
        roles[ADMIN_ROLE][msg.sender] = true;
        
        emit RoleGranted(OWNER_ROLE, msg.sender, msg.sender);
        emit RoleGranted(ADMIN_ROLE, msg.sender, msg.sender);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        
        roles[OWNER_ROLE][owner] = false;
        roles[OWNER_ROLE][newOwner] = true;
        
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function grantRole(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        if (account == address(0)) revert InvalidAccount();
        if (roles[role][account]) revert AlreadyHasRole();
        
        roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }
    
    function revokeRole(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        if (!roles[role][account]) revert DoesNotHaveRole();
        
        roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }
    
    function batchGrantRoles(bytes32[] calldata roleList, address[] calldata accounts) external onlyRole(ADMIN_ROLE) {
        if (roleList.length != accounts.length) revert LengthMismatch();
        
        for (uint256 i = 0; i < roleList.length; i++) {
            if (!roles[roleList[i]][accounts[i]]) {
                roles[roleList[i]][accounts[i]] = true;
                emit RoleGranted(roleList[i], accounts[i], msg.sender);
            }
        }
    }
    
    function batchRevokeRoles(bytes32[] calldata roleList, address[] calldata accounts) external onlyRole(ADMIN_ROLE) {
        if (roleList.length != accounts.length) revert LengthMismatch();
        
        for (uint256 i = 0; i < roleList.length; i++) {
            if (roles[roleList[i]][accounts[i]]) {
                roles[roleList[i]][accounts[i]] = false;
                emit RoleRevoked(roleList[i], accounts[i], msg.sender);
            }
        }
    }
    
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return roles[role][account];
    }
    
    function authorizeModule(address module, bool status) external onlyRole(ADMIN_ROLE) {
        if (module == address(0)) revert InvalidModule();
        authorizedModules[module] = status;
        emit ModuleAuthorized(module, status);
    }
    
    function setModulePermission(address caller, address target, bool allowed) external onlyRole(ADMIN_ROLE) {
        if (caller == address(0) || target == address(0)) revert InvalidAddresses();
        modulePermissions[caller][target] = allowed;
        emit ModulePermissionSet(caller, target, allowed);
    }
    
    function canModuleCall(address caller, address target) external view returns (bool) {
        return authorizedModules[caller] && modulePermissions[caller][target];
    }
    
    function isModuleAuthorized(address module) external view returns (bool) {
        return authorizedModules[module];
    }
    
    function setGlobalPause(bool paused) external onlyOwner {
        globalPaused = paused;
        emit GlobalPauseToggled(paused);
    }
    
    function setContractPause(address contractAddr, bool paused) external onlyRole(ADMIN_ROLE) {
        if (contractAddr == address(0)) revert InvalidContract();
        contractPaused[contractAddr] = paused;
        emit ContractPauseToggled(contractAddr, paused);
    }
    
    function isContractPaused(address contractAddr) external view returns (bool) {
        return globalPaused || contractPaused[contractAddr];
    }
    
    function checkPermission(address account, bytes32 role) external view returns (bool) {
        return hasRole(role, account);
    }
    
    function checkMultipleRoles(address account, bytes32[] calldata roleList) external view returns (bool[] memory) {
        bool[] memory results = new bool[](roleList.length);
        for (uint256 i = 0; i < roleList.length; i++) {
            results[i] = hasRole(roleList[i], account);
        }
        return results;
    }
    
    function getRoleAdmin() external pure returns (bytes32) {
        return ADMIN_ROLE;
    }
    
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IAccessController).interfaceId;
    }
}

interface IAccessController {
    function hasRole(bytes32 role, address account) external view returns (bool);
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
    function isContractPaused(address contractAddr) external view returns (bool);
}
