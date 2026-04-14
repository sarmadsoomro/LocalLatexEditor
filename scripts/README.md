# Setup Scripts

This folder contains automated setup scripts to make installing and running the LaTeX Editor easy!

## Available Scripts

### Initial Setup Scripts

Use these when you're setting up the project for the first time:

| Script | Platform | What It Does |
|--------|----------|--------------|
| `setup-macos-linux.sh` | macOS, Linux | Checks prerequisites, installs missing tools, clones repo, installs dependencies |
| `setup-windows.bat` | Windows | Checks prerequisites, provides installation instructions, clones repo, installs dependencies |

### Quick Start Scripts

Use these after setup to quickly start the development server:

| Script | Platform | What It Does |
|--------|----------|--------------|
| `start.sh` | macOS, Linux | Finds the project directory, checks dependencies, starts the dev server |
| `start.bat` | Windows | Finds the project directory, checks dependencies, starts the dev server |

## How to Use

### First Time Setup

**macOS / Linux:**
```bash
# Download the script, then run:
./setup-macos-linux.sh
```

**Windows:**
```
# Download setup-windows.bat, then double-click it
# OR run in Command Prompt:
setup-windows.bat
```

### Starting the Editor Later

**macOS / Linux:**
```bash
./start.sh
```

**Windows:**
```
# Double-click start.bat
# OR run in Command Prompt:
start.bat
```

## What the Scripts Check For

The setup scripts will verify you have:

1. ✅ **Git** - For downloading the code
2. ✅ **Node.js 18+** - The runtime for the application
3. ✅ **pnpm** - Package manager for dependencies
4. ✅ **LaTeX** - For compiling documents to PDF

If anything is missing, the scripts will:
- Try to install it automatically (when possible)
- Give you clear instructions on how to install it manually
- Tell you exactly where to download it

## Troubleshooting

### "Permission denied" on macOS/Linux

If you get a "permission denied" error, make the script executable:
```bash
chmod +x setup-macos-linux.sh
chmod +x start.sh
```

### Script says "command not found"

Make sure you're in the right directory. Use `cd` to navigate to where you saved the script:
```bash
cd Downloads
./setup-macos-linux.sh
```

### Windows says "Windows protected your PC"

Windows might show a security warning for .bat files. Click "More info" then "Run anyway" - these are safe scripts we created for you!

### Setup fails partway through

No problem! The scripts are designed to be run multiple times. Fix the issue and run the script again - it will pick up where it left off.

## Need More Help?

See the main [README.md](../README.md) for detailed troubleshooting steps and manual installation instructions.
