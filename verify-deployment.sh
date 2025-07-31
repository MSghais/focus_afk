#!/bin/bash

# Verify Contract Deployment Script
# This script checks if contracts are properly deployed and accessible

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying Contract Deployment${NC}"

# Contract addresses from Base Sepolia deployment
FOCUS_TOKEN_ADDRESS="0x25530664bd96b858dcf9A6DA4c4C7fBC29e6eAbA"
QUEST_NFT_ADDRESS="0xE0aDDc371B1b3b02972e29777E6d386BAd9db71F"
FOCUS_SBT_ADDRESS="0x2789dD1f5cA3C1AC2F5517d9da7b88A3F4854f17"
FOCUS_STAKING_ADDRESS="0xa21a662E1316beb02e85089DC18A34eea42eF767"

# RPC URL
RPC_URL="https://sepolia.base.org"

echo -e "${YELLOW}📋 Checking contracts on Base Sepolia...${NC}"
echo "RPC URL: $RPC_URL"
echo ""

# Function to check contract
check_contract() {
    local name=$1
    local address=$2
    
    echo -e "${BLUE}Checking $name at $address...${NC}"
    
    # Use curl to check if contract exists
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$address\",\"latest\"],\"id\":1}" \
        "$RPC_URL")
    
    # Extract result from response
    code=$(echo "$response" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$code" = "0x" ] || [ -z "$code" ]; then
        echo -e "${RED}❌ $name contract not found or not deployed${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $name contract found and deployed${NC}"
        return 0
    fi
}

# Check each contract
echo -e "${BLUE}🔍 Contract Verification Results:${NC}"
echo ""

check_contract "FocusToken" "$FOCUS_TOKEN_ADDRESS"
focus_token_status=$?

check_contract "QuestNFT" "$QUEST_NFT_ADDRESS"
quest_nft_status=$?

check_contract "FocusSBT" "$FOCUS_SBT_ADDRESS"
focus_sbt_status=$?

check_contract "FocusStaking" "$FOCUS_STAKING_ADDRESS"
focus_staking_status=$?

echo ""
echo -e "${BLUE}📊 Summary:${NC}"

if [ $focus_token_status -eq 0 ] && [ $quest_nft_status -eq 0 ] && [ $focus_sbt_status -eq 0 ] && [ $focus_staking_status -eq 0 ]; then
    echo -e "${GREEN}🎉 All contracts are deployed and accessible!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Contract Addresses:${NC}"
    echo "FOCUS_TOKEN_ADDRESS=$FOCUS_TOKEN_ADDRESS"
    echo "QUEST_NFT_ADDRESS=$QUEST_NFT_ADDRESS"
    echo "FOCUS_SBT_ADDRESS=$FOCUS_SBT_ADDRESS"
    echo "FOCUS_STAKING_ADDRESS=$FOCUS_STAKING_ADDRESS"
    echo ""
    echo -e "${BLUE}🔗 View on Base Sepolia Explorer:${NC}"
    echo "FocusToken: https://sepolia.basescan.org/address/$FOCUS_TOKEN_ADDRESS"
    echo "QuestNFT: https://sepolia.basescan.org/address/$QUEST_NFT_ADDRESS"
    echo "FocusSBT: https://sepolia.basescan.org/address/$FOCUS_SBT_ADDRESS"
    echo "FocusStaking: https://sepolia.basescan.org/address/$FOCUS_STAKING_ADDRESS"
else
    echo -e "${RED}❌ Some contracts are missing or not accessible${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Next steps:${NC}"
    echo "1. Run: cd contracts/solidity && ./deploy.sh base-sepolia"
    echo "2. Make sure you have sufficient ETH on Base Sepolia for gas fees"
    echo "3. Check your .env file has the correct PRIVATE_KEY"
fi 