@echo off
setlocal EnableDelayedExpansion

:: =============================================================================
:: Local LaTeX Editor - Windows Setup Script
:: =============================================================================
:: This script checks prerequisites and sets up the development environment
:: =============================================================================

:: Configuration
set "REPO_URL=https://github.com/sarmadsoomro/LocalLatexEditor.git"
set "PROJECT_NAME=LocalLatexEditor"

:: Colors (Windows 10+)
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "NC=[0m"

echo.
echo ========================================
echo Local LaTeX Editor Setup
echo ========================================
echo.
echo This script will set up your development environment
echo.

:: =============================================================================
:: Check Prerequisites
:: =============================================================================

echo.
echo Step 1: Checking Prerequisites
echo ========================================
echo.

set "MISSING_DEPS="

:: Check Git
where git >nul 2>nul
if %errorlevel% == 0 (
    for /f "tokens=3" %%a in ('git --version') do set "GIT_VERSION=%%a"
    echo [OK] Git installed: !GIT_VERSION!
) else (
    echo [MISSING] Git not found
    set "MISSING_DEPS=!MISSING_DEPS! git"
)

:: Check Node.js
where node >nul 2>nul
if %errorlevel% == 0 (
    for /f "tokens=*" %%a in ('node --version') do set "NODE_VERSION=%%a"
    echo [OK] Node.js installed: !NODE_VERSION!
    
    :: Check version (simplified - just check if it exists)
) else (
    echo [MISSING] Node.js not found
    set "MISSING_DEPS=!MISSING_DEPS! nodejs"
)

:: Check pnpm
where pnpm >nul 2>nul
if %errorlevel% == 0 (
    for /f "tokens=*" %%a in ('pnpm --version') do set "PNPM_VERSION=%%a"
    echo [OK] pnpm installed: !PNPM_VERSION!
) else (
    echo [MISSING] pnpm not found
    set "MISSING_DEPS=!MISSING_DEPS! pnpm"
)

:: Check LaTeX
where pdflatex >nul 2>nul
if %errorlevel% == 0 (
    echo [OK] LaTeX appears to be installed
) else (
    where xelatex >nul 2>nul
    if %errorlevel% == 0 (
        echo [OK] LaTeX appears to be installed (XeLaTeX found)
    ) else (
        echo [MISSING] LaTeX not found
        set "MISSING_DEPS=!MISSING_DEPS! latex"
    )
)

if "!MISSING_DEPS!"=="" (
    echo.
    echo [SUCCESS] All prerequisites met!
    goto :install_complete
) else (
    echo.
    echo [WARNING] Missing dependencies:!MISSING_DEPS!
    goto :install_deps
)

:: =============================================================================
:: Install Dependencies
:: =============================================================================

:install_deps
echo.
echo Step 2: Installation Instructions
echo ========================================
echo.

echo The following dependencies need to be installed:
echo.

:: Git instructions
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [GIT]
    echo   1. Download from: https://git-scm.com/download/win
    echo   2. Run the installer with default settings
    echo   3. Restart this script after installation
    echo.
)

:: Node.js instructions
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [NODE.JS]
    echo   1. Download from: https://nodejs.org (LTS version)
    echo   2. Run the installer with default settings
    echo   3. Restart this script after installation
    echo.
)

:: pnpm instructions
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [PNPM]
    echo   After installing Node.js, run this command:
    echo     npm install -g pnpm
    echo.
)

:: LaTeX instructions
where pdflatex >nul 2>nul
if %errorlevel% neq 0 (
    where xelatex >nul 2>nul
    if %errorlevel% neq 0 (
        echo [LATEX]
        echo   1. Download MiKTeX from: https://miktex.org/download
        echo   2. Run the installer (Basic or Complete version)
        echo   3. Restart this script after installation
        echo.
    )
)

echo Please install the missing dependencies and run this script again.
echo.
pause
exit /b 1

:: =============================================================================
:: Clone Repository
:: =============================================================================

:install_complete
echo.
echo Step 3: Cloning Repository
echo ========================================
echo.

if exist "%PROJECT_NAME%" (
    echo [WARNING] Directory '%PROJECT_NAME%' already exists
    set /p "USE_EXISTING=Do you want to use the existing directory? (y/n): "
    if /i "!USE_EXISTING!"=="y" (
        cd "%PROJECT_NAME%"
        echo [OK] Using existing directory
        goto :install_project_deps
    ) else (
        echo [ERROR] Please remove or rename the existing directory first
        pause
        exit /b 1
    )
)

echo [INFO] Cloning from %REPO_URL%...
git clone "%REPO_URL%"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to clone repository
    echo Please check:
    echo   - You have an internet connection
    echo   - The REPO_URL in this script is correct
    echo   - You have permission to access the repository
    pause
    exit /b 1
)

cd "%PROJECT_NAME%"
echo [OK] Repository cloned!

:: =============================================================================
:: Install Project Dependencies
:: =============================================================================

:install_project_deps
echo.
echo Step 4: Installing Project Dependencies
echo ========================================
echo.

echo [INFO] Running pnpm install...
echo (This may take a few minutes...)
echo.

pnpm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed!

:: =============================================================================
:: Setup Complete
:: =============================================================================

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Your LaTeX Editor is ready to use!
echo.
echo To start the editor:
echo   cd %PROJECT_NAME%
echo   pnpm dev
echo.
echo Then open your browser to: http://localhost:3000
echo.
echo Next Steps:
echo   1. Update REPO_URL in this script with your actual repository URL
echo   2. Run 'pnpm dev' to start the development server
echo   3. Read CONTRIBUTING.md for development guidelines
echo.

pause
