// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract ZappsToken is ZamaEthereumConfig, ERC7984, Ownable2Step {
    uint256 public constant TOTAL_SUPPLY_CAP = 1_000_000_000 * 10**18;
    uint256 public transferCooldown = 1 seconds;
    uint256 public transferFeeBasisPoints = 0;
    
    address public feeCollector;
    address public stakingContract;
    
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public authorizedBurners;
    mapping(address => uint256) public lastTransferTime;
    mapping(address => euint64) private encStakedBalance;
    
    euint64 private encTotalFeesCollected;
    
    event MinterAuthorized(address indexed minter, bool status);
    event BurnerAuthorized(address indexed burner, bool status);
    event FeeCollected(address indexed from);
    event TokensStaked(address indexed user);
    event TokensUnstaked(address indexed user);
    
    error NotAuthorizedMinter();
    error NotAuthorizedBurner();
    error CooldownActive();
    error InvalidAddress();
    error FeeTooHigh();
    error CooldownTooLong();
    
    modifier onlyAuthorizedMinter() {
        if (!authorizedMinters[msg.sender]) revert NotAuthorizedMinter();
        _;
    }
    
    modifier onlyAuthorizedBurner() {
        if (!authorizedBurners[msg.sender]) revert NotAuthorizedBurner();
        _;
    }
    
    modifier respectsCooldown(address from) {
        if (block.timestamp < lastTransferTime[from] + transferCooldown) revert CooldownActive();
        _;
        lastTransferTime[from] = block.timestamp;
    }
    
    constructor(
        address owner_,
        uint64 initialSupply,
        address _feeCollector
    ) ERC7984("Zapps Voting Power", "ZVP", "https://zapps.fun/metadata") Ownable(owner_) {
        if (_feeCollector == address(0)) revert InvalidAddress();
        feeCollector = _feeCollector;
        authorizedMinters[owner_] = true;
        
        if (initialSupply > 0) {
            euint64 encInitialSupply = FHE.asEuint64(initialSupply);
            _mint(owner_, encInitialSupply);
        }
        
        encTotalFeesCollected = FHE.asEuint64(0);
        FHE.allowThis(encTotalFeesCollected);
    }
    
    function authorizeMinter(address minter, bool status) external onlyOwner {
        authorizedMinters[minter] = status;
        emit MinterAuthorized(minter, status);
    }
    
    function authorizeBurner(address burner, bool status) external onlyOwner {
        authorizedBurners[burner] = status;
        emit BurnerAuthorized(burner, status);
    }
    
    function setTransferCooldown(uint256 newCooldown) external onlyOwner {
        if (newCooldown > 1 hours) revert CooldownTooLong();
        transferCooldown = newCooldown;
    }
    
    function setTransferFee(uint256 feeBasisPoints) external onlyOwner {
        if (feeBasisPoints > 1000) revert FeeTooHigh();
        transferFeeBasisPoints = feeBasisPoints;
    }
    
    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();
        feeCollector = newCollector;
    }
    
    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }
    
    function mint(address to, uint64 amount) external onlyAuthorizedMinter {
        if (to == address(0)) revert InvalidAddress();
        euint64 encAmount = FHE.asEuint64(amount);
        _mint(to, encAmount);
    }
    
    function confidentialMint(
        address to,
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) external onlyAuthorizedMinter returns (euint64) {
        if (to == address(0)) revert InvalidAddress();
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        return _mint(to, amount);
    }
    
    function batchMint(
        address[] calldata recipients,
        uint64[] calldata amounts
    ) external onlyAuthorizedMinter {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length <= 100, "Batch too large");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            euint64 encAmount = FHE.asEuint64(amounts[i]);
            _mint(recipients[i], encAmount);
        }
    }
    
    function burn(address from, uint64 amount) external onlyAuthorizedBurner {
        euint64 encAmount = FHE.asEuint64(amount);
        _burn(from, encAmount);
    }
    
    function confidentialBurn(
        address from,
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) external onlyAuthorizedBurner returns (euint64) {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        return _burn(from, amount);
    }
    
    function stake(externalEuint64 encAmount, bytes calldata inputProof) external {
        require(stakingContract != address(0), "Staking not enabled");
        
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        _burn(msg.sender, amount);
        
        euint64 currentStaked = encStakedBalance[msg.sender];
        if (euint64.unwrap(currentStaked) == 0) {
            currentStaked = FHE.asEuint64(0);
        }
        encStakedBalance[msg.sender] = FHE.add(currentStaked, amount);
        
        FHE.allowThis(encStakedBalance[msg.sender]);
        FHE.allow(encStakedBalance[msg.sender], msg.sender);
        
        emit TokensStaked(msg.sender);
    }
    
    function unstake(externalEuint64 encAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        
        euint64 currentStaked = encStakedBalance[msg.sender];
        euint64 newStaked = FHE.sub(currentStaked, amount);
        
        encStakedBalance[msg.sender] = newStaked;
        _mint(msg.sender, amount);
        
        FHE.allowThis(encStakedBalance[msg.sender]);
        FHE.allow(encStakedBalance[msg.sender], msg.sender);
        
        emit TokensUnstaked(msg.sender);
    }
    
    function confidentialTransfer(
        address to,
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) public override respectsCooldown(msg.sender) returns (euint64) {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        
        if (transferFeeBasisPoints > 0) {
            euint64 feeMultiplier = FHE.asEuint64(uint64(transferFeeBasisPoints));
            euint64 multiplied = FHE.mul(amount, feeMultiplier);
            euint64 fee = FHE.div(multiplied, uint64(10000));
            
            euint64 amountAfterFee = FHE.sub(amount, fee);
            
            _mint(feeCollector, fee);
            encTotalFeesCollected = FHE.add(encTotalFeesCollected, fee);
            FHE.allowThis(encTotalFeesCollected);
            
            emit FeeCollected(msg.sender);
            
            return _transfer(msg.sender, to, amountAfterFee);
        } else {
            return _transfer(msg.sender, to, amount);
        }
    }
    
    function getStakedBalance(address user) external view returns (euint64) {
        return encStakedBalance[user];
    }
    
    function getTotalFeesCollected() external view returns (euint64) {
        return encTotalFeesCollected;
    }
    
    function _update(address from, address to, euint64 amount) internal virtual override returns (euint64 transferred) {
        transferred = super._update(from, to, amount);
        FHE.allow(confidentialTotalSupply(), owner());
    }
}
