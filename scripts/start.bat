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
    
    if exist "local-latex-editor" (
        cd local-latex-editor
        echo Found and entered local-latex-editor\
    ) else if exist "..\local-latex-editor" (
        cd ..\local-latex-editor
        echo Found and entered local-latex-editor\
    ) else (
        echo Please run this script from the project directory
        echo Or make sure local-latex-editor\ exists
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
