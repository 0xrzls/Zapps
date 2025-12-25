export const ZVP_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const VOTE_MANAGER_ABI = [
  "function vote(uint256 dappId, uint256 amount)",
  "function totalVotes(uint256 dappId) view returns (uint256)",
  "function userVotes(address user, uint256 dappId) view returns (uint256)",
  "function spentToday(address user, uint256 day) view returns (uint256)",
  
  "function perTxCap() view returns (uint256)",
  "function dailyCap() view returns (uint256)",
  
  "function zvp() view returns (address)",
  "function treasury() view returns (address)",
  
  "event Voted(address indexed voter, uint256 indexed dappId, uint256 amount, uint256 newTotal)"
];