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

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 2. Make the deployment script executable

```bash
chmod +x deploy.sh
```

### 3. Deploy to Local Network (Anvil)

```bash
./deploy.sh anvil
```

### 4. Deploy to Testnet (Sepolia)

```bash
./deploy.sh sepolia
```

### 5. Deploy to Mainnet

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

### Deploy to Testnet
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

## 🧪 Testing Before Deployment

Run the test suite to ensure everything works:

```bash
forge test
```

## 📊 Gas Estimation

Estimated deployment costs:
- **FocusToken**: ~500k gas
- **FocusStaking**: ~800k gas  
- **QuestNFT**: ~600k gas
- **FocusSBT**: ~700k gas
- **Total**: ~2.6M gas

## 🔒 Security Notes

1. **Never commit your `.env` file** - it contains your private key
2. **Use a dedicated deployment wallet** - don't use your main wallet
3. **Test on testnets first** - always verify on Sepolia/Goerli before mainnet
4. **Verify contracts** - use the `--verify` flag for transparency

## 🆘 Troubleshooting

### Common Issues

1. **"PRIVATE_KEY not found"**
   - Make sure your `.env` file exists and contains `PRIVATE_KEY=your_key`

2. **"Insufficient funds"**
   - Ensure your deployment wallet has enough ETH for gas fees

3. **"RPC URL not found"**
   - Add the required RPC URLs to your `.env` file

4. **"Etherscan API key not found"**
   - Get an API key from [Etherscan](https://etherscan.io/apis) and add it to `.env`

### Getting Help

- Check the [Foundry Book](https://book.getfoundry.sh/) for detailed documentation
- Review the test files for usage examples
- Ensure all dependencies are installed: `forge install`

## 📝 Post-Deployment

After successful deployment:

1. **Save the addresses** from `deployment.env`
2. **Update your frontend** with the new contract addresses
3. **Verify contracts** on Etherscan (if not done automatically)
4. **Test the contracts** on the deployed network
5. **Update base URIs** if needed for your metadata endpoints 