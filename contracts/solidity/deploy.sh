#!/bin/bash

# Focus AFK Contract Deployment Script
# Usage: ./deploy.sh [network]

set -e

# Default network
NETWORK=${1:-"anvil"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Focus AFK Contract Deployment${NC}"
echo -e "${YELLOW}Network: $NETWORK${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file with your PRIVATE_KEY:${NC}"
    echo "PRIVATE_KEY=your_private_key_here"
    exit 1
fi

# Load environment variables
source .env

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ PRIVATE_KEY not found in .env file!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment loaded${NC}"

# Build contracts
echo -e "${BLUE}🔨 Building contracts...${NC}"
forge build --silent

# Deploy contracts
echo -e "${BLUE}📦 Deploying contracts to $NETWORK...${NC}"

case $NETWORK in
    "anvil")
        # Start local anvil if not running
        if ! pgrep -x "anvil" > /dev/null; then
            echo -e "${YELLOW}Starting Anvil local network...${NC}"
            anvil &
            sleep 2
        fi
        forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast --verify
        ;;
    "sepolia")
        forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
        ;;
    "goerli")
        forge script script/Deploy.s.sol:DeployScript --rpc-url $GOERLI_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
        ;;
    "mainnet")
        echo -e "${RED}⚠️  Are you sure you want to deploy to mainnet? (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            forge script script/Deploy.s.sol:DeployScript --rpc-url $MAINNET_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
        else
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
        ;;
    *)
        echo -e "${RED}❌ Unknown network: $NETWORK${NC}"
        echo -e "${YELLOW}Available networks: anvil, sepolia, goerli, mainnet${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${BLUE}📄 Deployment info saved to deployment.env${NC}"

# Display deployment info
if [ -f deployment.env ]; then
    echo -e "${BLUE}📋 Deployment Summary:${NC}"
    cat deployment.env
fi 