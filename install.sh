#!/bin/sh
# addx installer for macOS & Linux
set -e

# Color definitions
AMBER='\033[38;5;214m'
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[32m'
RED='\033[31m'
RESET='\033[0m'

# Print banner
echo -e "${AMBER}${BOLD}"
echo "    ▲ addx"
echo "   installer"
echo -e "${RESET}"
echo -e "${DIM}universal AI tools manager${RESET}\n"

# Verify Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}Error: Node.js is not installed.${RESET}"
    echo "addx requires Node.js v18.0.0 or higher."
    echo "Please install Node.js from https://nodejs.org/ and try again."
    exit 1
fi

# Verify Node.js version >= 18
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}Error: Node.js v$NODE_VERSION is too old.${RESET}"
    echo "addx requires Node.js v18.0.0 or higher."
    exit 1
fi

# Set up installation directories
ADDX_DIR="$HOME/.addx"
DIST_DIR="$ADDX_DIR/dist"
BIN_DIR="$ADDX_DIR/bin"

echo -e "Installing addx to ${BOLD}$ADDX_DIR${RESET}..."
mkdir -p "$DIST_DIR"
mkdir -p "$BIN_DIR"

# Download helper
download_file() {
    local url="$1"
    local dest="$2"
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$url" -o "$dest"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$dest" "$url"
    else
        echo -e "${RED}Error: curl or wget is required to download files.${RESET}"
        exit 1
    fi
}

# Source repository config
ADDX_VERSION=${ADDX_VERSION:-"main"}
REPO_URL="https://raw.githubusercontent.com/mulhamna/addx/${ADDX_VERSION}"
DIST_URL="${REPO_URL}/dist/addx.js"
REGISTRY_URL="${REPO_URL}/registry.json"

echo "Downloading executable..."
download_file "$DIST_URL" "$DIST_DIR/addx.js"

echo "Downloading registry..."
download_file "$REGISTRY_URL" "$ADDX_DIR/registry.json"

# Create wrapper script
echo "Creating wrapper script..."
cat << 'EOF' > "$BIN_DIR/addx"
#!/bin/sh
exec node "$HOME/.addx/dist/addx.js" "$@"
EOF
chmod +x "$BIN_DIR/addx"

echo -e "\n${GREEN}✓ addx successfully installed!${RESET}"

# Check PATH and print instructions
case ":$PATH:" in
    *:"$BIN_DIR":*)
        echo -e "\nYou can now run ${BOLD}addx${RESET} from your terminal."
        ;;
    *)
        echo -e "\n${BOLD}To complete installation, add addx to your PATH:${RESET}"
        echo "Add this to your shell configuration file (e.g. ~/.zshrc or ~/.bashrc):"
        echo -e "\n    ${AMBER}export PATH=\"\$HOME/.addx/bin:\$PATH\"${RESET}\n"
        echo "Then reload your shell or run 'source ~/.zshrc' (or equivalent)."
        ;;
esac
