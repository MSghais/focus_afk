#!/bin/bash

# Focus AFK Gamification Setup Script
# This script helps set up the gamification system with QuestNFT and token rewards

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎮 Focus AFK Gamification Setup${NC}"
echo -e "${YELLOW}This script will help you set up the QuestNFT and token rewards system${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file first${NC}"
    exit 1
fi

# Function to check if environment variable is set
check_env_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env | cut -d '=' -f2-)
    
    if [ -z "$var_value" ] || [ "$var_value" = "" ]; then
        echo -e "${RED}❌ ${var_name} not set in .env${NC}"
        return 1
    else
        echo -e "${GREEN}✅ ${var_name} is set${NC}"
        return 0
    fi
}

# Check required environment variables
echo -e "\n${BLUE}🔍 Checking environment variables...${NC}"

required_vars=(
    "BLOCKCHAIN_RPC_URL"
    "BLOCKCHAIN_PRIVATE_KEY"
    "FOCUS_TOKEN_ADDRESS"
    "QUEST_NFT_ADDRESS"
    "FOCUS_SBT_ADDRESS"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if ! check_env_var "$var"; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}⚠️  Missing environment variables:${NC}"
    for var in "${missing_vars[@]}"; do
        echo -e "  - ${var}"
    done
    
    echo -e "\n${BLUE}📝 Add these to your .env file:${NC}"
    echo "BLOCKCHAIN_RPC_URL=https://sepolia.base.org"
    echo "BLOCKCHAIN_PRIVATE_KEY=your_private_key_here"
    echo "FOCUS_TOKEN_ADDRESS=0x..."
    echo "QUEST_NFT_ADDRESS=0x..."
    echo "FOCUS_SBT_ADDRESS=0x..."
    
    echo -e "\n${YELLOW}💡 To deploy contracts and get addresses:${NC}"
    echo "1. cd ../contracts/solidity"
    echo "2. ./deploy.sh base-sepolia"
    echo "3. Copy addresses from deployment.env to backend/.env"
    
    exit 1
fi

echo -e "\n${GREEN}✅ All environment variables are set!${NC}"

# Check if contracts are deployed
echo -e "\n${BLUE}🔍 Checking contract deployment...${NC}"

# Function to check contract deployment
check_contract() {
    local address=$1
    local name=$2
    
    if [[ $address =~ ^0x[a-fA-F0-9]{40}$ ]]; then
        echo -e "${GREEN}✅ ${name} contract address is valid${NC}"
        return 0
    else
        echo -e "${RED}❌ ${name} contract address is invalid${NC}"
        return 1
    fi
}

FOCUS_TOKEN_ADDRESS=$(grep "^FOCUS_TOKEN_ADDRESS=" .env | cut -d '=' -f2-)
QUEST_NFT_ADDRESS=$(grep "^QUEST_NFT_ADDRESS=" .env | cut -d '=' -f2-)
FOCUS_SBT_ADDRESS=$(grep "^FOCUS_SBT_ADDRESS=" .env | cut -d '=' -f2-)

check_contract "$FOCUS_TOKEN_ADDRESS" "FocusToken"
check_contract "$QUEST_NFT_ADDRESS" "QuestNFT"
check_contract "$FOCUS_SBT_ADDRESS" "FocusSBT"

# Check if backend has minter role
echo -e "\n${BLUE}🔍 Checking minter permissions...${NC}"

BACKEND_ADDRESS=$(grep "^BLOCKCHAIN_PRIVATE_KEY=" .env | cut -d '=' -f2- | npx ethers --no-version-check derive-address)

echo -e "${YELLOW}Backend address: ${BACKEND_ADDRESS}${NC}"

# Test gamification service initialization
echo -e "\n${BLUE}🧪 Testing gamification service...${NC}"

# Create a simple test script
cat > test-gamification.js << 'EOF'
const { GamificationService } = require('./src/services/gamification.service');
require('dotenv').config();

async function testGamification() {
    try {
        const service = new GamificationService(
            null, // prisma will be null for this test
            process.env.BLOCKCHAIN_RPC_URL,
            process.env.BLOCKCHAIN_PRIVATE_KEY,
            process.env.FOCUS_TOKEN_ADDRESS,
            process.env.QUEST_NFT_ADDRESS,
            process.env.FOCUS_SBT_ADDRESS
        );
        
        console.log('✅ Gamification service initialized successfully');
        console.log('✅ Contract connections established');
        
    } catch (error) {
        console.error('❌ Error initializing gamification service:', error.message);
        process.exit(1);
    }
}

testGamification();
EOF

if node test-gamification.js; then
    echo -e "${GREEN}✅ Gamification service test passed!${NC}"
else
    echo -e "${RED}❌ Gamification service test failed${NC}"
    echo -e "${YELLOW}Check your environment variables and contract deployment${NC}"
    exit 1
fi

# Clean up test file
rm test-gamification.js

echo -e "\n${GREEN}🎉 Gamification system setup complete!${NC}"
echo -e "\n${BLUE}📋 Next steps:${NC}"
echo "1. Start your backend server"
echo "2. Test user creation (SBT should be minted automatically)"
echo "3. Test timer session completion"
echo "4. Test quest completion and rewards"
echo -e "\n${YELLOW}📚 For more information, see GAMIFICATION_SETUP.md${NC}" 