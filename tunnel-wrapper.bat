@echo off
:: Wrapper for localtunnel to work with Antigravity's port forwarding
:: Accepts --port argument

set PORT=3000

:parse
if "%~1"=="" goto :start
if "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto :parse
)
shift
goto :parse

:start
echo Starting tunnel on port %PORT%...
npx localtunnel --port %PORT%
