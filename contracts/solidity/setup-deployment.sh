#!/bin/bash

# Focus AFK Contract Deployment Setup
# This script helps deploy contracts and update environment variables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Focus AFK Contract Deployment Setup${NC}"

# Check if we're in the right directory
if [ ! -f "foundry.toml" ]; then
    echo -e "${RED}❌ Please run this script from the contracts/solidity directory${NC}"
    exit 1
fi

# Check if .env exists, create if not
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    echo "# Focus AFK Contract Deployment Environment" > .env
    echo "# Add your private key below (without 0x prefix)" >> .env
    echo "PRIVATE_KEY=your_private_key_here" >> .env
    echo "" >> .env
    echo "# Optional: RPC URLs for different networks" >> .env
    echo "BASE_SEPOLIA_RPC_URL=https://sepolia.base.org" >> .env
    echo "BASE_RPC_URL=https://mainnet.base.org" >> .env
    echo "SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id" >> .env
    echo "GOERLI_RPC_URL=https://goerli.infura.io/v3/your_project_id" >> .env
    echo "MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_project_id" >> .env
    echo "" >> .env
    echo "# Optional: API Keys for contract verification" >> .env
    echo "BASESCAN_API_KEY=your_basescan_api_key" >> .env
    echo "ETHERSCAN_API_KEY=your_etherscan_api_key" >> .env
    
    echo -e "${GREEN}✅ .env file created!${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your private key before continuing${NC}"
    exit 0
fi

# Check if PRIVATE_KEY is set
source .env
if [ "$PRIVATE_KEY" = "your_private_key_here" ] || [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Please set your PRIVATE_KEY in .env file${NC}"
    echo -e "${YELLOW}Example: PRIVATE_KEY=1234567890abcdef...${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"

# Build contracts
echo -e "${BLUE}🔨 Building contracts...${NC}"
forge build --silent
echo -e "${GREEN}✅ Contracts built successfully${NC}"

# Ask user which network to deploy to
echo -e "${BLUE}🌐 Choose deployment network:${NC}"
echo "1) Local Anvil (for testing)"
echo "2) Base Sepolia (testnet)"
echo "3) Sepolia (testnet)"
echo "4) Base Mainnet (mainnet)"
echo "5) Ethereum Mainnet (mainnet)"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        NETWORK="anvil"
        echo -e "${YELLOW}Deploying to local Anvil network...${NC}"
        ;;
    2)
        NETWORK="base-sepolia"
        echo -e "${YELLOW}Deploying to Base Sepolia testnet...${NC}"
        ;;
    3)
        NETWORK="sepolia"
        echo -e "${YELLOW}Deploying to Sepolia testnet...${NC}"
        ;;
    4)
        NETWORK="base"
        echo -e "${RED}⚠️  Deploying to Base mainnet - are you sure? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
        ;;
    5)
        NETWORK="mainnet"
        echo -e "${RED}⚠️  Deploying to Ethereum mainnet - are you sure? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Deploy contracts
echo -e "${BLUE}📦 Deploying contracts to $NETWORK...${NC}"
./deploy.sh $NETWORK

# Check if deployment was successful
if [ -f "deployment.env" ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${BLUE}📋 Deployment Summary:${NC}"
    cat deployment.env
    
    # Ask if user wants to update backend environment
    echo -e "${BLUE}🔧 Update backend environment variables? (y/N)${NC}"
    read -r update_backend
    if [[ "$update_backend" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        # Read deployment addresses
        source deployment.env
        
        # Create backend .env if it doesn't exist
        BACKEND_ENV="../../apps/backend/.env"
        if [ ! -f "$BACKEND_ENV" ]; then
            echo -e "${YELLOW}Creating backend .env file...${NC}"
            echo "# Focus AFK Backend Environment" > "$BACKEND_ENV"
            echo "" >> "$BACKEND_ENV"
        fi
        
        # Update or add contract addresses
        echo -e "${BLUE}Updating backend environment variables...${NC}"
        
        # Function to update env variable
        update_env_var() {
            local key=$1
            local value=$2
            local file=$3
            
            if grep -q "^$key=" "$file"; then
                # Update existing variable
                sed -i "s/^$key=.*/$key=$value/" "$file"
            else
                # Add new variable
                echo "$key=$value" >> "$file"
            fi
        }
        
        update_env_var "FOCUS_TOKEN_ADDRESS" "$FOCUS_TOKEN_ADDRESS" "$BACKEND_ENV"
        update_env_var "QUEST_NFT_ADDRESS" "$QUEST_NFT_ADDRESS" "$BACKEND_ENV"
        update_env_var "FOCUS_SBT_ADDRESS" "$FOCUS_SBT_ADDRESS" "$BACKEND_ENV"
        update_env_var "FOCUS_STAKING_ADDRESS" "$FOCUS_STAKING_ADDRESS" "$BACKEND_ENV"
        
        # Add blockchain configuration if not present
        if ! grep -q "^BLOCKCHAIN_RPC_URL=" "$BACKEND_ENV"; then
            case $NETWORK in
                "anvil")
                    echo "BLOCKCHAIN_RPC_URL=http://localhost:8545" >> "$BACKEND_ENV"
                    ;;
                "base-sepolia")
                    echo "BLOCKCHAIN_RPC_URL=https://sepolia.base.org" >> "$BACKEND_ENV"
                    ;;
                "base")
                    echo "BLOCKCHAIN_RPC_URL=https://mainnet.base.org" >> "$BACKEND_ENV"
                    ;;
                "sepolia")
                    echo "BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/your_project_id" >> "$BACKEND_ENV"
                    ;;
                "mainnet")
                    echo "BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/your_project_id" >> "$BACKEND_ENV"
                    ;;
            esac
        fi
        
        if ! grep -q "^BLOCKCHAIN_PRIVATE_KEY=" "$BACKEND_ENV"; then
            echo "BLOCKCHAIN_PRIVATE_KEY=$PRIVATE_KEY" >> "$BACKEND_ENV"
        fi
        
        echo -e "${GREEN}✅ Backend environment updated!${NC}"
        echo -e "${YELLOW}⚠️  Please restart your backend server to load new environment variables${NC}"
    fi
    
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Setup completed!${NC}" 