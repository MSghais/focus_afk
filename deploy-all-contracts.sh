#!/bin/bash

# Deploy All Contracts Script
# This script deploys all Focus AFK contracts to Base Sepolia

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying All Focus AFK Contracts to Base Sepolia${NC}"

# Check if we're in the right directory
if [ ! -f "contracts/solidity/foundry.toml" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if .env exists in contracts directory
if [ ! -f "contracts/solidity/.env" ]; then
    echo -e "${RED}❌ .env file not found in contracts/solidity/!${NC}"
    echo -e "${YELLOW}Please create contracts/solidity/.env with your PRIVATE_KEY${NC}"
    exit 1
fi

# Load environment variables
source contracts/solidity/.env

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ PRIVATE_KEY not found in contracts/solidity/.env!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment loaded${NC}"

# Build contracts
echo -e "${BLUE}🔨 Building contracts...${NC}"
cd contracts/solidity
forge build --silent
echo -e "${GREEN}✅ Contracts built successfully${NC}"

# Deploy all contracts
echo -e "${BLUE}📦 Deploying all contracts to Base Sepolia...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"

# Use the simplified deployment script
forge script script/DeploySimple.s.sol:DeploySimpleScript \
    --rpc-url https://sepolia.base.org \
    --broadcast \
    --verify \
    --etherscan-api-key $BASESCAN_API_KEY

echo -e "${GREEN}✅ Deployment completed!${NC}"

# Go back to project root
cd ../..

echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Copy the contract addresses from the deployment output above"
echo "2. Update your backend .env file with the new addresses"
echo "3. Run: ./update-backend-config.sh (if you have the script)"
echo "4. Restart your backend server"
echo ""
echo -e "${BLUE}🔍 You can verify the contracts on Base Sepolia Explorer:${NC}"
echo "https://sepolia.basescan.org/" 