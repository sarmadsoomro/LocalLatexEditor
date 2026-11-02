@echo off
:: =============================================================================
:: Local LaTeX Editor - Quick Start Script (Windows)
:: =============================================================================
:: Run this after setup to quickly start the development server
:: =============================================================================

echo.
echo Starting Local LaTeX Editor...
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo Not in project directory. Looking for it...
    
    if exist "TexCraft" (
        cd TexCraft
        echo Found and entered TexCraft\
    ) else if exist "..\TexCraft" (
        cd ..\TexCraft
        echo Found and entered TexCraft\
    ) else (
        echo Please run this script from the project directory
        echo Or make sure TexCraft\ exists
        pause
        exit /b 1
    )
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    pnpm install
)

echo.
echo Starting development server...
echo ================================
echo.

:: Start the dev server
pnpm dev

pause
