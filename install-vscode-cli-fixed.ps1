# VS Code CLI Installer - PowerShell (Fixed)
# Downloads VS Code Portable and extracts code-tunnel.exe

$ErrorActionPreference = "Stop"

Write-Host "=== VS Code CLI Installer ===" -ForegroundColor Cyan

# Paths
$TempDir = "$env:TEMP\vscode-portable"
$InstallDir = "$env:LOCALAPPDATA\Programs\VSCode-CLI"
$AntigravityBin = "C:\Users\harib\AppData\Local\Programs\Antigravity\bin"
$ZipUrl = "https://update.code.visualstudio.com/latest/win32-x64-archive/stable"

# Create temp directory
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

# Download with proper headers
Write-Host "Downloading VS Code Portable (~120 MB)..." -ForegroundColor Yellow
Write-Host "This may take 2-5 minutes depending on your connection..." -ForegroundColor Gray

try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $ZipUrl -OutFile "$TempDir\vscode.zip" -UseBasicParsing
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    Write-Host "Trying alternative download URL..." -ForegroundColor Yellow
    
    # Try alternative URL
    $AltUrl = "https://vscode.download.prss.microsoft.com/dbazure/download/stable/stable/win32-x64-archive/stable"
    try {
        Invoke-WebRequest -Uri $AltUrl -OutFile "$TempDir\vscode.zip" -UseBasicParsing
    } catch {
        Write-Host "Alternative download also failed." -ForegroundColor Red
        Write-Host ""
        Write-Host "Please manually download from:" -ForegroundColor Yellow
        Write-Host "  https://code.visualstudio.com/download" -ForegroundColor Cyan
        exit 1
    }
}

# Extract
Write-Host "Extracting files..." -ForegroundColor Yellow
Expand-Archive -Path "$TempDir\vscode.zip" -DestinationPath $TempDir -Force

# Find and copy code-tunnel.exe
Write-Host "Looking for code-tunnel.exe..." -ForegroundColor Yellow
$TunnelExe = Get-ChildItem -Path $TempDir -Recurse -Filter "code-tunnel.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
$CodeExe = Get-ChildItem -Path $TempDir -Recurse -Filter "Code.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($TunnelExe) {
    Write-Host "Found code-tunnel.exe at: $($TunnelExe.FullName)" -ForegroundColor Green
    
    # Copy to install dir
    Copy-Item -Path $TunnelExe.FullName -Destination "$InstallDir\code-tunnel.exe" -Force
    Write-Host "Copied to: $InstallDir\code-tunnel.exe" -ForegroundColor Green
    
    # Copy to Antigravity if directory exists
    if (Test-Path $AntigravityBin) {
        Copy-Item -Path $TunnelExe.FullName -Destination "$AntigravityBin\code-tunnel.exe" -Force
        Write-Host "Copied to Antigravity: $AntigravityBin\code-tunnel.exe" -ForegroundColor Green
    }
} else {
    Write-Host "code-tunnel.exe not found in archive" -ForegroundColor Red
}

if ($CodeExe) {
    # Copy main code.exe and other required files
    $BinDir = "$InstallDir\bin"
    New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
    
    Copy-Item -Path $CodeExe.FullName -Destination "$BinDir\code.exe" -Force
    Write-Host "Copied Code.exe to: $BinDir\code.exe" -ForegroundColor Green
    
    # Also copy other .exe files
    Get-ChildItem -Path (Split-Path $CodeExe.FullName) -Filter "*.exe" | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination "$BinDir\$($_.Name)" -Force -ErrorAction SilentlyContinue
    }
}

# Cleanup
Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cleaned up temp files" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""

if (Test-Path "$InstallDir\code-tunnel.exe") {
    Write-Host "✓ code-tunnel.exe installed" -ForegroundColor Green
    Write-Host "  Location: $InstallDir\code-tunnel.exe" -ForegroundColor Gray
}

if (Test-Path "$AntigravityBin\code-tunnel.exe") {
    Write-Host "✓ Antigravity port forwarding FIXED!" -ForegroundColor Green
    Write-Host "  Location: $AntigravityBin\code-tunnel.exe" -ForegroundColor Gray
} else {
    Write-Host "! code-tunnel.exe NOT in Antigravity folder" -ForegroundColor Yellow
    Write-Host "  You can manually copy from: $InstallDir\code-tunnel.exe" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  code tunnel --port 3000" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
