# Zapps

Web3 DApp discovery platform with FHE-powered confidential voting on Zama fhEVM.

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env` file:

```env
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
VITE_NETWORK_TYPE=sepolia
VITE_RPC_HTTPS=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

VITE_FHEVM_USE_RELAYER=true
VITE_FHEVM_RELAYER_URL=https://relayer.testnet.zama.org
VITE_FHEVM_ACL=0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D
VITE_FHEVM_KMS=0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A
VITE_FHEVM_INPUT_VERIFIER=0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0
VITE_FHEVM_DECRYPTION_VERIFIER=0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478
VITE_FHEVM_INPUT_VERIFICATION=0x483b9dE06E4E4C7D35CCf5837A1668487406D955

VITE_RELAYER_PRIVATE_KEY=your_relayer_wallet_private_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## Smart Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| ZappsVoting | `0x753845153876736B50741EDFA584fF97fBECbd50` |
| ZappsRegistry | `0x18C61e42D58960b2e043Ee3ba41931e294145f04` |
| ZappsAccessController | `0x69D2bCCAA9675Ab6Bde0305BE2Ab4fBC5473F175` |
| ZappsToken | `0x3CC72623493F3DED3007193f8dABdC37319fcD34` |
| ZappsReputation | `0xf420d433cbc66AAE7d2F606D1DFE9D14CE1F241b` |
| ZappsSocial | `0x139f1ED9cE6d887cc5668F30c60a253583e19412` |
| ZappsRewards | `0x02016fcCb33D5935707072fCd88AbC61fE4C94af` |
| ZappsDiscussion | `0x9809E7642CBe888fa05847c3c84c7f9F18fF9EeE` |
| ZappsGovernance | `0xb42494660AD8Dbac57A11aE3141d11f09F98972a` |
| ZappsAuction | `0xd8Ba1cC72d720327340CdB0BEE582D6b58E0B958` |

## FHE Integration

Zapps uses Zama fhEVM with Relayer SDK for confidential voting. Votes are encrypted client-side and computed homomorphically on-chain.

### How It Works

1. User encrypts vote using fhevmjs (`inputEncrypt`)
2. Encrypted vote submitted to ZappsVoting contract
3. Contract performs homomorphic operations on encrypted data
4. When needed, contract calls `FHE.makePubliclyDecryptable(handle)`
5. Relayer HTTP API `/v1/public-decrypt` returns decrypted values with KMS signatures
6. Contract verifies signatures and stores final results

### Key Files

| File | Description |
|------|-------------|
| [src/lib/fheRelayer.ts](src/lib/fheRelayer.ts) | FHE relayer configuration |
| [src/hooks/useFHERelayer.ts](src/hooks/useFHERelayer.ts) | React hook for FHE operations |
| [src/lib/contracts/zappsContracts.ts](src/lib/contracts/zappsContracts.ts) | Contract interactions |
| [src/components/VoteModal.tsx](src/components/VoteModal.tsx) | Voting UI component |

### Relayer SDK Initialization

```typescript
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk';

const instance = await createInstance(SepoliaConfig);
```

See [Zama docs](https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/initialization) for custom configuration.

## Project Structure

```
src/
├── components/        React components
├── pages/             Route pages
├── hooks/             Custom React hooks
├── lib/
│   ├── contracts/     Smart contract ABIs and interactions
│   └── wallet/        Wallet adapter implementations
├── services/          Data services
├── contexts/          React contexts
└── i18n/              Internationalization

public/
└── data/              Static JSON data (dapps, campaigns, etc.)
```

## Deployment

```bash
npm run build
```

Output in `dist/` folder.
