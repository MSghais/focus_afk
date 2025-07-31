# Focus AFK Contract Deployment Guide

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
# Required: Your wallet private key
PRIVATE_KEY=your_private_key_here

# RPC URLs (choose your provider)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
GOERLI_RPC_URL=https://goerli.infura.io/v3/your_project_id
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_project_id

# Base Network RPC URLs
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org

# API Keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
BASESCAN_API_KEY=your_basescan_api_key_here
```

### 2. Make the deployment script executable

```bash
chmod +x deploy.sh
```

### 3. Deploy to Local Network (Anvil)

```bash
./deploy.sh anvil
```

### 4. Deploy to Base Sepolia Testnet

```bash
./deploy.sh base-sepolia
```

### 5. Deploy to Base Mainnet

```bash
./deploy.sh base
```

### 6. Deploy to Ethereum Testnet (Sepolia)

```bash
./deploy.sh sepolia
```

### 7. Deploy to Ethereum Mainnet

```bash
./deploy.sh mainnet
```

## 📋 Manual Deployment

If you prefer to deploy manually:

### Build Contracts
```bash
forge build
```

### Deploy to Local Network
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast
```

### Deploy to Base Sepolia
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url https://sepolia.base.org --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY
```

### Deploy to Base Mainnet
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url https://mainnet.base.org --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY
```

### Deploy to Ethereum Testnet
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
```

## 🔧 Configuration

### Contract Addresses
After deployment, contract addresses will be saved to `deployment.env`:

```bash
FOCUS_TOKEN_ADDRESS=0x...
FOCUS_STAKING_ADDRESS=0x...
QUEST_NFT_ADDRESS=0x...
FOCUS_SBT_ADDRESS=0x...
```

### Base URIs
The contracts are deployed with these default base URIs:
- **QuestNFT**: `https://api.focusafk.com/quests/`
- **FocusSBT**: `https://api.focusafk.com/sbt/`

You can update these after deployment using the `setBaseURI` function.

## 🌐 Network Information

### Base Network
- **Chain ID**: 8453 (mainnet), 84532 (sepolia)
- **Block Explorer**: [Basescan](https://basescan.org/)
- **RPC URLs**: 
  - Mainnet: `https://mainnet.base.org`
  - Sepolia: `https://sepolia.base.org`
- **Gas Token**: ETH (bridged from Ethereum)
- **Advantages**: Lower gas fees, faster transactions, Ethereum security

### Ethereum Network
- **Chain ID**: 1 (mainnet), 11155111 (sepolia)
- **Block Explorer**: [Etherscan](https://etherscan.io/)
- **RPC URLs**: Various providers (Infura, Alchemy, etc.)

## 🧪 Testing Before Deployment

Run the test suite to ensure everything works:

```bash
forge test
```

## 📊 Gas Estimation

Estimated deployment costs:

### Base Network (much cheaper!)
- **FocusToken**: ~200k gas (~$0.50)
- **FocusStaking**: ~300k gas (~$0.75)  
- **QuestNFT**: ~250k gas (~$0.60)
- **FocusSBT**: ~280k gas (~$0.70)
- **Total**: ~1.03M gas (~$2.55)

### Ethereum Mainnet (expensive!)
- **FocusToken**: ~500k gas (~$50)
- **FocusStaking**: ~800k gas (~$80)  
- **QuestNFT**: ~600k gas (~$60)
- **FocusSBT**: ~700k gas (~$70)
- **Total**: ~2.6M gas (~$260)

*Note: Gas costs are approximate and vary based on network conditions*

## 🔒 Security Notes

1. **Never commit your `.env` file** - it contains your private key
2. **Use a dedicated deployment wallet** - don't use your main wallet
3. **Test on testnets first** - always verify on Base Sepolia/Sepolia before mainnet
4. **Verify contracts** - use the `--verify` flag for transparency
5. **Base advantages** - Consider Base for lower costs and faster transactions

## 🆘 Troubleshooting

### Common Issues

1. **"PRIVATE_KEY not found"**
   - Make sure your `.env` file exists and contains `PRIVATE_KEY=your_key`

2. **"Insufficient funds"**
   - Ensure your deployment wallet has enough ETH for gas fees
   - For Base, you need ETH bridged from Ethereum mainnet

3. **"RPC URL not found"**
   - Add the required RPC URLs to your `.env` file

4. **"Basescan API key not found"**
   - Get an API key from [Basescan](https://basescan.org/apis) and add it to `.env`

5. **"Base network issues"**
   - Base uses optimistic rollups, so transactions may take a few minutes to finalize
   - Check [Base Status](https://status.base.org/) for network issues

### Getting Help

- Check the [Foundry Book](https://book.getfoundry.sh/) for detailed documentation
- Review the test files for usage examples
- Ensure all dependencies are installed: `forge install`
- Base documentation: [docs.base.org](https://docs.base.org/)

## 📝 Post-Deployment

After successful deployment:

1. **Save the addresses** from `deployment.env`
2. **Update your frontend** with the new contract addresses
3. **Verify contracts** on Basescan/Etherscan (if not done automatically)
4. **Test the contracts** on the deployed network
5. **Update base URIs** if needed for your metadata endpoints
6. **Bridge ETH** to Base if deploying on Base mainnet 