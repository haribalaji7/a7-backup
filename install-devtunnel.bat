# Download and install Microsoft Dev Tunnel CLI
echo "Downloading Microsoft Dev Tunnel CLI..."
curl -L -o devtunnel.exe "https://aka.ms/TunnelsCliDownload/win-x64"
echo "Download complete!"
echo ""
echo "Installing to Antigravity bin directory..."
copy devtunnel.exe "C:\Users\harib\AppData\Local\Programs\Antigravity\bin\devtunnel.exe"
echo "Installed!"
echo ""
echo "Testing..."
C:\Users\harib\AppData\Local\Programs\Antigravity\bin\devtunnel.exe --version
