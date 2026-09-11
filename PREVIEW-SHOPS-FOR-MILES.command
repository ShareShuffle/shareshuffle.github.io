#!/bin/bash
set -euo pipefail
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR/sites/shops-for-miles"
echo "Previewing Shops for Miles at http://localhost:8080"
python3 -m http.server 8080
