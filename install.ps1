# addx installer for Windows
# Run with: iex (iwr -useb https://raw.githubusercontent.com/mulhamna/addx/main/install.ps1)

$ErrorActionPreference = 'Stop'

# Output colors
function Write-Amber { param([string]$msg); Write-Host $msg -ForegroundColor Yellow }
function Write-Green { param([string]$msg); Write-Host $msg -ForegroundColor Green }
function Write-Red   { param([string]$msg); Write-Host $msg -ForegroundColor Red }
function Write-Dim   { param([string]$msg); Write-Host $msg -ForegroundColor Gray }

# Print banner
Write-Amber "    ▲ addx"
Write-Amber "   installer"
Write-Dim "universal AI tools manager`n"

# Verify Node.js is installed
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Red "Error: Node.js is not installed."
    Write-Host "addx requires Node.js v18.0.0 or higher."
    Write-Host "Please install Node.js from https://nodejs.org/ and try again."
    exit 1
}

# Verify Node.js version >= 18
$nodeVersionStr = node -v
$nodeVersion = $nodeVersionStr -replace 'v', ''
$nodeMajor = [int]($nodeVersion.Split('.')[0])

if ($nodeMajor -lt 18) {
    Write-Red "Error: Node.js v$nodeVersion is too old."
    Write-Host "addx requires Node.js v18.0.0 or higher."
    exit 1
}

# Set up installation directories
$addxDir = Join-Path $HOME ".addx"
$distDir = Join-Path $addxDir "dist"
$binDir = Join-Path $addxDir "bin"

Write-Host "Installing addx to $addxDir..."
New-Item -ItemType Directory -Force -Path $distDir | Out-Null
New-Item -ItemType Directory -Force -Path $binDir | Out-Null

# Source repository config
if (-not $env:ADDX_VERSION) {
    $env:ADDX_VERSION = "main"
}
$repoUrl = "https://raw.githubusercontent.com/mulhamna/addx/$env:ADDX_VERSION"
$distUrl = "$repoUrl/dist/addx.js"
$registryUrl = "$repoUrl/registry.json"

# Download files
Write-Host "Downloading executable..."
Invoke-WebRequest -UseBasicParsing -Uri $distUrl -OutFile (Join-Path $distDir "addx.js")

Write-Host "Downloading registry..."
Invoke-WebRequest -UseBasicParsing -Uri $registryUrl -OutFile (Join-Path $addxDir "registry.json")

# Create wrapper scripts for CMD and PowerShell
Write-Host "Creating wrapper scripts..."
$cmdContent = "@echo off`r`nnode `"%USERPROFILE%\.addx\dist\addx.js`" %*"
$cmdContent | Out-File -FilePath (Join-Path $binDir "addx.cmd") -Encoding ascii

$psContent = "node `"`$HOME\.addx\dist\addx.js`" `$args"
$psContent | Out-File -FilePath (Join-Path $binDir "addx.ps1") -Encoding utf8

# Add to user PATH if not present
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$binDir*") {
    Write-Host "Adding $binDir to User PATH..."
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$binDir", "User")
    $env:Path += ";$binDir"
}

Write-Green "`n✓ addx successfully installed!"
Write-Host "`nYou can now run 'addx' from your terminal."
Write-Host "Note: You may need to restart your terminal session for PATH changes to take effect."
