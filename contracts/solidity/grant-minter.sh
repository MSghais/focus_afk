#!/bin/bash

# Focus AFK Grant Minter Role Script
# Usage: ./grant-minter.sh [network] [new_minter_address]

set -e

# Default network
NETWORK=${1:-"anvil"}
NEW_MINTER_ADDRESS=${2}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔑 Focus AFK Grant Minter Role${NC}"
echo -e "${YELLOW}Network: $NETWORK${NC}"

# Check if new minter address is provided
if [ -z "$NEW_MINTER_ADDRESS" ]; then
    echo -e "${RED}❌ Please provide the new minter address!${NC}"
    echo -e "${YELLOW}Usage: ./grant-minter.sh [network] [new_minter_address]${NC}"
    echo -e "${YELLOW}Example: ./grant-minter.sh base-sepolia 0x1234567890123456789012345678901234567890${NC}"
    exit 1
fi

# Validate address format
if [[ ! $NEW_MINTER_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}❌ Invalid address format!${NC}"
    echo -e "${YELLOW}Address must be a valid Ethereum address (0x followed by 40 hex characters)${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file with your configuration:${NC}"
    echo "PRIVATE_KEY=your_private_key_here"
    echo "FOCUS_TOKEN_ADDRESS=your_deployed_token_address"
    echo "BASESCAN_API_KEY=your_basescan_api_key_here"
    echo "ETHERSCAN_API_KEY=your_etherscan_api_key_here"
    exit 1
fi

# Load environment variables
source .env

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ PRIVATE_KEY not found in .env file!${NC}"
    exit 1
fi

# Check if FOCUS_TOKEN_ADDRESS is set
if [ -z "$FOCUS_TOKEN_ADDRESS" ]; then
    echo -e "${RED}❌ FOCUS_TOKEN_ADDRESS not found in .env file!${NC}"
    echo -e "${YELLOW}Please add your deployed FocusToken address to .env${NC}"
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
echo -e "${BLUE}🎯 Granting minter role to: $NEW_MINTER_ADDRESS${NC}"

# Build contracts
echo -e "${BLUE}🔨 Building contracts...${NC}"
forge build --silent

# Grant minter role
echo -e "${BLUE}🔑 Granting minter role...${NC}"

case $NETWORK in
    "anvil")
        # Start local anvil if not running
        if ! pgrep -x "anvil" > /dev/null; then
            echo -e "${YELLOW}Starting Anvil local network...${NC}"
            anvil &
            sleep 2
        fi
        NEW_MINTER_ADDRESS=$NEW_MINTER_ADDRESS forge script script/GrantMinter.s.sol:GrantMinterScript --rpc-url http://localhost:8545 --broadcast
        ;;
    "base-sepolia")
        NEW_MINTER_ADDRESS=$NEW_MINTER_ADDRESS forge script script/GrantMinter.s.sol:GrantMinterScript --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY
        ;;
    "base")
        echo -e "${RED}⚠️  Are you sure you want to grant minter role on Base mainnet? (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            NEW_MINTER_ADDRESS=$NEW_MINTER_ADDRESS forge script script/GrantMinter.s.sol:GrantMinterScript --rpc-url $BASE_RPC_URL --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY
        else
            echo -e "${YELLOW}Operation cancelled${NC}"
            exit 0
        fi
        ;;
    "sepolia")
        NEW_MINTER_ADDRESS=$NEW_MINTER_ADDRESS forge script script/GrantMinter.s.sol:GrantMinterScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
        ;;
    "goerli")
        NEW_MINTER_ADDRESS=$NEW_MINTER_ADDRESS forge script script/GrantMinter.s.sol:GrantMinterScript --rpc-url $GOERLI_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
        ;;
    "mainnet")
        echo -e "${RED}⚠️  Are you sure you want to grant minter role on mainnet? (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            NEW_MINTER_ADDRESS=$NEW_MINTER_ADDRESS forge script script/GrantMinter.s.sol:GrantMinterScript --rpc-url $MAINNET_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
        else
            echo -e "${YELLOW}Operation cancelled${NC}"
            exit 0
        fi
        ;;
    *)
        echo -e "${RED}❌ Unknown network: $NETWORK${NC}"
        echo -e "${YELLOW}Available networks: anvil, base-sepolia, base, sepolia, goerli, mainnet${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Minter role granted successfully!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  Network: $NETWORK"
echo -e "  FocusToken: $FOCUS_TOKEN_ADDRESS"
echo -e "  New Minter: $NEW_MINTER_ADDRESS"
echo -e ""
echo -e "${YELLOW}💡 The new minter can now:${NC}"
echo -e "  - Call mint() to mint tokens to any address"
echo -e "  - Call mintFocusReward() to reward users for focus sessions" 