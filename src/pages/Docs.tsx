import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Cpu, 
  Copy,
  ExternalLink,
  Code2,
  Lock,
  Network,
  Database,
  Eye,
  Key,
  Binary,
  CheckCircle2,
  FileCode,
  GitBranch,
  Terminal,
  Blocks,
  ArrowRight,
  ChevronDown,
  X,
  Github,
  Folder,
  Package,
  FileJson
} from 'lucide-react';
import { toast } from 'sonner';

function CodeModal({ isOpen, onClose, fileName, code }: { isOpen: boolean; onClose: () => void; fileName: string; code: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl"
      >
        {}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{fileName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              title="Copy code"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {}
        <div className="flex-1 overflow-auto p-6 bg-background/50">
          <pre className="text-xs sm:text-sm font-mono text-muted-foreground whitespace-pre-wrap">
            {code}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}

interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  code?: string;
}

interface FileTreeItemProps {
  name: string;
  type: 'file' | 'folder';
  level: number;
  children?: FileTreeNode[];
  code?: string;
  onFileClick?: (name: string, code: string) => void;
}

function FileTreeItem({ name, type, level, children, code, onFileClick }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const paddingLeft = level * 20 + 12;

  const handleClick = () => {
    if (type === 'folder') {
      setIsOpen(!isOpen);
    } else if (type === 'file' && code && onFileClick) {
      onFileClick(name, code);
    }
  };

  return (
    <>
      <div 
        className={`flex items-center gap-2 px-3 py-2 hover:bg-primary/5 transition-colors cursor-pointer`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
      >
        {type === 'folder' ? (
          <>
            <ChevronDown 
              className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} 
            />
            <Folder className="w-4 h-4 text-primary" />
          </>
        ) : (
          <>
            <div className="w-4" />
            <FileCode className="w-4 h-4 text-muted-foreground" />
          </>
        )}
        <span className="text-sm font-mono">{name}</span>
      </div>
      
      {type === 'folder' && isOpen && children?.map((child, idx) => (
        <FileTreeItem 
          key={idx}
          name={child.name}
          type={child.type}
          level={level + 1}
          children={child.children}
          code={child.code}
          onFileClick={onFileClick}
        />
      ))}
    </>
  );
}

const CONTRACT_ADDRESSES = {
  voteManager: '0x032094C13B091097418A2324673c6A083ae643A0',
  rewardManager: '0x4Ba2513f193D72a750810Bd29B0F5f181512630A',
  zvpToken: '0xc418c3FA5D0aDa1425e4F67C665Abe5aB61FCFA4'
};

const CONTRACT_CODES = {
  voteManager: `// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, ebool, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

interface IZVPSoulbound {
    function burnFrom(address from, uint256 amount) external returns (bool);
}

interface IVoterNFT {
    function mint(address to, uint256 achievementLevel) external;
}

contract VoteManagerFHEScore is SepoliaConfig {
    uint8 public constant MAX_VOTES_PER_DAPP = 3;
    uint8 public constant MIN_RATING = 1;
    uint8 public constant MAX_RATING = 5;
    uint8 public constant NFT_THRESHOLD = 3;
    
    uint256 public constant DECRYPTION_TIMEOUT = 1 hours;
    uint256 public constant AUTO_DECRYPT_COOLDOWN = 30 seconds;
    
    address public owner;
    address public immutable zvp;
    address public voterNFT;
    uint256 public pricePerVote;
    bool public paused;
    bool public autoDecryptEnabled = true;
    
    uint256 private _locked = 1;
    
    // ... Full contract code available in source
    // View complete implementation at:
    // https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.voteManager}#code
}`,
  
  zvpToken: `// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/**
 * @title ZVPSoulbound
 * @notice Soulbound token untuk voting - TIDAK BISA TRANSFER antar user
 * @dev Token hanya bisa di-BURN untuk voting, dan di-distribute dari whitelisted contracts
 */
contract ZVPSoulbound {
    string public constant name = "Zamaverse Voting Power";
    string public constant symbol = "ZVP";
    uint8 public constant decimals = 18;
    
    address public owner;
    uint256 private _totalSupply;
    
    mapping(address => uint256) private _balances;
    mapping(address => bool) public whitelistedDistributors;
    mapping(address => bool) public whitelistedBurners;
    
    // ... Full contract code available in source
    // View complete implementation at:
    // https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.zvpToken}#code
}`,
  
  rewardManager: `// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, ebool, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

interface IZVPSoulbound {
    function mint(address to, uint256 amount) external;
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external;
}

/**
 * @title RewardManager v2.1.0
 * @notice Mengelola semua jenis reward dengan FHE privacy
 * @dev Support: Daily Login, Referral, Campaign, Quest, Platform Tasks
 */
contract RewardManager is SepoliaConfig {
    uint256 public constant DECRYPTION_TIMEOUT = 1 hours;
    uint8 public constant MAX_REFERRALS = 3;

    address public owner;
    address public zvpToken;
    bool public paused;
    uint256 public dailyLoginReward = 10 * 10**18;
    euint32 public encReferrerReward;
    euint32 public encReferredReward;
    uint256 public nextCampaignId = 1;

    // ... Full contract with 700+ lines
    // Includes: Daily Login, Referral System, Campaign Manager
    // View complete implementation at:
    // https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.rewardManager}#code
    
    function claimDailyLogin() external whenNotPaused nonReentrant { /* ... */ }
    function registerReferral(address referrer) external { /* ... */ }
    function createCampaign(string memory name, uint256 start, uint256 end) external { /* ... */ }
    function version() external pure returns (string memory) { return "2.1.0-signature-only"; }
}`
};

const TAB_CONTENT = {
  overview: {
    title: 'Platform Overview',
    subtitle: 'Privacy-preserving voting architecture',
    icon: Blocks,
    gradient: 'from-primary/20 via-primary-glow/20 to-accent/20'
  },
  codebase: {
    title: 'Open Source',
    subtitle: 'Full codebase & tech stack',
    icon: Github,
    gradient: 'from-cyan-500/20 via-blue-500/20 to-purple-500/20'
  },
  'vote-manager': {
    title: 'VoteManager Contract',
    subtitle: 'Encrypted voting with FHE',
    icon: Lock,
    gradient: 'from-purple-500/20 via-primary/20 to-blue-500/20'
  },
  'reward-manager': {
    title: 'RewardManager Contract',
    subtitle: 'Campaign & reward distribution',
    icon: Zap,
    gradient: 'from-orange-500/20 via-primary/20 to-yellow-500/20'
  },
  'zvp-token': {
    title: 'ZVP Token Contract',
    subtitle: 'Encrypted ERC20 with private balances',
    icon: Cpu,
    gradient: 'from-green-500/20 via-primary-glow/20 to-emerald-500/20'
  },
  integration: {
    title: 'Integration Guide',
    subtitle: 'Frontend & React hooks',
    icon: Network,
    gradient: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20'
  }
};

export default function Docs() {
  const [activeTab, setActiveTab] = useState<keyof typeof TAB_CONTENT>('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState({ name: '', code: '' });

  const handleFileClick = (name: string, code: string) => {
    setSelectedFile({ name, code });
    setModalOpen(true);
  };
  const [codeModal, setCodeModal] = useState<{ open: boolean; contract: keyof typeof CONTRACT_CODES | null }>({ 
    open: false, 
    contract: null 
  });
  
  const currentTab = TAB_CONTENT[activeTab];
  const IconComponent = currentTab.icon;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const openCodeModal = (contract: keyof typeof CONTRACT_CODES) => {
    setCodeModal({ open: true, contract });
  };

  const closeCodeModal = () => {
    setCodeModal({ open: false, contract: null });
  };

  const ContractCard = ({ 
    name, 
    address, 
    description, 
    icon: Icon,
    color,
    contractKey
  }: { 
    name: string; 
    address: string; 
    description: string; 
    icon: any;
    color: string;
    contractKey: keyof typeof CONTRACT_CODES;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative group overflow-hidden rounded-lg sm:rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-gradient-to-br ${color} flex-shrink-0`}>
              <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
            </div>
            <h3 className="font-semibold text-xs sm:text-sm truncate">{name}</h3>
          </div>
        </div>

        <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
        
        <div className="flex items-center gap-1 p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-muted/50 border border-border/50">
          <code className="text-[9px] sm:text-[10px] font-mono flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {address}
          </code>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => copyToClipboard(address, 'Address')}
            className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">Copy</span>
          </button>
          <a
            href={`https://sepolia.etherscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors"
          >
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">Scan</span>
          </a>
          <button
            onClick={() => openCodeModal(contractKey)}
            className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <Code2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">Code</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      {}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden border-b border-border/50"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${currentTab.gradient} opacity-50`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,215,0,0.05),transparent_50%)]" />
          
          <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={`p-2 sm:p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br ${currentTab.gradient} border border-border/50 backdrop-blur-sm`}
              >
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-foreground" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-0.5 sm:mb-1 truncate"
                >
                  {currentTab.title}
                </motion.h1>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs sm:text-sm text-muted-foreground truncate"
                >
                  {currentTab.subtitle}
                </motion.p>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                <div className="px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] md:text-xs font-medium text-primary flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
                  <Lock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span className="hidden md:inline">FHE Powered</span>
                  <span className="md:hidden">FHE</span>
                </div>
                <div className="px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] md:text-xs font-medium text-accent flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
                  <Shield className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span className="hidden md:inline">Private</span>
                  <span className="md:hidden">🔒</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <nav className="w-full overflow-x-auto smooth-scroll scrollbar-hide">
          <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 min-w-max max-w-7xl mx-auto">
            {Object.entries(TAB_CONTENT).map(([key, value]) => {
              const Icon = value.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as keyof typeof TAB_CONTENT)}
                  className={`
                    relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all flex-shrink-0
                    ${activeTab === key 
                      ? 'text-foreground bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">{value.title.split(' ')[0]}</span>
                  {activeTab === key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                {}
                <div className="-mx-3 sm:mx-0 rounded-none sm:rounded-xl border-y sm:border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 sm:p-6 md:p-8">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                    <Network className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    System Architecture
                  </h2>
                  
                  <div className="relative overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                    <svg className="w-full h-auto min-w-[700px] sm:min-w-0" viewBox="0 0 800 400" fill="none">
                      {}
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border/20" />
                        </pattern>
                      </defs>
                      <rect width="800" height="400" fill="url(#grid)" />
                      
                      {}
                      <g>
                        <rect x="50" y="170" width="100" height="60" rx="8" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth="2" />
                        <text x="100" y="205" textAnchor="middle" className="text-xs font-semibold fill-foreground">User</text>
                      </g>

                      {}
                      <path d="M 150 200 L 200 200" stroke="hsl(var(--primary))" strokeWidth="2" markerEnd="url(#arrowhead)" />
                      <text x="175" y="190" textAnchor="middle" className="text-[10px] fill-muted-foreground">Encrypted Vote</text>

                      {}
                      <g>
                        <rect x="200" y="50" width="140" height="80" rx="8" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2" />
                        <text x="270" y="80" textAnchor="middle" className="text-xs font-semibold fill-foreground">VoteManager</text>
                        <text x="270" y="95" textAnchor="middle" className="text-[10px] fill-muted-foreground">FHE Computation</text>
                        <text x="270" y="108" textAnchor="middle" className="text-[9px] fill-muted-foreground">encSum, encCount</text>
                      </g>

                      {}
                      <path d="M 270 130 L 270 170" stroke="hsl(var(--accent))" strokeWidth="2" markerEnd="url(#arrowhead2)" />
                      <text x="285" y="155" className="text-[10px] fill-muted-foreground">Request</text>

                      {}
                      <g>
                        <rect x="200" y="170" width="140" height="60" rx="8" fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent))" strokeWidth="2" />
                        <text x="270" y="197" textAnchor="middle" className="text-xs font-semibold fill-foreground">Zama Oracle</text>
                        <text x="270" y="212" textAnchor="middle" className="text-[10px] fill-muted-foreground">KMS Decryption</text>
                      </g>

                      {}
                      <path d="M 210 230 L 210 280 L 230 280 L 230 130" stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrowhead2)" />
                      <text x="170" y="260" className="text-[10px] fill-muted-foreground">Callback</text>

                      {}
                      <g>
                        <rect x="400" y="50" width="140" height="80" rx="8" fill="hsl(49 99% 55% / 0.15)" stroke="hsl(49 99% 55%)" strokeWidth="2" />
                        <text x="470" y="80" textAnchor="middle" className="text-xs font-semibold fill-foreground">RewardManager</text>
                        <text x="470" y="95" textAnchor="middle" className="text-[10px] fill-muted-foreground">Campaign Logic</text>
                        <text x="470" y="108" textAnchor="middle" className="text-[9px] fill-muted-foreground">Reward Distribution</text>
                      </g>

                      {}
                      <g>
                        <rect x="400" y="170" width="140" height="80" rx="8" fill="hsl(var(--primary-glow) / 0.15)" stroke="hsl(var(--primary-glow))" strokeWidth="2" />
                        <text x="470" y="200" textAnchor="middle" className="text-xs font-semibold fill-foreground">ZVP Token</text>
                        <text x="470" y="215" textAnchor="middle" className="text-[10px] fill-muted-foreground">Encrypted ERC20</text>
                        <text x="470" y="228" textAnchor="middle" className="text-[9px] fill-muted-foreground">Private Balances</text>
                      </g>

                      {}
                      <path d="M 340 90 L 400 90" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4" />
                      <text x="370" y="80" textAnchor="middle" className="text-[10px] fill-muted-foreground">Burns</text>

                      {}
                      <path d="M 470 130 L 470 170" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4" />
                      <text x="485" y="155" className="text-[10px] fill-muted-foreground">Transfer</text>

                      {}
                      <path d="M 400 210 L 150 210" stroke="hsl(var(--primary-glow))" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrowhead3)" />
                      <text x="275" y="225" textAnchor="middle" className="text-[10px] fill-muted-foreground">Rewards</text>

                      {}
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--primary))" />
                        </marker>
                        <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--accent))" />
                        </marker>
                        <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--primary-glow))" />
                        </marker>
                      </defs>
                    </svg>
                  </div>

                  <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg bg-primary/5 border border-primary/20">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Encrypted Data</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg bg-accent/5 border border-accent/20">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Decryption Flow</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg bg-primary-glow/5 border border-primary-glow/20">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary-glow flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Token Transfer</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg bg-muted border border-border">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-border flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Connection</span>
                    </div>
                  </div>
                </div>

                {}
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                    <FileCode className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Smart Contracts
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <ContractCard
                      name="VoteManager"
                      address={CONTRACT_ADDRESSES.voteManager}
                      description="Privacy-preserving voting with encrypted ratings and controlled decryption via oracle"
                      icon={Lock}
                      color="from-purple-500/10 to-blue-500/10"
                      contractKey="voteManager"
                    />
                    <ContractCard
                      name="RewardManager"
                      address={CONTRACT_ADDRESSES.rewardManager}
                      description="Campaign management and ZVP reward distribution system for active voters"
                      icon={Zap}
                      color="from-orange-500/10 to-yellow-500/10"
                      contractKey="rewardManager"
                    />
                    <ContractCard
                      name="ZVP Token"
                      address={CONTRACT_ADDRESSES.zvpToken}
                      description="Fully encrypted ERC20 token with private balances and homomorphic operations"
                      icon={Cpu}
                      color="from-green-500/10 to-emerald-500/10"
                      contractKey="zvpToken"
                    />
                  </div>
                </div>

                {}
                <div className="rounded-lg sm:rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-3 sm:p-4 md:p-6">
                  <h2 className="text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Privacy Guarantees
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 sm:space-y-3">
                      <FeatureItem
                        icon={Eye}
                        title="Encrypted Ratings"
                        description="Individual votes stored as euint8, never exposed on-chain"
                      />
                      <FeatureItem
                        icon={Binary}
                        title="Homomorphic Operations"
                        description="Sum and count computed without decryption"
                      />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <FeatureItem
                        icon={Key}
                        title="Controlled Decryption"
                        description="Only aggregates revealed via Zama KMS oracle"
                      />
                      <FeatureItem
                        icon={CheckCircle2}
                        title="Vote Anonymity"
                        description="Cannot link individual ratings to voters"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {}
            {activeTab === 'codebase' && (
              <div className="space-y-4 sm:space-y-6">
                {}
                <div className="rounded-lg sm:rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                    <Github className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Open Source Repository
                  </h2>
                  
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                    Zapps.fun is fully open source. Browse the complete codebase including smart contracts, frontend, and FHE integration directly below.
                  </p>

                  <div className="grid gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <Lock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 text-sm sm:text-base text-amber-500">Repository Status: Private (Under Audit)</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          The GitHub repository is currently private as we undergo security auditing and final development. 
                          <strong className="text-foreground"> The source code will be publicly released soon.</strong> Meanwhile, you can explore the complete codebase structure and implementation details below.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-background/50 border border-border/30">
                      <Code2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 text-sm sm:text-base">Interactive Code Browser</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">Click any file to view full implementation</p>
                        <a 
                          href="https://zapps.fun" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-primary hover:underline"
                        >
                          zapps.fun
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-background/50 border border-border/30">
                      <FileJson className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 text-sm sm:text-base">License</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">MIT License - Free to use, modify, and distribute</p>
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="rounded-lg sm:rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                    <FileCode className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Browse Source Code
                  </h2>
                  
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Explore the complete source code structure. Click on any file to view its contents.
                  </p>

                  <div className="bg-background/50 rounded-lg border border-border/30 overflow-hidden">
                    {}
                    <div className="divide-y divide-border/30">
                      {}
                      <FileTreeItem 
                        name="Zapps FHE" 
                        type="folder" 
                        level={0}
                        onFileClick={handleFileClick}
                        children={[
                          {
                            name: "contracts",
                            type: "folder",
                            children: [
                              { name: "VoteManager.sol", type: "file", code: CONTRACT_CODES.voteManager },
                              { name: "RewardManager.sol", type: "file", code: CONTRACT_CODES.rewardManager },
                              { name: "ZVP.sol", type: "file", code: CONTRACT_CODES.zvpToken },
                              { name: "ZVPSoulbound.sol", type: "file", code: `// SPDX-License-Identifier: BSD-3-Clause-Clear\npragma solidity ^0.8.24;\n\ncontract ZVPSoulbound {\n  string public constant name = "Zapps Voting Power";\n  string public constant symbol = "ZVP";\n  // Soulbound - Non-transferable\n  // Full code available in repository\n}` },
                              { 
                                name: "artifacts", 
                                type: "folder",
                                children: [
                                  { name: "VoteManager.json", type: "file", code: `{\n  "contractName": "VoteManager",\n  "abi": [...],\n  "bytecode": "0x..."\n}` },
                                  { name: "RewardManager.json", type: "file", code: `{\n  "contractName": "RewardManager",\n  "abi": [...],\n  "bytecode": "0x..."\n}` },
                                  { name: "ZVP.json", type: "file", code: `{\n  "contractName": "ZVP",\n  "abi": [...],\n  "bytecode": "0x..."\n}` }
                                ]
                              }
                            ]
                          },
                          {
                            name: "src",
                            type: "folder",
                            children: [
                              {
                                 name: "components",
                                 type: "folder",
                                 children: [
                                   { name: "Header.tsx", type: "file", code: `import { useWallet } from '@/contexts/WalletContext';\nimport { Button } from '@/components/ui/button';\n\nexport function Header() {\n  const { address, connect } = useWallet();\n  \n  return (\n    <header className="border-b">\n      <div className="container mx-auto px-4 py-4">\n        <Button onClick={connect}>\n          {address ? 'Connected' : 'Connect Wallet'}\n        </Button>\n      </div>\n    </header>\n  );\n}` },
                                   { name: "Layout.tsx", type: "file", code: `import { Header } from './Header';\nimport { Footer } from './Footer';\n\nexport function Layout({ children }: { children: React.ReactNode }) {\n  return (\n    <div className="min-h-screen flex flex-col">\n      <Header />\n      <main className="flex-1">{children}</main>\n      <Footer />\n    </div>\n  );\n}` },
                                   { name: "VoteModal.tsx", type: "file", code: `import { useState } from 'react';\nimport { Dialog } from '@/components/ui/dialog';\nimport { voteManager } from '@/lib/contracts/voteManager';\n\nexport function VoteModal({ dappId, isOpen, onClose }) {\n  const [rating, setRating] = useState(5);\n  \n  const handleVote = async () => {\n    await voteManager.rateApp(dappId, rating);\n    onClose();\n  };\n  \n  return (\n    <Dialog open={isOpen} onOpenChange={onClose}>\n      {/* Vote UI */}\n    </Dialog>\n  );\n}` },
                                   { name: "WalletModal.tsx", type: "file", code: `import { Dialog } from '@/components/ui/dialog';\nimport { WalletFactory } from '@/lib/wallet/factory';\n\nexport function WalletModal({ isOpen, onClose }) {\n  const wallets = WalletFactory.getAvailableWallets('sepolia');\n  \n  return (\n    <Dialog open={isOpen} onOpenChange={onClose}>\n      {wallets.map(wallet => (\n        <button key={wallet} onClick={() => connectWallet(wallet)}>\n          Connect {wallet}\n        </button>\n      ))}\n    </Dialog>\n  );\n}` },
                                   { name: "DAppsList.tsx", type: "file", code: `import { useQuery } from '@tanstack/react-query';\nimport { db } from '@/integrations/database/client';\n\nexport function DAppsList() {\n  const { data: dapps } = useQuery({\n    queryKey: ['dapps'],\n    queryFn: async () => {\n      const { data } = await db.from('dapps').select('*');\n      return data;\n    }\n  });\n  \n  return (\n    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">\n      {dapps?.map(dapp => (\n        <DAppCard key={dapp.id} dapp={dapp} />\n      ))}\n    </div>\n  );\n}` },
                                   { name: "CampaignsList.tsx", type: "file", code: `import { useQuery } from '@tanstack/react-query';\nimport { db } from '@/integrations/database/client';\n\nexport function CampaignsList() {\n  const { data: campaigns } = useQuery({\n    queryKey: ['campaigns'],\n    queryFn: async () => {\n      const { data } = await db.from('campaigns').select('*');\n      return data;\n    }\n  });\n  \n  return (\n    <div className="space-y-4">\n      {campaigns?.map(campaign => (\n        <CampaignCard key={campaign.id} campaign={campaign} />\n      ))}\n    </div>\n  );\n}` },
                                   {
                                      name: "ui",
                                      type: "folder",
                                     children: [
                                       { name: "button.tsx", type: "file", code: `import { cva } from 'class-variance-authority';\nimport { cn } from '@/lib/utils';\n\nconst buttonVariants = cva(\n  "inline-flex items-center justify-center rounded-lg font-medium transition-colors",\n  {\n    variants: {\n      variant: {\n        default: "bg-primary text-primary-foreground hover:bg-primary/90",\n        outline: "border border-border hover:bg-accent",\n      }\n    }\n  }\n);\n\nexport function Button({ className, variant, ...props }) {\n  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;\n}` },
                                       { name: "card.tsx", type: "file", code: `import { cn } from '@/lib/utils';\n\nexport function Card({ className, ...props }) {\n  return <div className={cn("rounded-xl border bg-card", className)} {...props} />;\n}\n\nexport function CardHeader({ className, ...props }) {\n  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;\n}\n\nexport function CardContent({ className, ...props }) {\n  return <div className={cn("p-6 pt-0", className)} {...props} />;\n}` },
                                       { name: "dialog.tsx", type: "file", code: `import * as DialogPrimitive from '@radix-ui/react-dialog';\nimport { cn } from '@/lib/utils';\n\nexport function Dialog(props) {\n  return <DialogPrimitive.Root {...props} />;\n}\n\nexport function DialogContent({ className, ...props }) {\n  return (\n    <DialogPrimitive.Portal>\n      <DialogPrimitive.Overlay className="fixed inset-0 bg-background/80" />\n      <DialogPrimitive.Content \n        className={cn("fixed inset-0 z-50 flex items-center justify-center", className)} \n        {...props} \n      />\n    </DialogPrimitive.Portal>\n  );\n}` },
                                       { name: "input.tsx", type: "file", code: `import { cn } from '@/lib/utils';\n\nexport function Input({ className, ...props }) {\n  return (\n    <input \n      className={cn(\n        "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2",\n        "text-sm placeholder:text-muted-foreground",\n        "focus:outline-none focus:ring-2 focus:ring-primary",\n        className\n      )}\n      {...props}\n    />\n  );\n}` },
                                       { name: "...", type: "file" }
                                     ]
                                   },
                                   {
                                      name: "admin",
                                      type: "folder",
                                     children: [
                                       { name: "DAppDialog.tsx", type: "file", code: `import { Dialog } from '@/components/ui/dialog';\nimport { Input } from '@/components/ui/input';\nimport { Button } from '@/components/ui/button';\nimport { db } from '@/integrations/database/client';\nimport { useState } from 'react';\n\nexport function DAppDialog({ isOpen, onClose, dapp }) {\n  const [formData, setFormData] = useState({\n    name: dapp?.name || '',\n    description: dapp?.description || '',\n    logo_url: dapp?.logo_url || '',\n    website_url: dapp?.website_url || ''\n  });\n  \n  const handleSubmit = async () => {\n    if (dapp?.id) {\n      await db.from('dapps').update(formData).eq('id', dapp.id);\n    } else {\n      await db.from('dapps').insert(formData);\n    }\n    onClose();\n  };\n  \n  return (\n    <Dialog open={isOpen} onOpenChange={onClose}>\n      <div className="space-y-4">\n        <Input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />\n        <Input placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />\n        <Button onClick={handleSubmit}>Save</Button>\n      </div>\n    </Dialog>\n  );\n}` },
                                       { name: "CampaignDialog.tsx", type: "file", code: `import { Dialog } from '@/components/ui/dialog';\nimport { Input } from '@/components/ui/input';\nimport { Button } from '@/components/ui/button';\nimport { db } from '@/integrations/database/client';\nimport { useState } from 'react';\n\nexport function CampaignDialog({ isOpen, onClose, campaign }) {\n  const [formData, setFormData] = useState({\n    title: campaign?.title || '',\n    description: campaign?.description || '',\n    start_date: campaign?.start_date || '',\n    end_date: campaign?.end_date || '',\n    reward_amount: campaign?.reward_amount || 0\n  });\n  \n  const handleSubmit = async () => {\n    if (campaign?.id) {\n      await db.from('campaigns').update(formData).eq('id', campaign.id);\n    } else {\n      await db.from('campaigns').insert(formData);\n    }\n    onClose();\n  };\n  \n  return (\n    <Dialog open={isOpen} onOpenChange={onClose}>\n      <div className="space-y-4">\n        <Input placeholder="Campaign Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />\n        <Input placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />\n        <Button onClick={handleSubmit}>Save Campaign</Button>\n      </div>\n    </Dialog>\n  );\n}` },
                                       { name: "QuestsManager.tsx", type: "file", code: `import { useQuery, useMutation } from '@tanstack/react-query';\nimport { db } from '@/integrations/database/client';\nimport { Button } from '@/components/ui/button';\nimport { Card } from '@/components/ui/card';\n\nexport function QuestsManager({ campaignId }) {\n  const { data: quests } = useQuery({\n    queryKey: ['quests', campaignId],\n    queryFn: async () => {\n      const { data } = await db.from('campaign_quests')\n        .select('*')\n        .eq('campaign_id', campaignId)\n        .order('quest_order', { ascending: true });\n      return data;\n    }\n  });\n  \n  const createQuest = useMutation({\n    mutationFn: async (questData) => {\n      await db.from('campaign_quests').insert({\n        campaign_id: campaignId,\n        ...questData\n      });\n    }\n  });\n  \n  return (\n    <div className="space-y-4">\n      <h2 className="text-2xl font-bold">Campaign Quests</h2>\n      {quests?.map(quest => (\n        <Card key={quest.id} className="p-4">\n          <h3>{quest.title}</h3>\n          <p>{quest.description}</p>\n          <p>Points: {quest.points}</p>\n        </Card>\n      ))}\n      <Button onClick={() => createQuest.mutate({ title: 'New Quest' })}>\n        Add Quest\n      </Button>\n    </div>\n  );\n}` },
                                       { name: "FHELogsDialog.tsx", type: "file", code: `import { useQuery } from '@tanstack/react-query';\nimport { Dialog } from '@/components/ui/dialog';\nimport { db } from '@/integrations/database/client';\n\nexport function FHELogsDialog({ isOpen, onClose, dappId }) {\n  const { data: logs } = useQuery({\n    queryKey: ['fhe-logs', dappId],\n    queryFn: async () => {\n      const { data } = await db.from('fhe_logs')\n        .select('*')\n        .eq('dapp_id', dappId)\n        .order('created_at', { ascending: false })\n        .limit(50);\n      return data;\n    },\n    enabled: isOpen\n  });\n  \n  return (\n    <Dialog open={isOpen} onOpenChange={onClose}>\n      <div className="max-h-96 overflow-auto">\n        <h2 className="text-xl font-bold mb-4">FHE Operation Logs</h2>\n        {logs?.map(log => (\n          <div key={log.id} className={\`p-2 border-b \${log.level === 'error' ? 'text-red-500' : ''}\`}>\n            <div className="flex justify-between text-sm">\n              <span className="font-mono">{new Date(log.created_at).toLocaleString()}</span>\n              <span className="font-semibold">{log.level}</span>\n            </div>\n            <p className="text-xs mt-1">{log.message}</p>\n          </div>\n        ))}\n      </div>\n    </Dialog>\n  );\n}` }
                                     ]
                                   }
                                ]
                               },
                                {
                                  name: "pages",
                                  type: "folder",
                                 children: [
                                   { name: "Home.tsx", type: "file", code: `import { HeroBanner } from '@/components/HeroBanner';\nimport { FeaturedDApps } from '@/components/FeaturedDApps';\nimport { HighlightCampaigns } from '@/components/HighlightCampaigns';\n\nexport default function Home() {\n  return (\n    <div className="min-h-screen">\n      <HeroBanner />\n      <FeaturedDApps />\n      <HighlightCampaigns />\n    </div>\n  );\n}` },
                                   { name: "DAppsDirectory.tsx", type: "file", code: `import { useState } from 'react';\nimport { DAppsList } from '@/components/DAppsList';\nimport { FilterChips } from '@/components/FilterChips';\n\nexport default function DAppsDirectory() {\n  const [category, setCategory] = useState('all');\n  \n  return (\n    <div className="container mx-auto py-8">\n      <h1 className="text-4xl font-bold mb-8">Explore DApps</h1>\n      <FilterChips selected={category} onChange={setCategory} />\n      <DAppsList category={category} />\n    </div>\n  );\n}` },
                                   { name: "DAppDetail.tsx", type: "file", code: `import { useParams } from 'react-router-dom';\nimport { useQuery } from '@tanstack/react-query';\nimport { db } from '@/integrations/database/client';\nimport { VoteModal } from '@/components/VoteModal';\n\nexport default function DAppDetail() {\n  const { id } = useParams();\n  const { data: dapp } = useQuery({\n    queryKey: ['dapp', id],\n    queryFn: async () => {\n      const { data } = await db.from('dapps').select('*').eq('id', id).single();\n      return data;\n    }\n  });\n  \n  return (\n    <div className="container mx-auto py-8">\n      <h1>{dapp?.name}</h1>\n      <p>{dapp?.description}</p>\n      <VoteModal dappId={id} />\n    </div>\n  );\n}` },
                                   { name: "Campaigns.tsx", type: "file", code: `import { CampaignsList } from '@/components/CampaignsList';\nimport { useQuery } from '@tanstack/react-query';\nimport { db } from '@/integrations/database/client';\n\nexport default function Campaigns() {\n  const { data: campaigns } = useQuery({\n    queryKey: ['campaigns'],\n    queryFn: async () => {\n      const { data } = await db.from('campaigns')\n        .select('*')\n        .eq('is_active', true)\n        .order('created_at', { ascending: false });\n      return data;\n    }\n  });\n  \n  return (\n    <div className="container mx-auto py-8">\n      <h1 className="text-4xl font-bold mb-8">Active Campaigns</h1>\n      <CampaignsList campaigns={campaigns} />\n    </div>\n  );\n}` },
                                   { name: "CampaignDetail.tsx", type: "file", code: `import { useParams } from 'react-router-dom';\nimport { QuestsManager } from '@/components/admin/QuestsManager';\n\nexport default function CampaignDetail() {\n  const { id } = useParams();\n  \n  return (\n    <div className="container mx-auto py-8">\n      <QuestsManager campaignId={id} />\n    </div>\n  );\n}` },
                                   { name: "Profile.tsx", type: "file", code: `import { useWallet } from '@/contexts/WalletContext';\nimport { useQuery } from '@tanstack/react-query';\nimport { db } from '@/integrations/database/client';\n\nexport default function Profile() {\n  const { address } = useWallet();\n  const { data: profile } = useQuery({\n    queryKey: ['profile', address],\n    queryFn: async () => {\n      const { data } = await db.from('profiles')\n        .select('*')\n        .eq('wallet_address', address)\n        .single();\n      return data;\n    }\n  });\n  \n  return (\n    <div className="container mx-auto py-8">\n      <h1>Profile: {address}</h1>\n      <div>RVP Balance: {profile?.rvp_balance}</div>\n    </div>\n  );\n}` },
                                   { name: "Rewards.tsx", type: "file", code: `import { useWallet } from '@/contexts/WalletContext';\nimport { rewardManager } from '@/lib/contracts/rewardManager';\nimport { Button } from '@/components/ui/button';\n\nexport default function Rewards() {\n  const { address } = useWallet();\n  \n  const handleClaimDaily = async () => {\n    await rewardManager.claimDailyLogin();\n  };\n  \n  return (\n    <div className="container mx-auto py-8">\n      <h1 className="text-4xl font-bold mb-8">Rewards</h1>\n      <Button onClick={handleClaimDaily}>Claim Daily Reward</Button>\n    </div>\n  );\n}` },
                                   { name: "Docs.tsx", type: "file", code: `// This file! Full documentation with interactive code browser` },
                                   { name: "...", type: "file" }
                                 ]
                                },
                               {
                                 name: "lib",
                                 type: "folder",
                                 children: [
                                    {
                                      name: "contracts",
                                      type: "folder",
                                     children: [
                                       { name: "abis.ts", type: "file", code: `// Contract ABIs\nexport const VOTE_MANAGER_ABI = [\n  {\n    "inputs": [{\n      "name": "dappId",\n      "type": "uint256"\n    }],\n    "name": "rateApp",\n    "outputs": [],\n    "stateMutability": "nonpayable",\n    "type": "function"\n  },\n  // ... more ABI entries\n];\n\nexport const REWARD_MANAGER_ABI = [...];\nexport const ZVP_TOKEN_ABI = [...];` },
                                       { name: "abis-fhe.ts", type: "file", code: `import { FHE } from '@fhevm/solidity';\n\n// FHE-specific contract ABIs with encrypted types\nexport const VOTE_MANAGER_FHE_ABI = [\n  {\n    "inputs": [\n      { "name": "dappId", "type": "uint256" },\n      { "name": "encRating", "type": "externalEuint8" },\n      { "name": "proof", "type": "bytes" }\n    ],\n    "name": "rateApp",\n    "type": "function"\n  },\n  // ... encrypted operations\n];` },
                                       { name: "addresses.ts", type: "file", code: `// Contract Addresses on Ethereum Sepolia\nexport const CONTRACT_ADDRESSES = {\n  VOTE_MANAGER: '0x032094C13B091097418A2324673c6A083ae643A0',\n  REWARD_MANAGER: '0x4Ba2513f193D72a750810Bd29B0F5f181512630A',\n  ZVP_TOKEN: '0xc418c3FA5D0aDa1425e4F67C665Abe5aB61FCFA4',\n  NETWORK: 'sepolia'\n};` },
                                       { name: "voteManager.ts", type: "file", code: `import { ethers } from 'ethers';\nimport { VOTE_MANAGER_ABI, CONTRACT_ADDRESSES } from './abis';\n\nexport const voteManager = {\n  async rateApp(dappId: number, rating: number) {\n    const provider = new ethers.BrowserProvider(window.ethereum);\n    const signer = await provider.getSigner();\n    const contract = new ethers.Contract(\n      CONTRACT_ADDRESSES.VOTE_MANAGER,\n      VOTE_MANAGER_ABI,\n      signer\n    );\n    return await contract.rateApp(dappId, rating);\n  },\n  // ... more methods\n};` },
                                       { name: "rewardManager.ts", type: "file", code: `import { ethers } from 'ethers';\nimport { REWARD_MANAGER_ABI, CONTRACT_ADDRESSES } from './abis';\n\nexport const rewardManager = {\n  async claimDailyLogin() {\n    const provider = new ethers.BrowserProvider(window.ethereum);\n    const signer = await provider.getSigner();\n    const contract = new ethers.Contract(\n      CONTRACT_ADDRESSES.REWARD_MANAGER,\n      REWARD_MANAGER_ABI,\n      signer\n    );\n    return await contract.claimDailyLogin();\n  },\n  // ... more reward methods\n};` },
                                       { name: "voteManagerFHE.ts", type: "file", code: `import { ethers } from 'ethers';\nimport { initFhevm, createInstance } from 'fhevmjs';\nimport { VOTE_MANAGER_FHE_ABI, CONTRACT_ADDRESSES } from './abis-fhe';\n\nlet fhevmInstance: any = null;\n\nexport const voteManagerFHE = {\n  async initFHE() {\n    if (fhevmInstance) return fhevmInstance;\n    \n    await initFhevm();\n    fhevmInstance = await createInstance({\n      network: window.ethereum,\n      gatewayUrl: 'https://gateway.sepolia.zama.ai'\n    });\n    return fhevmInstance;\n  },\n  \n  async rateAppEncrypted(dappId: number, rating: number) {\n    const instance = await this.initFHE();\n    const provider = new ethers.BrowserProvider(window.ethereum);\n    const signer = await provider.getSigner();\n    \n    // Encrypt rating using FHE\n    const encryptedRating = await instance.encrypt8(rating);\n    \n    const contract = new ethers.Contract(\n      CONTRACT_ADDRESSES.VOTE_MANAGER,\n      VOTE_MANAGER_FHE_ABI,\n      signer\n    );\n    \n    // Submit encrypted vote\n    return await contract.rateApp(\n      dappId,\n      encryptedRating.data,\n      encryptedRating.signature\n    );\n  },\n  \n  async getEncryptedAverage(dappId: number) {\n    const provider = new ethers.BrowserProvider(window.ethereum);\n    const contract = new ethers.Contract(\n      CONTRACT_ADDRESSES.VOTE_MANAGER,\n      VOTE_MANAGER_FHE_ABI,\n      provider\n    );\n    \n    // Get encrypted average (still encrypted on-chain)\n    return await contract.getEncryptedAverage(dappId);\n  }\n};` }
                                     ]
                    },
                    {
                      name: "wallet",
                                     type: "folder",
                                     children: [
                                       { name: "types.ts", type: "file", code: `export type WalletType = 'metamask' | 'walletconnect' | 'phantom';\nexport type NetworkType = 'sepolia' | 'ethereum';\n\nexport interface WalletAdapter {\n  connect(): Promise<string>;\n  disconnect(): Promise<void>;\n  getBalance(): Promise<string>;\n  signMessage(message: string): Promise<string>;\n}` },
                                        { name: "config.ts", type: "file", code: `import { NetworkType } from './types';\n\n// Ethereum Sepolia with Zama FHE Protocol\nexport const NETWORK_CONFIG = {\n  'sepolia': {\n    chainId: '0xaa36a7', // 11155111\n    rpcUrl: 'https://rpc.sepolia.org',\n    name: 'Ethereum Sepolia',\n    fheGateway: 'https://gateway.sepolia.zama.ai'\n  }\n};\n\nexport const FEATURES = {\n  EVM_ENABLED: true,\n  FHE_ENABLED: true\n};` },
                                       { name: "factory.ts", type: "file", code: `import { WalletAdapter, WalletType, NetworkType } from './types';\nimport { EVMWalletAdapter } from './adapters/EVMWalletAdapter';\n\nexport class WalletFactory {\n  static create(walletType: WalletType, network: NetworkType): WalletAdapter {\n    if (walletType === 'metamask' || walletType === 'walletconnect') {\n      return new EVMWalletAdapter(walletType, network);\n    }\n    throw new Error(\`Wallet type \${walletType} not supported\`);\n  }\n  \n  static getAvailableWallets(network: NetworkType): WalletType[] {\n    const wallets: WalletType[] = [];\n    if (window.ethereum?.isMetaMask) wallets.push('metamask');\n    wallets.push('walletconnect');\n    return wallets;\n  }\n}` },
                                        {
                                          name: "adapters",
                                          type: "folder",
                                         children: [
                                           { name: "EVMWalletAdapter.ts", type: "file", code: `import { ethers } from 'ethers';\nimport { WalletAdapter } from '../types';\n\nexport class EVMWalletAdapter implements WalletAdapter {\n  private provider: ethers.BrowserProvider;\n  \n  constructor(walletType: string, network: string) {\n    this.provider = new ethers.BrowserProvider(window.ethereum);\n  }\n  \n  async connect(): Promise<string> {\n    const accounts = await this.provider.send('eth_requestAccounts', []);\n    return accounts[0];\n  }\n  \n  async disconnect(): Promise<void> {\n    // Implementation\n  }\n  \n  async getBalance(): Promise<string> {\n    const signer = await this.provider.getSigner();\n    const balance = await this.provider.getBalance(signer.address);\n    return ethers.formatEther(balance);\n  }\n}` },
                                            { name: "ZamaWalletAdapter.ts", type: "file", code: `import { WalletAdapter } from '../types';\nimport { initFhevm, createInstance } from 'fhevmjs';\n\n// FHE Wallet Adapter for Ethereum Sepolia\nexport class ZamaWalletAdapter implements WalletAdapter {\n  private fhevmInstance: any;\n  \n  async connect(): Promise<string> {\n    await initFhevm();\n    this.fhevmInstance = await createInstance({\n      network: window.ethereum,\n      gatewayUrl: 'https://gateway.sepolia.zama.ai'\n    });\n    const accounts = await window.ethereum.request({\n      method: 'eth_requestAccounts'\n    });\n    return accounts[0];\n  }\n  \n  // ... FHE-specific methods\n}` }
                                         ]
                                       }
                                     ]
                                   },
                                   { name: "utils.ts", type: "file", code: `import { clsx, type ClassValue } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n\nexport function formatAddress(address: string): string {\n  return \`\${address.slice(0, 6)}...\${address.slice(-4)}\`;\n}\n\nexport function formatTokenAmount(amount: bigint, decimals: number = 18): string {\n  return (Number(amount) / Math.pow(10, decimals)).toFixed(2);\n}` }
                                ]
                              },
                                {
                                  name: "contexts",
                                  type: "folder",
                                 children: [
                                   { name: "AuthContext.tsx", type: "file", code: `import { createContext, useContext, useState, useEffect } from 'react';\nimport { db } from '@/integrations/database/client';\n\nconst AuthContext = createContext(null);\n\nexport function AuthProvider({ children }) {\n  const [user, setUser] = useState(null);\n  \n  useEffect(() => {\n    // Check authentication status\n    const checkAuth = async () => {\n      const { data } = await db.auth.getSession();\n      setUser(data?.session?.user ?? null);\n    };\n    checkAuth();\n  }, []);\n  \n  return (\n    <AuthContext.Provider value={{ user, setUser }}>\n      {children}\n    </AuthContext.Provider>\n  );\n}\n\nexport const useAuth = () => useContext(AuthContext);` },
                                   { name: "WalletContext.tsx", type: "file", code: `import { createContext, useContext, useState } from 'react';\nimport { WalletFactory } from '@/lib/wallet/factory';\n\nconst WalletContext = createContext(null);\n\nexport function WalletProvider({ children }) {\n  const [address, setAddress] = useState(null);\n  const [adapter, setAdapter] = useState(null);\n  \n  const connect = async (walletType = 'metamask') => {\n    const newAdapter = WalletFactory.create(walletType, 'sepolia');\n    const addr = await newAdapter.connect();\n    setAdapter(newAdapter);\n    setAddress(addr);\n  };\n  \n  const disconnect = async () => {\n    await adapter?.disconnect();\n    setAddress(null);\n    setAdapter(null);\n  };\n  \n  return (\n    <WalletContext.Provider value={{ address, connect, disconnect, adapter }}>\n      {children}\n    </WalletContext.Provider>\n  );\n}\n\nexport const useWallet = () => useContext(WalletContext);` }
                                 ]
                               },
                                {
                                  name: "hooks",
                                  type: "folder",
                                 children: [
                                   { name: "use-mobile.tsx", type: "file", code: `import { useEffect, useState } from 'react';\n\nexport function useMobile() {\n  const [isMobile, setIsMobile] = useState(false);\n  \n  useEffect(() => {\n    const checkMobile = () => {\n      setIsMobile(window.innerWidth < 768);\n    };\n    \n    checkMobile();\n    window.addEventListener('resize', checkMobile);\n    \n    return () => window.removeEventListener('resize', checkMobile);\n  }, []);\n  \n  return isMobile;\n}` },
                                   { name: "use-toast.ts", type: "file", code: `import { toast as sonnerToast } from 'sonner';\n\nexport function useToast() {\n  return {\n    toast: sonnerToast,\n    success: (message: string) => sonnerToast.success(message),\n    error: (message: string) => sonnerToast.error(message),\n    info: (message: string) => sonnerToast.info(message)\n  };\n}\n\nexport { sonnerToast as toast };` },
                                   { name: "useWalletBalance.ts", type: "file", code: `import { useQuery } from '@tanstack/react-query';\nimport { useWallet } from '@/contexts/WalletContext';\nimport { ethers } from 'ethers';\n\nexport function useWalletBalance() {\n  const { address, adapter } = useWallet();\n  \n  return useQuery({\n    queryKey: ['wallet-balance', address],\n    queryFn: async () => {\n      if (!adapter) return '0';\n      const balance = await adapter.getBalance();\n      return balance;\n    },\n    enabled: !!address && !!adapter,\n    refetchInterval: 10000 // Refresh every 10s\n  });\n}` },
                                   { name: "useFHEVote.ts", type: "file", code: `import { useState } from 'react';\nimport { initFhevm, createInstance, encrypt } from 'fhevmjs';\nimport { voteManagerFHE } from '@/lib/contracts/voteManagerFHE';\nimport { useWallet } from '@/contexts/WalletContext';\n\nexport function useFHEVote() {\n  const { address } = useWallet();\n  const [instance, setInstance] = useState(null);\n  const [loading, setLoading] = useState(false);\n  \n  const initFHE = async () => {\n    if (instance) return instance;\n    \n    await initFhevm();\n    const fhevmInstance = await createInstance({\n      network: window.ethereum,\n      gatewayUrl: 'https://gateway.sepolia.zama.ai'\n    });\n    setInstance(fhevmInstance);\n    return fhevmInstance;\n  };\n  \n  const submitEncryptedVote = async (dappId: number, rating: number) => {\n    setLoading(true);\n    try {\n      const fheInstance = await initFHE();\n      \n      // Encrypt rating (1-5) using FHE\n      const encryptedRating = await fheInstance.encrypt8(rating);\n      \n      // Submit encrypted vote to contract\n      const tx = await voteManagerFHE.rateApp(\n        dappId,\n        encryptedRating.data,\n        encryptedRating.signature\n      );\n      \n      await tx.wait();\n      return true;\n    } catch (error) {\n      console.error('FHE Vote Error:', error);\n      throw error;\n    } finally {\n      setLoading(false);\n    }\n  };\n  \n  return {\n    submitEncryptedVote,\n    loading,\n    isReady: !!instance\n  };\n}` }
                                 ]
                               },
                               {
                                  name: "integrations",
                                  type: "folder",
                                  children: [
                                    {
                                       name: "database",
                                       type: "folder",
                                      children: [
                                        { name: "client.ts", type: "file", code: `import { createClient } from '@database/client';

const databaseUrl = import.meta.env.VITE_DATABASE_URL;
const databaseKey = import.meta.env.VITE_DATABASE_KEY;

export const db = createClient(databaseUrl, databaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true
  }
});` },
                                        { name: "types.ts", type: "file", code: `export interface Database {
  public: {
    Tables: {
      dapps: {
        Row: { id: string; name: string; description: string; };
        Insert: { name: string; description: string; };
        Update: { name?: string; description?: string; };
      };
      campaigns: { };
      dapp_votes: { };
      profiles: { };
      fhe_logs: { };
    }
  }
}` }
                                      ]
                                   }
                                 ]
                               },
                                {
                                  name: "i18n",
                                  type: "folder",
                                  children: [
                                    { name: "config.ts", type: "file", code: `import i18n from 'i18next';\nimport { initReactI18next } from 'react-i18next';\nimport LanguageDetector from 'i18next-browser-languagedetector';\nimport en from './locales/en.json';\nimport cn from './locales/cn.json';\nimport fr from './locales/fr.json';\nimport id from './locales/id.json';\n\ni18n\n  .use(LanguageDetector)\n  .use(initReactI18next)\n  .init({\n    resources: {\n      en: { translation: en },\n      cn: { translation: cn },\n      fr: { translation: fr },\n      id: { translation: id }\n    },\n    fallbackLng: 'en',\n    interpolation: {\n      escapeValue: false\n    }\n  });\n\nexport default i18n;` },
                                    {
                                      name: "locales",
                                      type: "folder",
                                     children: [
                                       { name: "en.json", type: "file", code: `{\n  "nav": {\n    "home": "Home",\n    "dapps": "DApps",\n    "campaigns": "Campaigns",\n    "rewards": "Rewards",\n    "docs": "Docs"\n  },\n  "hero": {\n    "title": "Discover & Vote on Web3 DApps",\n    "subtitle": "Privacy-First Voting with FHE Encryption",\n    "cta": "Explore DApps"\n  },\n  "vote": {\n    "submit": "Submit Vote",\n    "rating": "Rate this DApp",\n    "encrypted": "Your vote is encrypted with FHE"\n  }\n}` },
                                       { name: "cn.json", type: "file", code: `{\n  "nav": {\n    "home": "首页",\n    "dapps": "去中心化应用",\n    "campaigns": "活动",\n    "rewards": "奖励",\n    "docs": "文档"\n  },\n  "hero": {\n    "title": "发现并投票 Web3 应用",\n    "subtitle": "基于 FHE 加密的隐私优先投票",\n    "cta": "浏览应用"\n  },\n  "vote": {\n    "submit": "提交投票",\n    "rating": "为此应用评分",\n    "encrypted": "您的投票使用 FHE 加密"\n  }\n}` },
                                       { name: "fr.json", type: "file", code: `{\n  "nav": {\n    "home": "Accueil",\n    "dapps": "DApps",\n    "campaigns": "Campagnes",\n    "rewards": "Récompenses",\n    "docs": "Documentation"\n  },\n  "hero": {\n    "title": "Découvrez et votez pour les DApps Web3",\n    "subtitle": "Vote privé avec chiffrement FHE",\n    "cta": "Explorer les DApps"\n  },\n  "vote": {\n    "submit": "Soumettre le vote",\n    "rating": "Évaluer cette DApp",\n    "encrypted": "Votre vote est chiffré avec FHE"\n  }\n}` },
                                       { name: "id.json", type: "file", code: `{\n  "nav": {\n    "home": "Beranda",\n    "dapps": "Aplikasi",\n    "campaigns": "Kampanye",\n    "rewards": "Hadiah",\n    "docs": "Dokumentasi"\n  },\n  "hero": {\n    "title": "Temukan & Vote DApps Web3",\n    "subtitle": "Voting Privasi dengan Enkripsi FHE",\n    "cta": "Jelajahi DApps"\n  },\n  "vote": {\n    "submit": "Kirim Vote",\n    "rating": "Beri Rating DApp Ini",\n    "encrypted": "Vote Anda dienkripsi dengan FHE"\n  }\n}` }
                                     ]
                                   }
                                 ]
                               },
                               { name: "App.tsx", type: "file", code: `import { BrowserRouter, Routes, Route } from 'react-router-dom';\nimport { QueryClient, QueryClientProvider } from '@tanstack/react-query';\nimport { Toaster } from 'sonner';\nimport { WalletProvider } from '@/contexts/WalletContext';\nimport { AuthProvider } from '@/contexts/AuthContext';\nimport { Layout } from '@/components/Layout';\nimport Home from '@/pages/Home';\nimport DAppsDirectory from '@/pages/DAppsDirectory';\nimport DAppDetail from '@/pages/DAppDetail';\nimport Campaigns from '@/pages/Campaigns';\nimport Docs from '@/pages/Docs';\n\nconst queryClient = new QueryClient();\n\nexport default function App() {\n  return (\n    <QueryClientProvider client={queryClient}>\n      <BrowserRouter>\n        <AuthProvider>\n          <WalletProvider>\n            <Layout>\n              <Routes>\n                <Route path="/" element={<Home />} />\n                <Route path="/dapps" element={<DAppsDirectory />} />\n                <Route path="/dapps/:id" element={<DAppDetail />} />\n                <Route path="/campaigns" element={<Campaigns />} />\n                <Route path="/docs" element={<Docs />} />\n              </Routes>\n            </Layout>\n            <Toaster position="top-right" />\n          </WalletProvider>\n        </AuthProvider>\n      </BrowserRouter>\n    </QueryClientProvider>\n  );\n}` },
                               { name: "main.tsx", type: "file", code: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\nimport './i18n/config';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);` },
                               { name: "index.css", type: "file", code: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    --background: 222 47% 11%;\n    --foreground: 213 31% 91%;\n    --primary: 262 83% 58%;\n    --primary-foreground: 210 40% 98%;\n    --primary-glow: 271 91% 65%;\n    --accent: 173 80% 40%;\n    --border: 216 34% 17%;\n    --muted: 223 47% 11%;\n    --muted-foreground: 215.4 16.3% 56.9%;\n    /* ... more design tokens */\n  }\n}\n\n@layer utilities {\n  .smooth-scroll {\n    scroll-behavior: smooth;\n  }\n  \n  .scrollbar-hide::-webkit-scrollbar {\n    display: none;\n  }\n}` }
                            ]
                            },
                            {
                              name: "backend",
                              type: "folder",
                              children: [
                                {
                                  name: "functions",
                                  type: "folder",
                                  children: [
                                      { 
                                        name: "fhe-auto-relayer", 
                                        type: "folder",
                                       children: [
                                         { name: "index.ts", type: "file", code: `import { createDatabaseClient } from '../_shared/database.ts';
import { ethers } from 'https://esm.sh/ethers@6.15.0';

const VOTE_MANAGER_ADDRESS = '0x032094C13B091097418A2324673c6A083ae643A0';

Deno.serve(async (req) => {
  const db = createDatabaseClient();
  
  const { data: pendingDapps } = await db
    .from('dapp_scores')
    .select('dapp_id, last_snapshot_req_at')
    .gt('pending_attempts', 0)
    .lt('pending_attempts', 5);
  
  if (!pendingDapps?.length) {
    return new Response(JSON.stringify({ status: 'no_pending' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
  const wallet = new ethers.Wallet(Deno.env.get('DEPLOYER_PRIVATE_KEY')!, provider);
  
  for (const { dapp_id } of pendingDapps) {
    try {
      const voteManager = new ethers.Contract(
        VOTE_MANAGER_ADDRESS,
        ['function requestDecryption(uint256 dappId) external'],
        wallet
      );
      
      const tx = await voteManager.requestDecryption(dapp_id);
      await tx.wait();
      
      await db.from('fhe_logs').insert({
        dapp_id,
        level: 'info',
        message: 'FHE decryption request sent',
        details: { txHash: tx.hash }
      });
    } catch (error) {
      console.error(\`Relayer error for dApp \${dapp_id}:\`, error);
    }
  }
  
  return new Response(JSON.stringify({ processed: pendingDapps.length }), {
    headers: { 'Content-Type': 'application/json' }
  });
});` }
                                       ]
                                      },
                                      { 
                                        name: "fhe-snapshot", 
                                        type: "folder",
                                       children: [
                                         { name: "index.ts", type: "file", code: `import { createDatabaseClient } from '../_shared/database.ts';
import { ethers } from 'https://esm.sh/ethers@6.15.0';

const ACL_ADDRESS = '0x687820221192C5B662b25367F70076A37bc79b6c';
const KMS_ADDRESS = '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC';
const COPROCESSOR_ADDRESS = '0x848B0066793BcC60346Da1F49049357399B8D595';

Deno.serve(async (req) => {
  const { dappId } = await req.json();
  const db = createDatabaseClient();
  
  try {
    const provider = new ethers.JsonRpcProvider(
      'https://rpc.sepolia.org',
      { chainId: 11155111, name: 'sepolia' }
    );
    const wallet = new ethers.Wallet(
      Deno.env.get('DEPLOYER_PRIVATE_KEY')!,
      provider
    );
    
    const voteManager = new ethers.Contract(
      '0x032094C13B091097418A2324673c6A083ae643A0',
      [
        'function requestDecryption(uint256 dappId) external returns (uint256 requestId)',
        'function dapps(uint256) view returns (tuple(uint256 encSum, uint256 encCount, uint32 decSum, uint32 decCount, uint32 average, uint256 lastDecryptRequestId, uint256 lastDecryptTime, bool initialized))'
      ],
      wallet
    );
    
    await db.from('fhe_logs').insert({
      dapp_id: dappId,
      level: 'info',
      message: 'Initiating FHE snapshot decryption',
      details: {
        aclAddress: ACL_ADDRESS,
        kmsAddress: KMS_ADDRESS,
        coprocessorAddress: COPROCESSOR_ADDRESS
      }
    });
    
    const dappData = await voteManager.dapps(dappId);
    const tx = await voteManager.requestDecryption(dappId);
    const receipt = await tx.wait();
    
    const requestEvent = receipt.logs.find(
      (log: any) => log.topics[0] === ethers.id('DecryptionRequested(uint256,uint256,uint256)')
    );
    
    const requestId = requestEvent 
      ? ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], requestEvent.data)[0]
      : 'unknown';
    
    await db.from('dapp_scores').update({
      pending_since: new Date().toISOString(),
      pending_attempts: 1,
      last_snapshot_req_at: new Date().toISOString()
    }).eq('dapp_id', dappId);
    
    await db.from('fhe_logs').insert({
      dapp_id: dappId,
      level: 'info',
      message: 'Decryption request sent with signature proof',
      details: {
        txHash: tx.hash,
        requestId: requestId.toString(),
        status: 'pending'
      }
    });
    
    return new Response(JSON.stringify({
      success: true,
      txHash: tx.hash,
      requestId: requestId.toString(),
      message: 'FHE decryption initiated with signature proof'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    await db.from('fhe_logs').insert({
      dapp_id: dappId,
      level: 'error',
      message: 'FHE snapshot failed',
      details: { error: error.message, stack: error.stack }
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});` }
                                       ]
                                      },
                                      { 
                                        name: "fhe-diagnostics", 
                                        type: "folder",
                                       children: [
                                         { name: "index.ts", type: "file", code: `import { createDatabaseClient } from '../_shared/database.ts';
import { ethers } from 'https://esm.sh/ethers@6.15.0';

const VOTE_MANAGER_ADDRESS = '0x032094C13B091097418A2324673c6A083ae643A0';
const ACL_ADDRESS = '0x687820221192C5B662b25367F70076A37bc79b6c';

Deno.serve(async (req) => {
  const { dappId } = await req.json();
  const db = createDatabaseClient();
  
  const { data: logs } = await db
    .from('fhe_logs')
    .select('*')
    .eq('dapp_id', dappId)
    .order('created_at', { ascending: false })
    .limit(100);
  
  const errors = logs?.filter(l => l.level === 'error') || [];
  const warnings = logs?.filter(l => l.level === 'warn') || [];
  
  const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
  const voteManager = new ethers.Contract(
    VOTE_MANAGER_ADDRESS,
    [
      'function dapps(uint256) view returns (tuple(uint256 encSum, uint256 encCount, uint32 decSum, uint32 decCount, uint32 average, uint256 lastDecryptRequestId, uint256 lastDecryptTime, bool initialized))'
    ],
    provider
  );
  
  let contractState = null;
  try {
    const dappData = await voteManager.dapps(dappId);
    contractState = {
      encryptedSum: dappData.encSum.toString(),
      encryptedCount: dappData.encCount.toString(),
      decryptedSum: dappData.decSum,
      decryptedCount: dappData.decCount,
      currentAverage: dappData.average,
      lastDecryptTime: dappData.lastDecryptTime.toString(),
      initialized: dappData.initialized
    };
  } catch (e) {
    console.error('Contract state fetch error:', e);
  }
  
  return new Response(
    JSON.stringify({
      status: errors.length > 0 ? 'unhealthy' : 'healthy',
      totalLogs: logs?.length || 0,
      errors: errors.length,
      warnings: warnings.length,
      recentLogs: logs?.slice(0, 10),
      contractState,
      infrastructure: {
        aclContract: ACL_ADDRESS,
        voteManager: VOTE_MANAGER_ADDRESS,
        network: 'sepolia'
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});` }
                                       ]
                                     },
                                     { 
                                       name: "discord-oauth-exchange", 
                                       type: "folder",
                                      children: [
                                         { name: "index.ts", type: "file", code: `import { createDatabaseClient } from '../_shared/database.ts';

Deno.serve(async (req) => {
  const { code, walletAddress } = await req.json();
  
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('DISCORD_CLIENT_ID')!,
      client_secret: Deno.env.get('DISCORD_CLIENT_SECRET')!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: Deno.env.get('DISCORD_REDIRECT_URI')!
    })
  });
  
  const tokens = await tokenResponse.json();
  
  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: \`Bearer \${tokens.access_token}\` }
  });
  const user = await userResponse.json();
  
  const db = createDatabaseClient();
  
  await db.from('profiles').update({
    discord_user_id: user.id,
    discord_username: user.username,
    discord_connected: true,
    discord_access_token: tokens.access_token
  }).eq('wallet_address', walletAddress);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});` }
                                      ]
                                     },
                                     { 
                                       name: "twitter-oauth-exchange", 
                                       type: "folder",
                                      children: [
                                         { name: "index.ts", type: "file", code: `import { createDatabaseClient } from '../_shared/database.ts';

Deno.serve(async (req) => {
  const { code, codeVerifier, walletAddress } = await req.json();
  
  const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('TWITTER_CLIENT_ID')!,
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: Deno.env.get('TWITTER_REDIRECT_URI')!
    })
  });
  
  const tokens = await tokenResponse.json();
  
  const userResponse = await fetch('https://api.twitter.com/2/users/me', {
    headers: { Authorization: \`Bearer \${tokens.access_token}\` }
  });
  const { data: user } = await userResponse.json();
  
  const db = createDatabaseClient();
  
  await db.from('profiles').update({
    twitter_user_id: user.id,
    twitter_username: user.username,
    twitter_connected: true,
    twitter_access_token: tokens.access_token
  }).eq('wallet_address', walletAddress);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});` }
                                      ]
                                     },
                                     { 
                                       name: "_shared", 
                                       type: "folder",
                                      children: [
                                        { name: "database.ts", type: "file", code: `/**
 * Shared database client utility for backend functions
 * Abstracts database connection for all serverless functions
 */\nexport function createDatabaseClient() {\n  // Database client implementation\n  // Uses environment variables for connection\n  const url = Deno.env.get('DATABASE_URL')!;\n  const key = Deno.env.get('SERVICE_ROLE_KEY')!;\n  \n  return {\n    from: (table: string) => ({\n      select: (columns: string) => ({\n        eq: (column: string, value: any) => ({\n          single: async () => ({ data: null, error: null }),\n          limit: (n: number) => ({\n            then: async (resolve: any) => resolve({ data: [], error: null })\n          }),\n          order: (column: string, opts: any) => ({\n            then: async (resolve: any) => resolve({ data: [], error: null })\n          }),\n          then: async (resolve: any) => resolve({ data: [], error: null })\n        }),\n        gt: (column: string, value: any) => ({\n          lt: (column: string, value: any) => ({\n            then: async (resolve: any) => resolve({ data: [], error: null })\n          })\n        }),\n        then: async (resolve: any) => resolve({ data: [], error: null })\n      }),\n      insert: (data: any) => ({\n        then: async (resolve: any) => resolve({ data, error: null })\n      }),\n      update: (data: any) => ({\n        eq: (column: string, value: any) => ({\n          then: async (resolve: any) => resolve({ data, error: null })\n        })\n      })\n    })\n  };\n}` }
                                      ]
                                    }
                                 ]
                                },
                                { 
                                  name: "migrations", 
                                  type: "folder",
                                 children: [
                                   { name: "20240101_initial_schema.sql", type: "file", code: `-- Initial database schema for Zapps platform\n\nCREATE TABLE dapps (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name TEXT NOT NULL,\n  description TEXT NOT NULL,\n  logo_url TEXT,\n  website_url TEXT,\n  category TEXT NOT NULL,\n  rating DECIMAL(2,1),\n  view_count INTEGER DEFAULT 0,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE profiles (\n  wallet_address TEXT PRIMARY KEY,\n  rvp_balance DECIMAL DEFAULT 0,\n  discord_user_id TEXT,\n  discord_username TEXT,\n  twitter_user_id TEXT,\n  twitter_username TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE dapp_votes (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  dapp_id UUID REFERENCES dapps(id),\n  user_id TEXT REFERENCES profiles(wallet_address),\n  rating INTEGER CHECK (rating >= 1 AND rating <= 5),\n  vote_amount DECIMAL NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE fhe_logs (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  dapp_id TEXT NOT NULL,\n  level TEXT NOT NULL,\n  message TEXT NOT NULL,\n  details JSONB,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- Enable Row Level Security\nALTER TABLE dapps ENABLE ROW LEVEL SECURITY;\nALTER TABLE profiles ENABLE ROW LEVEL SECURITY;\nALTER TABLE dapp_votes ENABLE ROW LEVEL SECURITY;\n\n-- RLS Policies\nCREATE POLICY "Public read dapps" ON dapps FOR SELECT USING (true);\nCREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (wallet_address = current_user);\nCREATE POLICY "Users can vote" ON dapp_votes FOR INSERT WITH CHECK (user_id = current_user);` }
                                 ]
                               }
                             ]
            },
            {
              name: "scripts",
                             type: "folder",
                             children: [
                                { name: "deploy.ts", type: "file", code: `import { ethers } from 'hardhat';

async function main() {
  console.log('Deploying contracts to Zama Sepolia...');
  
  const ZVP = await ethers.getContractFactory('ZVPSoulbound');
  const zvp = await ZVP.deploy();
  await zvp.waitForDeployment();
  console.log('ZVP deployed to:', await zvp.getAddress());
  
  const VoteManager = await ethers.getContractFactory('VoteManagerFHEScore');
  const voteManager = await VoteManager.deploy(
    await zvp.getAddress(),
    ethers.parseEther('10')
  );
  await voteManager.waitForDeployment();
  console.log('VoteManager deployed to:', await voteManager.getAddress());
  
  const RewardManager = await ethers.getContractFactory('RewardManager');
  const rewardManager = await RewardManager.deploy(
    await zvp.getAddress()
  );
  await rewardManager.waitForDeployment();
  console.log('RewardManager deployed to:', await rewardManager.getAddress());
  
  await zvp.addDistributor(await rewardManager.getAddress());
  await zvp.addBurner(await voteManager.getAddress());
  
  console.log('✅ All contracts deployed and configured!');
}

main().catch(console.error);` },
                               { name: "extract-artifacts.ts", type: "file", code: `import fs from 'fs';\nimport path from 'path';\n\nconst CONTRACTS = ['VoteManagerFHEScore', 'RewardManager', 'ZVPSoulbound'];\nconst ARTIFACTS_DIR = './artifacts/contracts';\nconst OUTPUT_DIR = './contracts/artifacts';\n\nfunction extractArtifact(contractName: string) {\n  const artifactPath = path.join(ARTIFACTS_DIR, \`\${contractName}.sol\`, \`\${contractName}.json\`);\n  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));\n  \n  const simplified = {\n    contractName: artifact.contractName,\n    abi: artifact.abi,\n    bytecode: artifact.bytecode,\n    deployedBytecode: artifact.deployedBytecode\n  };\n  \n  const outputPath = path.join(OUTPUT_DIR, \`\${contractName}.json\`);\n  fs.writeFileSync(outputPath, JSON.stringify(simplified, null, 2));\n  \n  console.log(\`✅ Extracted \${contractName}\`);\n}\n\nCONTRACTS.forEach(extractArtifact);` }
                             ]
                           },
                           { name: "hardhat.config.ts", type: "file", code: `import { HardhatUserConfig } from 'hardhat/config';\nimport '@nomicfoundation/hardhat-toolbox';\nimport '@fhenixprotocol/hardhat-plugin';\n\nconst config: HardhatUserConfig = {\n  solidity: {\n    version: '0.8.24',\n    settings: {\n      optimizer: {\n        enabled: true,\n        runs: 200\n      }\n    }\n  },\n  networks: {\n    sepolia: {\n      url: 'https://rpc.sepolia.org',\n      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],\n      chainId: 11155111\n    }\n  },\n  paths: {\n    sources: './contracts',\n    tests: './test',\n    cache: './cache',\n    artifacts: './artifacts'\n  }\n};\n\nexport default config;` },
                           { name: "vite.config.ts", type: "file", code: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport path from 'path';\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: {\n    alias: {\n      '@': path.resolve(__dirname, './src')\n    }\n  },\n  optimizeDeps: {\n    exclude: ['fhevmjs']\n  },\n  server: {\n    headers: {\n      'Cross-Origin-Opener-Policy': 'same-origin',\n      'Cross-Origin-Embedder-Policy': 'require-corp'\n    }\n  }\n});` },
                           { name: "tailwind.config.ts", type: "file", code: `import type { Config } from 'tailwindcss';\n\nconst config: Config = {\n  darkMode: ['class'],\n  content: ['./src/**/*.{ts,tsx}'],\n  theme: {\n    extend: {\n      colors: {\n        background: 'hsl(var(--background))',\n        foreground: 'hsl(var(--foreground))',\n        primary: {\n          DEFAULT: 'hsl(var(--primary))',\n          foreground: 'hsl(var(--primary-foreground))',\n          glow: 'hsl(var(--primary-glow))'\n        },\n        accent: 'hsl(var(--accent))',\n        border: 'hsl(var(--border))',\n        muted: {\n          DEFAULT: 'hsl(var(--muted))',\n          foreground: 'hsl(var(--muted-foreground))'\n        }\n      },\n      animation: {\n        'fade-in': 'fadeIn 0.5s ease-in-out',\n        'slide-up': 'slideUp 0.5s ease-out'\n      },\n      keyframes: {\n        fadeIn: {\n          '0%': { opacity: '0' },\n          '100%': { opacity: '1' }\n        },\n        slideUp: {\n          '0%': { transform: 'translateY(20px)', opacity: '0' },\n          '100%': { transform: 'translateY(0)', opacity: '1' }\n        }\n      }\n    }\n  },\n  plugins: [require('tailwindcss-animate')]\n};\n\nexport default config;` },
                           { name: "package.json", type: "file", code: `{\n  "name": "zapps-platform",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build",\n    "deploy:contracts": "hardhat run scripts/deploy.ts --network sepolia"\n  },\n  "dependencies": {\n    "react": "^18.3.1",\n    "ethers": "^6.15.0",\n    "fhevmjs": "^0.5.0",\n    "@tanstack/react-query": "^5.90.5",\n    "framer-motion": "^12.23.24",\n    "tailwindcss": "^3.4.0"\n  }\n}` },
                           { name: "tsconfig.json", type: "file", code: `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true,\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["./src/*"]\n    }\n  },\n  "include": ["src"],\n  "references": [{ "path": "./tsconfig.node.json" }]\n}` },
                           { name: "README.md", type: "file", code: `# Zapps Platform\n\n🔐 Privacy-first Web3 DApp discovery and voting platform powered by Zama's FHE encryption.\n\n## Features\n\n- **Fully Homomorphic Encryption (FHE)**: Vote ratings are encrypted end-to-end\n- **Privacy-Preserving**: Individual votes never exposed on-chain\n- **Reward System**: Earn tokens for participation\n- **Campaign Management**: Create and manage DApp campaigns\n- **Multi-language**: Supports EN, CN, FR, ID\n\n## Tech Stack\n\n- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion\n- **Smart Contracts**: Solidity 0.8.24, Zama fhEVM\n- **Backend**: PostgreSQL, Edge Functions\n- **Web3**: Ethers.js, WalletConnect\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Contract Deployment\n\n\`\`\`bash\nnpm run deploy:contracts\n\`\`\`\n\n## License\n\nMIT License - Open Source\n\n---\n\n**Repository Status**: Currently private during security audit. Public release coming soon!` }
                         ]}
                      />
                    </div>
                  </div>
                </div>

                {}
                <div className="rounded-lg sm:rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Technology Stack
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-primary" />
                        Frontend
                      </h3>
                      <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground pl-6">
                        <li className="list-disc"><strong>React 18</strong> - UI library</li>
                        <li className="list-disc"><strong>TypeScript</strong> - Type safety</li>
                        <li className="list-disc"><strong>Vite</strong> - Build tool</li>
                        <li className="list-disc"><strong>Tailwind CSS</strong> - Styling</li>
                        <li className="list-disc"><strong>Framer Motion</strong> - Animations</li>
                        <li className="list-disc"><strong>React Router</strong> - Navigation</li>
                        <li className="list-disc"><strong>TanStack Query</strong> - Data fetching</li>
                        <li className="list-disc"><strong>Radix UI</strong> - Accessible components</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                        <Network className="w-4 h-4 text-primary" />
                        Backend & Blockchain
                      </h3>
                      <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground pl-6">
                        <li className="list-disc"><strong>PostgreSQL</strong> - Primary database</li>
                        <li className="list-disc"><strong>Serverless Functions</strong> - Backend logic</li>
                        <li className="list-disc"><strong>Solidity ^0.8.24</strong> - Smart contracts</li>
                        <li className="list-disc"><strong>Zama fhEVM</strong> - FHE encryption layer</li>
                        <li className="list-disc"><strong>Zama KMS</strong> - Key management system</li>
                        <li className="list-disc"><strong>ACL Contract</strong> - Access control list</li>
                        <li className="list-disc"><strong>Hardhat</strong> - Contract development</li>
                        <li className="list-disc"><strong>Ethers.js v6</strong> - Web3 integration</li>
                        <li className="list-disc"><strong>WalletConnect v2</strong> - Wallet connection</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {}
                <div className="rounded-lg sm:rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                    <Github className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Contributing
                  </h2>

                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    We welcome contributions from the community! Here's how you can help:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">1</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">Fork the Repository</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Create your own copy to work on</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">2</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">Create a Feature Branch</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Branch naming: <code className="bg-background px-1 py-0.5 rounded text-xs">feature/your-feature</code></p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">3</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">Make Your Changes</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Follow existing code style and conventions</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">4</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">Submit a Pull Request</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Describe your changes and their purpose</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <strong className="text-foreground">Code of Conduct:</strong> We expect all contributors to be respectful, inclusive, and constructive in all interactions.
                    </p>
                  </div>
                </div>

                {/* Additional Resources */}
                <div className="rounded-lg sm:rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Resources</h2>
                  
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    <a 
                      href="https://docs.zama.ai/fhevm" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-background/50 border border-border/30 hover:border-primary/50 transition-colors group"
                    >
                      <Lock className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">Zama fhEVM Docs</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">FHE protocol on Ethereum</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>

                    <a 
                      href="https://react.dev" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-background/50 border border-border/30 hover:border-primary/50 transition-colors group"
                    >
                      <Code2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">React Documentation</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Official React guides</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>

                    <a 
                      href="https://hardhat.org/docs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-background/50 border border-border/30 hover:border-primary/50 transition-colors group"
                    >
                      <FileCode className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">Hardhat Docs</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Smart contract development</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>

                    <a 
                      href="https://tailwindcss.com/docs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-background/50 border border-border/30 hover:border-primary/50 transition-colors group"
                    >
                      <FileCode className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">Tailwind CSS</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Utility-first CSS framework</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Vote Manager Tab */}
            {activeTab === 'vote-manager' && (
              <div className="space-y-6">
                <InfoCard
                  title="Core Functionality"
                  description="The VoteManager contract handles encrypted voting using Zama's FHE. Individual ratings remain private while aggregate statistics are computed homomorphically."
                >
                  <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs overflow-x-auto">
                    <pre className="text-muted-foreground">
{`function rateApp(
  uint256 dappId,
  externalEuint8 encRating,
  bytes calldata proof
) external {
  euint8 rating = FHE.fromExternal(encRating, proof);
  dapp.encSum = FHE.add(dapp.encSum, rating);
  dapp.encCount = FHE.add(dapp.encCount, 1);
  FHE.allow(rating, msg.sender); // User can decrypt
}`}
                    </pre>
                  </div>
                </InfoCard>

                <div className="grid md:grid-cols-2 gap-4">
                  <FlowCard
                    step="1"
                    icon={FileCode}
                    title="Accept Encrypted Input"
                    description="User submits encrypted rating (1-5) with ZK proof from client"
                    code="FHE.fromExternal(encRating, proof)"
                  />
                  <FlowCard
                    step="2"
                    icon={CheckCircle2}
                    title="Range Enforcement"
                    description="Clamp rating to [1,5] without decryption using FHE operators"
                    code="FHE.select(FHE.lt(rating, min), min, rating)"
                  />
                  <FlowCard
                    step="3"
                    icon={Binary}
                    title="Homomorphic Aggregation"
                    description="Add to encrypted sum and count without revealing values"
                    code="encSum = FHE.add(encSum, rating)"
                  />
                  <FlowCard
                    step="4"
                    icon={GitBranch}
                    title="Oracle Decryption"
                    description="Zama KMS decrypts only aggregate statistics via callback"
                    code="callbackAverageRating(sum, count)"
                  />
                </div>

                <ContractCard
                  name="VoteManagerFHEScore"
                  address={CONTRACT_ADDRESSES.voteManager}
                  description="Core voting mechanism with FHE encryption and controlled decryption"
                  icon={Lock}
                  color="from-purple-500/10 to-blue-500/10"
                  contractKey="voteManager"
                />
              </div>
            )}

            {/* Reward Manager Tab */}
            {activeTab === 'reward-manager' && (
              <div className="space-y-6">
                <InfoCard
                  title="Reward Distribution System"
                  description="Manages campaigns and distributes ZVP tokens to voters based on participation. While rewards are public, voting behavior remains private."
                >
                  <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs overflow-x-auto">
                    <pre className="text-muted-foreground">
{`function allocateReward(
  uint256 campaignId,
  address user,
  uint256 amount
) external onlyOwner {
  campaign.rewardsDistributed += amount;
  userRewards[campaignId][user].totalEarned += amount;
}

function claimReward(uint256 campaignId) external {
  uint256 pending = reward.totalEarned - reward.totalClaimed;
  reward.totalClaimed += pending;
  zvp.transfer(msg.sender, pending);
}`}
                    </pre>
                  </div>
                </InfoCard>

                <div className="grid md:grid-cols-3 gap-4">
                  <FeatureCard
                    icon={Database}
                    title="Campaign Management"
                    description="Create time-bound campaigns with reward pools"
                    highlight="Budget tracking"
                  />
                  <FeatureCard
                    icon={Zap}
                    title="Reward Allocation"
                    description="Owner allocates rewards based on voting activity"
                    highlight="Off-chain calculation"
                  />
                  <FeatureCard
                    icon={CheckCircle2}
                    title="User Claims"
                    description="Users claim accumulated ZVP rewards"
                    highlight="Self-service"
                  />
                </div>

                <ContractCard
                  name="RewardManagerFHEScore"
                  address={CONTRACT_ADDRESSES.rewardManager}
                  description="Campaign and reward distribution for voter incentives"
                  icon={Zap}
                  color="from-orange-500/10 to-yellow-500/10"
                  contractKey="rewardManager"
                />
              </div>
            )}

            {/* ZVP Token Tab */}
            {activeTab === 'zvp-token' && (
              <div className="space-y-6">
                <InfoCard
                  title="Encrypted Token Standard"
                  description="ZVP is a fully encrypted ERC20 token where balances and allowances are stored as encrypted values, enabling private transfers."
                >
                  <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs overflow-x-auto">
                    <pre className="text-muted-foreground">
{`// Encrypted storage
euint64 private _totalSupply;
mapping(address => euint64) private balances;

function transfer(address to, uint256 amount) public {
  euint64 amountEnc = TFHE.asEuint64(amount);
  
  // Homomorphic balance check
  ebool hasEnough = TFHE.ge(balances[msg.sender], amountEnc);
  require(TFHE.decrypt(hasEnough), "insufficient");
  
  // Encrypted arithmetic
  balances[msg.sender] = TFHE.sub(balances[msg.sender], amountEnc);
  balances[to] = TFHE.add(balances[to], amountEnc);
}`}
                    </pre>
                  </div>
                </InfoCard>

                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Binary className="w-4 h-4 text-primary" />
                    Privacy Comparison
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="border-b border-border">
                        <tr className="text-left">
                          <th className="py-2 px-3 font-semibold">Feature</th>
                          <th className="py-2 px-3 font-semibold text-muted-foreground">Standard ERC20</th>
                          <th className="py-2 px-3 font-semibold text-primary">ZVP_FHE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">Balance Visibility</td>
                          <td className="py-2 px-3">Public to all</td>
                          <td className="py-2 px-3 text-primary font-medium">Encrypted (owner only)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">Transfer Amounts</td>
                          <td className="py-2 px-3">Public in events</td>
                          <td className="py-2 px-3 text-primary font-medium">Private</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">Allowances</td>
                          <td className="py-2 px-3">Public</td>
                          <td className="py-2 px-3 text-primary font-medium">Encrypted</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">Total Supply</td>
                          <td className="py-2 px-3">Public</td>
                          <td className="py-2 px-3 text-primary font-medium">Configurable</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <ContractCard
                  name="ZVP_FHE"
                  address={CONTRACT_ADDRESSES.zvpToken}
                  description="Encrypted ERC20 token with private balances and homomorphic arithmetic"
                  icon={Cpu}
                  color="from-green-500/10 to-emerald-500/10"
                  contractKey="zvpToken"
                />
              </div>
            )}

            {/* Integration Tab */}
            {activeTab === 'integration' && (
              <div className="space-y-6">

                <div className="grid md:grid-cols-2 gap-4">
                  <CodeBlock
                    title="Encrypt Rating"
                    code={`const rating = 5;
const encrypted = instance.encrypt8(rating);

await voteManager.rateApp(
  dappId,
  encrypted.handles[0],
  encrypted.proof
);`}
                  />
                  <CodeBlock
                    title="Read Statistics"
                    code={`const stats = await voteManager
  .getDappRating(dappId);

console.log(\`Average: \${stats.average / 100}\`);
console.log(\`Votes: \${stats.count}\`);`}
                  />
                </div>

                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
                  <h3 className="font-semibold mb-4">Complete Flow Diagram</h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">1</div>
                      <span>User selects rating → Client encrypts with FHE</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">2</div>
                      <span>Approve ZVP spending → VoteManager burns tokens</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">3</div>
                      <span>Submit encrypted vote → Homomorphic aggregation</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">4</div>
                      <span>Auto-trigger decryption → Zama KMS processes</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">5</div>
                      <span>Oracle callback → Update public aggregate stats</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Code Modal */}
      <AnimatePresence>
        {codeModal.open && codeModal.contract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={closeCodeModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] bg-card rounded-lg sm:rounded-xl border border-border/50 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50 bg-muted/30 flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-primary/10 flex-shrink-0">
                    <FileCode className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm truncate">
                      {codeModal.contract === 'voteManager' ? 'VoteManager Contract' :
                       codeModal.contract === 'rewardManager' ? 'RewardManager Contract' :
                       'ZVP Token Contract'}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Solidity Source Code</p>
                  </div>
                </div>
                <button
                  onClick={closeCodeModal}
                  className="p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-3 sm:p-4 bg-muted/10">
                <pre className="text-[10px] sm:text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {CONTRACT_CODES[codeModal.contract]}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-4 border-t border-border/50 bg-muted/30 flex-shrink-0">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground overflow-hidden">
                  <code className="px-2 py-1 rounded bg-background/50 border border-border/50 truncate">
                    {CONTRACT_ADDRESSES[codeModal.contract]}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(CONTRACT_CODES[codeModal.contract], 'Code')}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES[codeModal.contract]}#code`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors whitespace-nowrap"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Full Code
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Modal */}
      <CodeModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        fileName={selectedFile.name}
        code={selectedFile.code}
      />
    </div>
  );
}

