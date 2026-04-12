#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Install VS Code CLI for port forwarding (replaces missing code-tunnel.exe)
.DESCRIPTION
    Downloads and installs VS Code CLI to enable `code tunnel` command
    for port forwarding in Antigravity or standalone use.
#>

$ErrorActionPreference = "Stop"

# Configuration
$InstallDir = "$env:LOCALAPPDATA\Programs\VSCode-CLI"
$TempFile = "$env:TEMP\vscode-cli.zip"

Write-Host "=== VS Code CLI Installer ===" -ForegroundColor Cyan
Write-Host ""

# Create install directory
Write-Host "Creating install directory: $InstallDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

# Download VS Code CLI
Write-Host "Downloading VS Code CLI..." -ForegroundColor Yellow
$DownloadUrl = "https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-archive"
try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempFile -MaximumRedirection 5
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

# Extract
Write-Host "Extracting to $InstallDir..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $TempFile -DestinationPath $InstallDir -Force
    Write-Host "Extraction complete!" -ForegroundColor Green
} catch {
    Write-Host "Extraction failed: $_" -ForegroundColor Red
    exit 1
}

# Clean up
Remove-Item -Path $TempFile -Force -ErrorAction SilentlyContinue
Write-Host "Cleaned up temp files" -ForegroundColor Green

# Add to PATH
Write-Host ""
Write-Host "Adding to PATH..." -ForegroundColor Yellow
$CurrentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
$BinPath = "$InstallDir\bin"

if ($CurrentPath -notlike "*$BinPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$CurrentPath;$BinPath", [EnvironmentVariableTarget]::User)
    Write-Host "Added to PATH! (Will take effect in new terminal windows)" -ForegroundColor Green
} else {
    Write-Host "Already in PATH" -ForegroundColor Green
}

# Verify installation
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Yellow
$CodeExe = "$InstallDir\bin\code.cmd"
if (Test-Path $CodeExe) {
    Write-Host "VS Code CLI installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  code tunnel --help          # Show tunnel help"
    Write-Host "  code tunnel --port 3000     # Forward port 3000"
    Write-Host "  code tunnel --port 3000 --name myapp  # Forward with custom name"
    Write-Host ""
    Write-Host "Or restart your terminal and run: code --version"
} else {
    Write-Host "Installation verification failed!" -ForegroundColor Red
    exit 1
}

# Also check for code-tunnel.exe
$TunnelExe = Get-ChildItem -Path $InstallDir -Recurse -Filter "code-tunnel.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($TunnelExe) {
    Write-Host ""
    Write-Host "Found code-tunnel.exe at: $($TunnelExe.FullName)" -ForegroundColor Green
    Write-Host ""
    Write-Host "To fix Antigravity, copy this file to:" -ForegroundColor Yellow
    Write-Host "  C:\Users\harib\AppData\Local\Programs\Antigravity\bin\code-tunnel.exe" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
