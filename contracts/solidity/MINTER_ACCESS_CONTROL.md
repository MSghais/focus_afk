# Focus AFK Minter Access Control

This document explains how to manage minter access control for the FocusToken contract, allowing multiple addresses to mint tokens while maintaining security.

## Overview

The FocusToken contract now includes `AccessControl` from OpenZeppelin, which provides a flexible role-based access control system. This allows you to:

- Grant minting permissions to multiple addresses (like your backend)
- Revoke minting permissions when needed
- Maintain security by only allowing authorized addresses to mint tokens

## Roles

### MINTER_ROLE
- **Purpose**: Allows an address to mint new tokens
- **Functions**: Can call `mint()` and `mintFocusReward()`
- **Granted by**: Only addresses with `DEFAULT_ADMIN_ROLE`

### DEFAULT_ADMIN_ROLE
- **Purpose**: Can grant and revoke `MINTER_ROLE`
- **Functions**: Can call `grantMinter()` and `revokeMinter()`
- **Initially granted to**: Contract deployer

## Setup

### 1. Environment Configuration

Create a `.env` file with the following variables:

```bash
# Required: Your wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Required: Your deployed FocusToken address
FOCUS_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890

# Required for Base Network deployments
BASESCAN_API_KEY=your_basescan_api_key_here

# Required for Ethereum Network deployments
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: RPC URLs
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
GOERLI_RPC_URL=https://goerli.infura.io/v3/your_project_id
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_project_id
```

### 2. Backend Setup

For your backend to mint tokens, you'll need:

1. **A dedicated wallet** for your backend
2. **The private key** of that wallet
3. **Minter role** granted to the backend's address

#### Backend Wallet Setup

```bash
# Generate a new private key for your backend
# You can use any Ethereum wallet generator or:
openssl rand -hex 32

# Example output: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

#### Backend Environment Variables

Add to your backend's environment:

```bash
# Backend wallet private key
BACKEND_PRIVATE_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# FocusToken contract address
FOCUS_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890

# Network RPC URL
RPC_URL=https://sepolia.base.org
```

## Usage

### Grant Minter Role

To grant minting permissions to your backend or any other address:

```bash
# Local development
./grant-minter.sh anvil 0x1234567890123456789012345678901234567890

# Base Sepolia testnet
./grant-minter.sh base-sepolia 0x1234567890123456789012345678901234567890

# Base mainnet
./grant-minter.sh base 0x1234567890123456789012345678901234567890

# Ethereum testnets
./grant-minter.sh sepolia 0x1234567890123456789012345678901234567890
./grant-minter.sh goerli 0x1234567890123456789012345678901234567890
```

### Revoke Minter Role

To revoke minting permissions from an address:

```bash
# Local development
./revoke-minter.sh anvil 0x1234567890123456789012345678901234567890

# Base Sepolia testnet
./revoke-minter.sh base-sepolia 0x1234567890123456789012345678901234567890

# Base mainnet
./revoke-minter.sh base 0x1234567890123456789012345678901234567890
```

### Check Minter Status

You can check if an address has minter role by calling the contract:

```solidity
// Check if an address is a minter
bool isMinter = focusToken.isMinter(address);

// Get the MINTER_ROLE bytes32 value
bytes32 MINTER_ROLE = keccak256("MINTER_ROLE");
bool hasRole = focusToken.hasRole(MINTER_ROLE, address);
```

## Backend Integration

### Example: Minting Tokens from Backend

Here's how your backend can mint tokens using ethers.js:

```javascript
const { ethers } = require('ethers');

// FocusToken ABI (minimal for minting)
const FOCUS_TOKEN_ABI = [
  "function mint(address to, uint256 amount, string memory reason) external",
  "function mintFocusReward(address user, uint256 sessionMinutes, uint256 streak) external"
];

async function mintTokens(userAddress, amount, reason) {
  // Connect to network
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  // Create wallet from private key
  const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);
  
  // Connect to FocusToken contract
  const focusToken = new ethers.Contract(
    process.env.FOCUS_TOKEN_ADDRESS,
    FOCUS_TOKEN_ABI,
    wallet
  );
  
  try {
    // Mint tokens
    const tx = await focusToken.mint(userAddress, amount, reason);
    await tx.wait();
    
    console.log(`Minted ${amount} tokens to ${userAddress}`);
    return tx.hash;
  } catch (error) {
    console.error('Minting failed:', error);
    throw error;
  }
}

async function mintFocusReward(userAddress, sessionMinutes, streak) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);
  const focusToken = new ethers.Contract(
    process.env.FOCUS_TOKEN_ADDRESS,
    FOCUS_TOKEN_ABI,
    wallet
  );
  
  try {
    const tx = await focusToken.mintFocusReward(userAddress, sessionMinutes, streak);
    await tx.wait();
    
    console.log(`Rewarded ${userAddress} for ${sessionMinutes}min session with ${streak} day streak`);
    return tx.hash;
  } catch (error) {
    console.error('Reward minting failed:', error);
    throw error;
  }
}

// Usage examples
mintTokens("0x1234567890123456789012345678901234567890", ethers.parseEther("10"), "Welcome bonus");
mintFocusReward("0x1234567890123456789012345678901234567890", 25, 3);
```

### Example: Minting Tokens from Backend (Web3.py)

```python
from web3 import Web3
from eth_account import Account
import os

# Connect to network
w3 = Web3(Web3.HTTPProvider(os.getenv('RPC_URL')))

