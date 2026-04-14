# 📝 Local LaTeX Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)

A **modern, browser-based LaTeX editor** that runs entirely on your local machine. No cloud required, no subscriptions, no data leaves your computer.

Think of it like **Google Docs meets LaTeX** — beautiful scientific typesetting with the privacy and speed of a local application.

![Local LaTeX Editor](https://via.placeholder.com/800x400?text=LaTeX+Editor+Screenshot)

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [💻 System Requirements](#-system-requirements)
- [🚀 Quick Start](#-quick-start)
  - [Option 1: Automated Setup Scripts](#option-1-automated-setup-scripts-recommended)
  - [Option 2: AI Assistant Installation](#option-2-ai-assistant-installation-easiest)
  - [Option 3: Manual Installation](#option-3-manual-installation)
- [▶️ Starting the Editor](#️-starting-the-editor)
- [🛠️ Development](#️-development)
- [❓ Troubleshooting](#-troubleshooting)
- [🔒 Security](#-security)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

- ✏️ **Real-time LaTeX Editing** — Write with syntax highlighting and intelligent autocomplete
- 📄 **Instant PDF Preview** — See your document compile in real-time as you type
- 🗂️ **Project Management** — Organize multiple documents and projects
- 📂 **File Import/Export** — Import existing `.tex` files and export to PDF
- 🎨 **Modern UI** — Clean, responsive interface built with React and Tailwind CSS
- ⚡ **Fast Compilation** — Optimized LaTeX compilation pipeline
- 🔒 **100% Private** — Your documents never leave your machine
- 🌐 **Offline-First** — Works without internet connection
- 🖥️ **Cross-Platform** — Works on macOS, Windows, and Linux

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Frontend)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Monaco Editor│  │  File Tree   │  │   PDF Preview    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         └──────────────────┴───────────────────┘            │
│                            │                                │
│                     ┌──────┴──────┐                         │
│                     │  Zustand    │                         │
│                     │    Store    │                         │
│                     └──────┬──────┘                         │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP / WebSocket
┌────────────────────────────┼────────────────────────────────┐
│                    ┌───────┴───────┐                         │
│                    │ Express API   │                         │
│                    │  (Port 3001)  │                         │
│                    └───────┬───────┘                         │
│         ┌──────────────────┼──────────────────┐              │
│         ▼                  ▼                  ▼              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ File System  │  │ Compilation  │  │  Project     │       │
│  │   Service    │  │   Service    │  │  Service     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Frontend**: React 18 + TypeScript + Vite + Monaco Editor + PDF.js + Zustand + Tailwind CSS
- **Backend**: Express + TypeScript
- **Build**: Turborepo + pnpm
- **Testing**: Vitest + Playwright

---

## 💻 System Requirements

### Minimum Requirements

- **OS**: macOS 10.15+, Windows 10+, or Linux (Ubuntu 20.04+)
- **RAM**: 4 GB
- **Disk Space**: 
  - Editor: ~500 MB
  - LaTeX Distribution: ~4 GB (MacTeX/MiKTeX/TeX Live)
- **Node.js**: 18.0.0 or higher
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

### Required Software

1. **Node.js 18+** — JavaScript runtime ([Download](https://nodejs.org/))
2. **pnpm 8+** — Package manager (`npm install -g pnpm`)
3. **Git** — Version control ([Download](https://git-scm.com/))
4. **LaTeX Distribution** — One of:
   - **macOS**: [MacTeX](https://www.tug.org/mactex/) (~4GB)
   - **Windows**: [MiKTeX](https://miktex.org/download) or TeX Live
   - **Linux**: `sudo apt-get install texlive-full`

---

## 🚀 Quick Start

Choose your preferred installation method:

### Option 1: Automated Setup Scripts (Recommended)

We've created automated setup scripts that check your system, install missing dependencies, and configure everything for you.

**🍎 macOS / 🐧 Linux:**
```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/local-latex-editor/main/scripts/setup-macos-linux.sh | bash
```

Or manually:
```bash
# 1. Download the script
wget https://raw.githubusercontent.com/YOUR_USERNAME/local-latex-editor/main/scripts/setup-macos-linux.sh

# 2. Make it executable
chmod +x setup-macos-linux.sh

# 3. Run it
./setup-macos-linux.sh
```

**🪟 Windows:**
```powershell
# Download and run the setup script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/YOUR_USERNAME/local-latex-editor/main/scripts/setup-windows.bat" -OutFile "setup-windows.bat"
.\setup-windows.bat
```

**What the script does:**
1. ✅ Checks for Node.js, pnpm, Git, and LaTeX
2. ✅ Installs missing tools automatically (when possible)
3. ✅ Clones the repository
4. ✅ Installs project dependencies (`pnpm install`)
5. 🎉 Tells you how to start the editor

---

### Option 2: AI Assistant Installation (Easiest!)

If you use **OpenCode**, **VS Code Copilot**, **Claude Code**, **Cursor**, or **Gemini CLI**, just ask them to install it for you!

**Simply say:**
> "Install the Local LaTeX Editor project for me"

The AI assistant will:
- ✅ Check your system for prerequisites
- ✅ Install any missing tools
- ✅ Clone the repository
- ✅ Install all dependencies
- ✅ Set up the development environment

**To start it later:**
> "Start the LaTeX Editor"

That's it! The AI handles everything for you! 🤖

---

### Option 3: Manual Installation

Prefer to do it yourself? Follow these steps:

#### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/local-latex-editor.git
cd local-latex-editor
```

#### Step 2: Install Prerequisites

**Install Node.js 18+:**
- Download from [nodejs.org](https://nodejs.org/) (LTS version recommended)
- Verify: `node --version` (should show v18.x.x or higher)

**Install pnpm:**
```bash
npm install -g pnpm
```

**Install LaTeX:**

| OS | Command/Link |
|----|--------------|
| macOS | `brew install --cask mactex` or [Download MacTeX](https://www.tug.org/mactex/) |
| Windows | [Download MiKTeX](https://miktex.org/download) |
| Ubuntu/Debian | `sudo apt-get install texlive-full` |
| Fedora | `sudo dnf install texlive-scheme-full` |

#### Step 3: Install Project Dependencies

```bash
pnpm install
```

This downloads all required packages. It may take a few minutes.

---

## ▶️ Starting the Editor

### Using Quick Start Scripts (Recommended)

**🍎 macOS / 🐧 Linux:**
```bash
./scripts/start.sh
```

**🪟 Windows:**
```batch
scripts\start.bat
```

### Manual Start

```bash
# Start both frontend and backend
pnpm dev
```

This will:
- Start the **frontend** at http://localhost:3000
- Start the **backend API** at http://localhost:3001

**Open your browser** and navigate to: **http://localhost:3000**

🎉 **You should see the LaTeX Editor!**

---

## 🛑 Stopping the Editor

When you're done:

1. Go to your terminal
2. Press **Ctrl + C**
3. Type `y` and press Enter to confirm

---

## 🔄 Restarting Later

Next time you want to use it:

```bash
# Navigate to the project (if not already there)
cd local-latex-editor

# Start the editor
pnpm dev
```

Or use the quick start scripts (see [Starting the Editor](#️-starting-the-editor)).

---

## 🛠️ Development

### Available Commands

```bash
# Start development servers
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm typecheck

# Run tests
pnpm test
pnpm test:unit       # Unit tests only
pnpm test:e2e        # E2E tests only

# Clean build artifacts
pnpm clean
```

### Project Structure

```
local-latex-editor/
├── apps/
│   ├── frontend/          # React + Vite frontend (port 3000)
│   └── backend/           # Express API (port 3001)
├── packages/
│   └── shared-types/      # Shared TypeScript definitions
├── scripts/               # Setup and utility scripts
├── docs/                  # Documentation
├── tooling/               # ESLint and TypeScript configs
├── package.json           # Root monorepo config
└── turbo.json             # Turborepo pipeline
```

---

## ❓ Troubleshooting

### "command not found: pnpm"

**Fix:**
```bash
npm install -g pnpm
```
Close and reopen your terminal, then try again.

### "command not found: node"

**Fix:** 
1. Install Node.js from https://nodejs.org/
2. Close and reopen your terminal
3. Verify with `node --version`

### "Cannot find module"

**Fix:**
```bash
pnpm install
```

### "LaTeX not found" or compilation fails

**Fix:** 
Install a LaTeX distribution (see [System Requirements](#-system-requirements))

### "Port 3000 already in use"

**Fix:**
Kill the process using port 3000:
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### The page doesn't load

**Check:**
1. Is the dev server running? (Look for "Frontend running on port 3000")
2. Try refreshing the browser (F5)
3. Check the URL: http://localhost:3000

### Permission denied (macOS/Linux)

**Fix:**
```bash
chmod +x scripts/*.sh
```

---

## 🔒 Security

Your **privacy is our priority**:

- ✅ **Local Only** — All processing happens on your machine
- ✅ **No Cloud** — Documents never leave your computer
- ✅ **No Tracking** — No analytics or telemetry
- ✅ **Sandboxed** — LaTeX compilation runs with user-level privileges
- ✅ **No Shell Escape** — LaTeX shell escape is disabled for security

**Security Best Practices:**
- Keep your LaTeX distribution updated
- Don't enable shell escape unless you trust the document source
- Bind to localhost only (127.0.0.1) — never expose to the internet

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for:

- Development setup instructions
- Code conventions and style guide
- How to submit pull requests
- Project architecture details

### Quick Contributor Setup

```bash
# Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/local-latex-editor.git
cd local-latex-editor

# Install dependencies
pnpm install

# Create a branch
git checkout -b feature/my-feature

# Make your changes and commit
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature
```

---

## 📚 Resources

- **LaTeX Tutorial**: [Overleaf's 30-minute LaTeX Guide](https://www.overleaf.com/learn/latex/Learn_LaTeX_in_30_minutes)
- **Documentation**: See the `docs/` folder for detailed specs
- **Examples**: Check `examples/` for sample documents
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/local-latex-editor/issues)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Monaco Editor](https://microsoft.github.io/monaco-editor/) (the editor that powers VS Code)
- PDF rendering by [PDF.js](https://mozilla.github.io/pdf.js/)
- LaTeX compilation powered by your system's LaTeX distribution

---

**Good luck and happy writing!** 🎓✨

*Made with ❤️ for students, teachers, and anyone who loves beautiful documents!*
