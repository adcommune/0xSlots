#!/bin/bash
set -e

# Deploy all network subgraphs with the same version label
# Usage: ./deploy-all.sh <version>
# Example: ./deploy-all.sh v3.14.0

VERSION=${1:?"Usage: ./deploy-all.sh <version> (e.g. v3.14.0)"}

NETWORKS=("base-sepolia" "base")

echo "🔺 Deploying 0xSlots subgraph $VERSION to all networks..."
echo ""

for NETWORK in "${NETWORKS[@]}"; do
  STUDIO_NAME=$(node -p "require('./config/${NETWORK}.json').studioName")
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📡 $NETWORK → $STUDIO_NAME ($VERSION)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Generate subgraph.yaml from template
  pnpm exec mustache "config/${NETWORK}.json" subgraph.template.yaml > subgraph.yaml
  echo "✓ Generated subgraph.yaml"

  # Codegen + build
  pnpm exec graph codegen
  pnpm exec graph build
  echo "✓ Built"

  # Deploy
  pnpm exec graph deploy "$STUDIO_NAME" --version-label "$VERSION"
  echo "✅ $NETWORK deployed!"
  echo ""
done

echo "🎉 All networks deployed at $VERSION"
