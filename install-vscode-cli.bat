@echo off
:: Quick VS Code CLI Downloader for Windows
:: This downloads the standalone VS Code CLI executable

echo === VS Code CLI Quick Installer ===
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\Programs\VSCode-CLI"
set "BIN_DIR=%INSTALL_DIR%\bin"

:: Create directories
echo Creating directories...
mkdir "%BIN_DIR%" 2>nul

:: Download using curl (Windows 10/11 has curl built-in)
echo Downloading VS Code CLI...
curl -L -o "%TEMP%\vscode.zip" "https://code.visualstudio.com/sha/download?build=stable^&os=win32-x64-archive"

if %ERRORLEVEL% neq 0 (
    echo Download failed. Trying alternative method...
    goto :try_powershell
)

:: Extract using PowerShell
echo Extracting...
powershell -Command "Expand-Archive -Path '%TEMP%\vscode.zip' -DestinationPath '%INSTALL_DIR%' -Force"

goto :verify

:try_powershell
echo Using PowerShell to download...
powershell -Command "Invoke-WebRequest -Uri 'https://code.visualstudio.com/sha/download?build=stable^&os=win32-x64-archive' -OutFile '%TEMP%\vscode.zip' -MaximumRedirection 5"
powershell -Command "Expand-Archive -Path '%TEMP%\vscode.zip' -DestinationPath '%INSTALL_DIR%' -Force"

:verify
:: Clean up
del "%TEMP%\vscode.zip" 2>nul

:: Check if installed
if exist "%BIN_DIR%\code.cmd" (
    echo.
    echo SUCCESS! VS Code CLI installed to: %INSTALL_DIR%
    echo.
    echo Available commands:
    echo   %BIN_DIR%\code.cmd tunnel --port 3000
    echo.
    echo Add to your PATH manually or run:
    echo   setx PATH "%%PATH%%;%BIN_DIR%"
    echo.
    
    :: Find code-tunnel.exe
    for /r "%INSTALL_DIR%" %%f in (code-tunnel.exe) do (
        echo Found code-tunnel.exe at: %%f
        echo.
        echo To fix Antigravity port forwarding, copy:
        echo   from: %%f
        echo   to:   C:\Users\harib\AppData\Local\Programs\Antigravity\bin\code-tunnel.exe
        goto :done
    )
) else (
    echo Installation may have failed. Check %INSTALL_DIR%
)

:done
echo.
pause
