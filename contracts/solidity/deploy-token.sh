#!/bin/bash

# Focus AFK Token Deployment Script
# Usage: ./deploy-token.sh [network]

set -e

# Default network
NETWORK=${1:-"anvil"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🪙 Focus AFK Token Deployment${NC}"
echo -e "${YELLOW}Network: $NETWORK${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file with your configuration:${NC}"
    echo "PRIVATE_KEY=your_private_key_here"
    echo "BASESCAN_API_KEY=your_basescan_api_key_here"
    echo "ETHERSCAN_API_KEY=your_etherscan_api_key_here"
    echo ""
    echo "Optional RPC URLs:"
    echo "BASE_SEPOLIA_RPC_URL=https://sepolia.base.org"
    echo "BASE_RPC_URL=https://mainnet.base.org"
    echo "SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id"
    echo "GOERLI_RPC_URL=https://goerli.infura.io/v3/your_project_id"
    echo "MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_project_id"
    exit 1
fi

# Load environment variables
source .env

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ PRIVATE_KEY not found in .env file!${NC}"
    exit 1
fi

# Check for required API keys based on network
case $NETWORK in
    "base-sepolia"|"base")
        if [ -z "$BASESCAN_API_KEY" ]; then
            echo -e "${RED}❌ BASESCAN_API_KEY not found in .env file!${NC}"
            echo -e "${YELLOW}Get your API key from: https://basescan.org/apis${NC}"
            exit 1
        fi
        ;;
    "sepolia"|"goerli"|"mainnet")
        if [ -z "$ETHERSCAN_API_KEY" ]; then
            echo -e "${RED}❌ ETHERSCAN_API_KEY not found in .env file!${NC}"
            echo -e "${YELLOW}Get your API key from: https://etherscan.io/apis${NC}"
            exit 1
        fi
        ;;
esac

echo -e "${GREEN}✅ Environment loaded${NC}"

# Build contracts
echo -e "${BLUE}🔨 Building contracts...${NC}"
forge build --silent

# Deploy token
echo -e "${BLUE}🪙 Deploying FocusToken...${NC}"

case $NETWORK in
    "anvil")
        # Start local anvil if not running
        if ! pgrep -x "anvil" > /dev/null; then
            echo -e "${YELLOW}Starting Anvil local network...${NC}"
            anvil &
            sleep 2
        fi
        forge script script/DeployToken.s.sol:DeployTokenScript --rpc-url http://localhost:8545 --broadcast --verify
        ;;
    "base-sepolia")
        forge script script/DeployToken.s.sol:DeployTokenScript --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY
        ;;
    "base")
        echo -e "${RED}⚠️  Are you sure you want to deploy to Base mainnet? (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            forge script script/DeployToken.s.sol:DeployTokenScript --rpc-url $BASE_RPC_URL --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY
        else
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
        ;;
    "sepolia")
        forge script script/DeployToken.s.sol:DeployTokenScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
        ;;
    "goerli")
        forge script script/DeployToken.s.sol:DeployTokenScript --rpc-url $GOERLI_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
        ;;
    "mainnet")
        echo -e "${RED}⚠️  Are you sure you want to deploy to mainnet? (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            forge script script/DeployToken.s.sol:DeployTokenScript --rpc-url $MAINNET_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
        else
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
        ;;
    *)
        echo -e "${RED}❌ Unknown network: $NETWORK${NC}"
        echo -e "${YELLOW}Available networks: anvil, base-sepolia, base, sepolia, goerli, mainnet${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Token deployment completed!${NC}"
echo -e "${BLUE}📄 Copy the FOCUS_TOKEN_ADDRESS from the output above to your .env file${NC}"
echo -e ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "  1. Add FOCUS_TOKEN_ADDRESS to your .env file"
echo -e "  2. Grant minter role to your backend: ./grant-minter.sh $NETWORK <backend_address>"
echo -e "  3. Test minting with your backend" 