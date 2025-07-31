#!/bin/bash

# Update Backend Configuration Script
# This script helps update the backend environment variables with Base Sepolia contract addresses

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Updating Backend Configuration for Base Sepolia${NC}"

# Contract addresses from Base Sepolia deployment
FOCUS_TOKEN_ADDRESS="0x25530664bd96b858dcf9A6DA4c4C7fBC29e6eAbA"
QUEST_NFT_ADDRESS="0xE0aDDc371B1b3b02972e29777E6d386BAd9db71F"
FOCUS_SBT_ADDRESS="0x2789dD1f5cA3C1AC2F5517d9da7b88A3F4854f17"
FOCUS_STAKING_ADDRESS="0xa21a662E1316beb02e85089DC18A34eea42eF767"

# Backend environment file path
BACKEND_ENV="apps/backend/.env"

echo -e "${YELLOW}📋 Contract Addresses (Base Sepolia):${NC}"
echo "FocusToken: $FOCUS_TOKEN_ADDRESS"
echo "QuestNFT: $QUEST_NFT_ADDRESS"
echo "FocusSBT: $FOCUS_SBT_ADDRESS"
echo "FocusStaking: $FOCUS_STAKING_ADDRESS"
echo ""

# Check if backend .env exists
if [ ! -f "$BACKEND_ENV" ]; then
    echo -e "${YELLOW}📝 Creating backend .env file...${NC}"
    echo "# Focus AFK Backend Environment" > "$BACKEND_ENV"
    echo "" >> "$BACKEND_ENV"
fi

# Function to update or add environment variable
update_env_var() {
    local key=$1
    local value=$2
    local file=$3
    
            if grep -q "^$key=" "$file"; then
            # Update existing variable
            sed -i "s|^$key=.*|$key=$value|" "$file"
            echo -e "${GREEN}✅ Updated $key=$value${NC}"
        else
            # Add new variable
            echo "$key=$value" >> "$file"
            echo -e "${GREEN}✅ Added $key=$value${NC}"
        fi
}

# Update blockchain configuration
echo -e "${BLUE}🔗 Updating blockchain configuration...${NC}"
update_env_var "BLOCKCHAIN_RPC_URL" "https://sepolia.base.org" "$BACKEND_ENV"

# Update contract addresses
echo -e "${BLUE}📦 Updating contract addresses...${NC}"
update_env_var "FOCUS_TOKEN_ADDRESS" "$FOCUS_TOKEN_ADDRESS" "$BACKEND_ENV"
update_env_var "QUEST_NFT_ADDRESS" "$QUEST_NFT_ADDRESS" "$BACKEND_ENV"
update_env_var "FOCUS_SBT_ADDRESS" "$FOCUS_SBT_ADDRESS" "$BACKEND_ENV"
update_env_var "FOCUS_STAKING_ADDRESS" "$FOCUS_STAKING_ADDRESS" "$BACKEND_ENV"

# Add other required environment variables if they don't exist
echo -e "${BLUE}⚙️  Adding other required environment variables...${NC}"

# Check if PRIVATE_KEY exists, if not add placeholder
if ! grep -q "^BLOCKCHAIN_PRIVATE_KEY=" "$BACKEND_ENV"; then
    echo "BLOCKCHAIN_PRIVATE_KEY=your_private_key_here" >> "$BACKEND_ENV"
    echo -e "${YELLOW}⚠️  Added BLOCKCHAIN_PRIVATE_KEY placeholder - please update with your actual private key${NC}"
fi

# Check if DATABASE_URL exists, if not add placeholder
if ! grep -q "^DATABASE_URL=" "$BACKEND_ENV"; then
    echo "DATABASE_URL=\"postgresql://username:password@localhost:5432/focus_afk\"" >> "$BACKEND_ENV"
    echo -e "${YELLOW}⚠️  Added DATABASE_URL placeholder - please update with your database connection${NC}"
fi

# Check if JWT_SECRET exists, if not add placeholder
if ! grep -q "^JWT_SECRET=" "$BACKEND_ENV"; then
    echo "JWT_SECRET=your_jwt_secret_here" >> "$BACKEND_ENV"
    echo -e "${YELLOW}⚠️  Added JWT_SECRET placeholder - please update with a secure secret${NC}"
fi

# Check if PORT exists, if not add default
if ! grep -q "^PORT=" "$BACKEND_ENV"; then
    echo "PORT=3001" >> "$BACKEND_ENV"
    echo -e "${GREEN}✅ Added PORT=3001${NC}"
fi

# Check if NODE_ENV exists, if not add default
if ! grep -q "^NODE_ENV=" "$BACKEND_ENV"; then
    echo "NODE_ENV=development" >> "$BACKEND_ENV"
    echo -e "${GREEN}✅ Added NODE_ENV=development${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Backend configuration updated successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update BLOCKCHAIN_PRIVATE_KEY in $BACKEND_ENV with your actual private key"
echo "2. Update DATABASE_URL with your database connection string"
echo "3. Update JWT_SECRET with a secure secret"
echo "4. Restart your backend server to load the new environment variables"
echo ""
echo -e "${BLUE}🔍 You can verify the contracts on Base Sepolia:${NC}"
echo "FocusToken: https://sepolia.basescan.org/address/$FOCUS_TOKEN_ADDRESS"
echo "QuestNFT: https://sepolia.basescan.org/address/$QUEST_NFT_ADDRESS"
echo "FocusSBT: https://sepolia.basescan.org/address/$FOCUS_SBT_ADDRESS"
echo "FocusStaking: https://sepolia.basescan.org/address/$FOCUS_STAKING_ADDRESS" 