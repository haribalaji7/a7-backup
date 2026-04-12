# VS Code CLI Installation Instructions

## Option 1: Run the Installer (Recommended)

### Method A: Using Batch File (Simplest)
```batch
install-vscode-cli.bat
```

### Method B: Using PowerShell Script
```powershell
powershell -ExecutionPolicy Bypass -File install-vscode-cli.ps1
```

---

## Option 2: Manual Download (Fastest)

### Step 1: Download VS Code
1. Go to: https://code.visualstudio.com/download
2. Download **Windows** version
3. Install it (or use "Extract" option for portable install)

### Step 2: Find code-tunnel.exe
After installation, find the file:
```
C:\Users\<username>\AppData\Local\Programs\Microsoft VS Code\bin\code-tunnel.exe
```

### Step 3: Copy to Antigravity
Copy the file to fix the error:
```batch
copy "C:\Users\%USERNAME%\AppData\Local\Programs\Microsoft VS Code\bin\code-tunnel.exe" "C:\Users\harib\AppData\Local\Programs\Antigravity\bin\code-tunnel.exe"
```

---

## Option 3: Direct Binary Download

If you want just the tunnel binary without full VS Code:

1. Download the VS Code CLI archive:
   - URL: https://update.code.visualstudio.com/latest/win32-x64-archive/stable
   
2. Extract it
3. Find `code-tunnel.exe` inside
4. Copy to: `C:\Users\harib\AppData\Local\Programs\Antigravity\bin\`

---

## After Installation - Usage

```bash
# Forward port 3000
code tunnel --port 3000

# With custom name
code tunnel --port 3000 --name myapp

# View help
code tunnel --help
```

---

## Alternative: Just Use Localtunnel (Already Working)

Your project already has localtunnel installed! Use it instead:

```bash
# Forward port 3000
npm run tunnel

# Dev server + tunnel
npm run dev:tunnel
```

This gives you a public URL without needing VS Code CLI.