# Create account from private key
account = Account.from_key(os.getenv('BACKEND_PRIVATE_KEY'))
w3.eth.default_account = account.address

# FocusToken contract ABI (minimal for minting)
FOCUS_TOKEN_ABI = [
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "reason", "type": "string"}
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "user", "type": "address"},
            {"name": "sessionMinutes", "type": "uint256"},
            {"name": "streak", "type": "uint256"}
        ],
        "name": "mintFocusReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

def mint_tokens(user_address, amount, reason):
    """Mint tokens to a user"""
    focus_token = w3.eth.contract(
        address=os.getenv('FOCUS_TOKEN_ADDRESS'),
        abi=FOCUS_TOKEN_ABI
    )
    
    # Build transaction
    tx = focus_token.functions.mint(
        user_address,
        amount,
        reason
    ).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 200000,
        'gasPrice': w3.eth.gas_price
    })
    
    # Sign and send transaction
    signed_tx = w3.eth.account.sign_transaction(tx, os.getenv('BACKEND_PRIVATE_KEY'))
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    # Wait for confirmation
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Minted {amount} tokens to {user_address}")
    return receipt['transactionHash'].hex()

def mint_focus_reward(user_address, session_minutes, streak):
    """Mint focus session reward tokens"""
    focus_token = w3.eth.contract(
        address=os.getenv('FOCUS_TOKEN_ADDRESS'),
        abi=FOCUS_TOKEN_ABI
    )
    
    tx = focus_token.functions.mintFocusReward(
        user_address,
        session_minutes,
        streak
    ).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 200000,
        'gasPrice': w3.eth.gas_price
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, os.getenv('BACKEND_PRIVATE_KEY'))
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    print(f"Rewarded {user_address} for {session_minutes}min session with {streak} day streak")
    return receipt['transactionHash'].hex()

# Usage examples
mint_tokens("0x1234567890123456789012345678901234567890", Web3.to_wei(10, 'ether'), "Welcome bonus")
mint_focus_reward("0x1234567890123456789012345678901234567890", 25, 3)
```

## Security Considerations

### 1. Private Key Security
- **Never commit private keys to version control**
- **Use environment variables** for all sensitive data
- **Consider using hardware wallets** for production deployments
- **Rotate private keys** regularly

### 2. Access Control
- **Grant minter role only to trusted addresses**
- **Monitor minting activity** regularly
- **Have a plan to revoke access** if needed
- **Use different wallets** for different purposes

### 3. Gas Management
- **Monitor gas costs** for minting operations
- **Set appropriate gas limits** in your backend
- **Handle failed transactions** gracefully

### 4. Rate Limiting
- **Implement rate limiting** in your backend
- **Prevent abuse** of minting functions
- **Monitor for unusual activity**

## Troubleshooting

### Common Issues

1. **"Deployer does not have admin role"**
   - Ensure you're using the correct private key (the one that deployed the contract)
   - Check that the contract was deployed with AccessControl

2. **"Address already has minter role"**
   - The address already has minting permissions
   - No action needed

3. **"Address does not have minter role"**
   - The address doesn't have minting permissions
   - Grant minter role first

4. **Transaction fails with "AccessControl: account is missing role"**
   - The backend address doesn't have MINTER_ROLE
   - Grant minter role using the grant-minter script

### Gas Issues

If transactions fail due to gas:

```bash
# Check current gas price
cast gas-price --rpc-url $RPC_URL

# Estimate gas for minting
cast estimate --rpc-url $RPC_URL $FOCUS_TOKEN_ADDRESS "mint(address,uint256,string)" $USER_ADDRESS $AMOUNT $REASON
```

## Testing

### Local Testing

```bash
# Start local network
anvil

# Deploy contracts
./deploy.sh anvil

# Grant minter role to test address
./grant-minter.sh anvil 0x1234567890123456789012345678901234567890

# Test minting (using cast)
cast send --rpc-url http://localhost:8545 --private-key $BACKEND_PRIVATE_KEY $FOCUS_TOKEN_ADDRESS "mint(address,uint256,string)" $USER_ADDRESS $AMOUNT $REASON
```

### Testnet Testing

```bash
# Deploy to testnet
./deploy.sh base-sepolia

# Grant minter role
./grant-minter.sh base-sepolia $BACKEND_ADDRESS

# Test minting
cast send --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $BACKEND_PRIVATE_KEY $FOCUS_TOKEN_ADDRESS "mint(address,uint256,string)" $USER_ADDRESS $AMOUNT $REASON
```

## Contract Functions Reference

### Admin Functions (DEFAULT_ADMIN_ROLE required)

```solidity
// Grant minter role to an address
function grantMinter(address minter) external

// Revoke minter role from an address
function revokeMinter(address minter) external
```

### Minter Functions (MINTER_ROLE required)

```solidity
// Mint tokens to an address
function mint(address to, uint256 amount, string memory reason) external

// Mint focus session reward tokens
function mintFocusReward(address user, uint256 sessionMinutes, uint256 streak) external
```

### View Functions

```solidity
// Check if an address has minter role
function isMinter(address account) external view returns (bool)

// Get the MINTER_ROLE bytes32 value
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE")
```

## Events

```solidity
// Emitted when minter role is granted
event MinterGranted(address indexed minter);

// Emitted when minter role is revoked
event MinterRevoked(address indexed minter);

// Emitted when tokens are minted
event TokensMinted(address indexed to, uint256 amount, string reason);
``` 