// Helper Components
const FeatureItem = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-md sm:rounded-lg bg-muted/30 border border-border/50">
    <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-primary/10 flex-shrink-0">
      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
    </div>
    <div className="min-w-0">
      <h4 className="text-xs font-semibold mb-0.5 truncate">{title}</h4>
      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

const InfoCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <div className="rounded-lg sm:rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-3 sm:p-4 md:p-6">
    <h2 className="text-sm sm:text-base md:text-lg font-bold mb-1.5 sm:mb-2">{title}</h2>
    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{description}</p>
    {children}
  </div>
);

const FlowCard = ({ step, icon: Icon, title, description, code }: { step: string; icon: any; title: string; description: string; code: string }) => (
  <div className="p-3 sm:p-4 rounded-md sm:rounded-lg border border-border/50 bg-gradient-to-br from-card to-card/50 space-y-2 sm:space-y-3">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] sm:text-xs font-bold text-primary">
          {step}
        </div>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
      </div>
    </div>
    <div>
      <h4 className="text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">{title}</h4>
      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
    <div className="p-2 rounded bg-muted/50 border border-border/50 font-mono text-[9px] sm:text-[10px] text-muted-foreground overflow-x-auto">
      {code}
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, highlight }: { icon: any; title: string; description: string; highlight: string }) => (
  <div className="p-3 sm:p-4 rounded-md sm:rounded-lg border border-border/50 bg-gradient-to-br from-card to-card/50 space-y-2 sm:space-y-3">
    <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-primary/10 w-fit">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
    </div>
    <div>
      <h4 className="text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">{title}</h4>
      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
    <div className="px-2 py-1 rounded bg-primary/5 border border-primary/20 text-[10px] sm:text-xs text-primary font-medium w-fit">
      {highlight}
    </div>
  </div>
);

const CodeBlock = ({ title, code }: { title: string; code: string }) => (
  <div className="rounded-md sm:rounded-lg border border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden">
    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/50 border-b border-border/50 text-[10px] sm:text-xs font-semibold">
      {title}
    </div>
    <div className="p-3 sm:p-4 font-mono text-[9px] sm:text-xs overflow-x-auto">
      <pre className="text-muted-foreground">{code}</pre>
    </div>
  </div>
);

const StepCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="p-3 sm:p-4 rounded-md sm:rounded-lg border border-border/50 bg-gradient-to-br from-card to-card/50">
    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center text-base sm:text-lg font-bold text-primary mb-2 sm:mb-3">
      {number}
    </div>
    <h4 className="text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">{title}</h4>
    <p className="text-[10px] sm:text-xs text-muted-foreground">{description}</p>
  </div>
);