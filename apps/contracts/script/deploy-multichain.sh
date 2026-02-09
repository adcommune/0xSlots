#!/usr/bin/env bash
set -euo pipefail

# 0xSlots Multi-Chain Deployment
# Usage:
#   ./script/deploy-multichain.sh              # deploy to all 3 chains
#   ./script/deploy-multichain.sh arbitrum     # deploy to one chain
#   ./script/deploy-multichain.sh base
#   ./script/deploy-multichain.sh optimism

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

# Validate env
: "${PK:?Set PK (deployer private key)}"
: "${ALCHEMY_KEY:?Set ALCHEMY_KEY}"

# Chain enum indices (must match Base.s.sol DeployementChain)
declare -A CHAIN_IDX=(
  [base]=4
  [arbitrum]=5
  [optimism]=6
)

declare -A CHAIN_VERIFY_URL=(
  [base]="https://api.basescan.org/api"
  [arbitrum]="https://api.arbiscan.io/api"
  [optimism]="https://api-optimistic.etherscan.io/api"
)

declare -A CHAIN_VERIFY_KEY=(
  [base]="${API_KEY_BASESCAN:-}"
  [arbitrum]="${API_KEY_ARBISCAN:-}"
  [optimism]="${API_KEY_OPSCAN:-}"
)

deploy_chain() {
  local chain=$1
  local idx=${CHAIN_IDX[$chain]}
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Deploying to $chain (index $idx)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  local verify_flags=""
  local key="${CHAIN_VERIFY_KEY[$chain]}"
  if [[ -n "$key" ]]; then
    verify_flags="--verify --verifier-url ${CHAIN_VERIFY_URL[$chain]} --etherscan-api-key $key"
  fi

  forge script script/Deploy0xSlots.s.sol:Deploy0xSlots \
    --sig "deployChain(uint8)" "$idx" \
    --broadcast \
    --slow \
    $verify_flags

  echo "✅ $chain done"
}

TARGET="${1:-all}"

if [[ "$TARGET" == "all" ]]; then
  for chain in arbitrum base optimism; do
    deploy_chain "$chain"
  done
  echo ""
  echo "🎉 All chains deployed. Check apps/contracts/deployments/ for addresses."
else
  if [[ -z "${CHAIN_IDX[$TARGET]+x}" ]]; then
    echo "Unknown chain: $TARGET"
    echo "Valid: arbitrum, base, optimism"
    exit 1
  fi
  deploy_chain "$TARGET"
fi
