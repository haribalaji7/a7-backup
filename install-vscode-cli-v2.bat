@echo off
:: VS Code CLI Downloader - Fixed Version
echo === VS Code CLI Installer ===
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\Programs\VSCode-CLI"
set "BIN_DIR=%INSTALL_DIR%\bin"
set "TEMP_ZIP=%TEMP%\vscode-cli.zip"

:: Create directories
mkdir "%BIN_DIR%" 2>nul

echo Downloading VS Code (User Setup)...
echo This may take a few minutes...
echo.

:: Download VS Code User Setup (smaller, faster)
curl -L -o "%TEMP%\VSCodeSetup.exe" "https://update.code.visualstudio.com/latest/win32-x64-user/stable"

if %ERRORLEVEL% neq 0 (
    echo curl failed, trying PowerShell...
    powershell -Command "Invoke-WebRequest -Uri 'https://update.code.visualstudio.com/latest/win32-x64-user/stable' -OutFile '%TEMP%\VSCodeSetup.exe'"
)

if not exist "%TEMP%\VSCodeSetup.exe" (
    echo Download failed!
    pause
    exit /b 1
)

echo.
echo Download complete!
echo.
echo Running installer with /VERYSILENT /MERGETASKS=!runcode...
echo.

:: Extract mode - get files without full install
mkdir "%TEMP%\vscode_extract" 2>nul

:: Try to extract using 7zip if available
where 7z >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Found 7zip, extracting...
    7z x "%TEMP%\VSCodeSetup.exe" -o"%TEMP%\vscode_extract" -y
    
    :: Find and copy code.exe and code-tunnel.exe
    for /r "%TEMP%\vscode_extract" %%f in (Code.exe) do (
        copy "%%f" "%BIN_DIR%\code.exe" > nul 2>&1
    )
    for /r "%TEMP%\vscode_extract" %%f in (code-tunnel.exe) do (
        copy "%%f" "%BIN_DIR%\code-tunnel.exe" > nul 2>&1
        copy "%%f" "%LOCALAPPDATA%\Programs\Antigravity\bin\code-tunnel.exe" > nul 2>&1
    )
) else (
    echo Running full installer...
    "%TEMP%\VSCodeSetup.exe" /VERYSILENT /MERGETASKS=!runcode /NORESTART
    
    :: Wait for install
    timeout /t 5 > nul
    
    :: Copy code-tunnel.exe to Antigravity
    if exist "%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code-tunnel.exe" (
        copy "%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code-tunnel.exe" "%LOCALAPPDATA%\Programs\Antigravity\bin\code-tunnel.exe"
    )
)

:: Cleanup
rmdir /s /q "%TEMP%\vscode_extract" 2>nul
del "%TEMP%\VSCodeSetup.exe" 2>nul

:: Verify
echo.
echo === Installation Check ===
echo.

if exist "%LOCALAPPDATA%\Programs\Antigravity\bin\code-tunnel.exe" (
    echo SUCCESS! code-tunnel.exe installed for Antigravity
    echo.
    echo Your port forwarding should now work!
    echo Try: localhost:3000 forwarding in Antigravity
) else (
    echo code-tunnel.exe not found in Antigravity folder
    echo.
    echo Alternative: VS Code is installed. You can use:
    echo   code tunnel --port 3000
)

if exist "%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.exe" (
    echo.
    echo VS Code CLI available at:
    echo   "%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.exe"
)

echo.
pause
