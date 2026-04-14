# 📝 Local LaTeX Editor

Welcome! This is a tool that helps you write papers and documents using **LaTeX** - a special way to make beautiful documents with math, science, and more!

## 🎯 What This Does

Think of it like Google Docs, but for people who write scientific papers, math homework, or fancy reports. It runs on your computer (no internet needed!) and turns your writing into a PDF file.

## 🚀 Quick Start (Easy Way!)

We've created **setup scripts** that do all the work for you! 

### 🍎 macOS / 🐧 Linux

1. **Download the setup script** and save it to your computer
2. **Open Terminal** and go to where you saved the script
3. **Run this command:**
   ```bash
   ./setup-macos-linux.sh
   ```
4. **Follow the prompts** - the script will check what you need and help install it!

That's it! The script will:
- ✅ Check if you have the required tools (Node.js, pnpm, Git)
- ✅ Install missing tools automatically (when possible)
- ✅ Download the LaTeX Editor code
- ✅ Set everything up
- 🎉 Tell you how to start it!

### 🪟 Windows

1. **Download the setup script** (`setup-windows.bat`) and save it to your computer
2. **Double-click** the file to run it
3. **Follow the instructions** on screen

The script will guide you through installing everything you need!

---

## 🛠️ Manual Setup (If You Prefer)

Don't want to use the script? Here's how to do it yourself:

### What You Need First

Before you start, make sure you have:

1. **A Computer** 💻 (Mac, Windows, or Linux)
2. **Node.js** - This is like the engine that makes the program run
3. **pnpm** - This helps download extra parts the program needs
4. **LaTeX** - This is the magic that turns your writing into beautiful PDFs

### 📥 Step 1: Download the Program

#### 🍎 If you have a Mac:

1. Open **Terminal** (it's in Applications > Utilities)
2. Type this and press Enter:
   ```bash
   git clone https://github.com/YOUR_USERNAME/local-latex-editor.git
   ```
3. Then type:
   ```bash
   cd local-latex-editor
   ```

#### 🪟 If you have Windows:

1. Install **Git** first: Go to https://git-scm.com/download/win and download it
2. Open **Command Prompt** or **PowerShell**
3. Type this and press Enter:
   ```bash
   git clone https://github.com/YOUR_USERNAME/local-latex-editor.git
   ```
4. Then type:
   ```bash
   cd local-latex-editor
   ```

#### 🐧 If you have Linux:

1. Open your terminal
2. Type this and press Enter:
   ```bash
   git clone https://github.com/YOUR_USERNAME/local-latex-editor.git
   ```
3. Then type:
   ```bash
   cd local-latex-editor
   ```

### 🔧 Step 2: Install the Tools

Now we need to install some helper tools. Don't worry - this is automatic!

#### 1️⃣ Install Node.js

Go to https://nodejs.org and download the **LTS** version (the one with the green button that says "Recommended For Most Users")

**To check if it worked:** Open Terminal/Command Prompt and type:
```bash
node --version
```
You should see a number like `v18.x.x` or higher!

#### 2️⃣ Install pnpm

Open Terminal/Command Prompt and type:
```bash
npm install -g pnpm
```

**To check if it worked:** Type:
```bash
pnpm --version
```
You should see a number!

#### 3️⃣ Install LaTeX

This is the big one that makes your documents look pretty!

**🍎 Mac Users:**
1. Go to https://www.tug.org/mactex/
2. Download MacTeX
3. Open the downloaded file and follow the instructions
4. It's big (about 4GB), so it might take a while to download! ⏰

**🪟 Windows Users:**
1. Go to https://miktex.org/download
2. Download MiKTeX
3. Install it and follow the instructions

**🐧 Linux Users:**
1. Open Terminal
2. Type:
   ```bash
   sudo apt-get install texlive-full
   ```
3. Enter your password when asked
4. Wait for it to finish (this might take a while!)

### 📦 Step 3: Get Everything Ready

Now that you have the tools, let's get the program ready!

1. Make sure you're in the `local-latex-editor` folder (you should see the $ or > prompt)
2. Type this and press Enter:
   ```bash
   pnpm install
   ```
3. Wait! ⌛ This downloads all the pieces the program needs. It might take a few minutes.
4. When you see the prompt again, you're done! 🎉

---

## 🚀 Start the Program!

### Using the Quick Start Script (Easiest!)

After setup, you can use our quick start script:

**🍎 macOS / 🐧 Linux:**
```bash
./start.sh
```

**🪟 Windows:**
Double-click `start.bat` or run:
```
start.bat
```

### Manual Start

If you prefer to start manually:

1. Open Terminal/Command Prompt
2. Make sure you're in the project folder:
   ```bash
   cd local-latex-editor
   ```
3. Type:
   ```bash
   pnpm dev
   ```
4. Wait a few seconds...
5. You'll see messages like "Frontend running on port 3000" and "Backend running on port 3001"
6. Open your web browser (Chrome, Firefox, Safari, etc.)
7. Go to this address: **http://localhost:3000**

**🎉 YOU DID IT!** You should now see the LaTeX Editor in your browser!

## 🛑 How to Stop the Program

When you're done using the editor:

1. Go back to your Terminal/Command Prompt
2. Press **Ctrl + C** (hold Ctrl and press C)
3. You'll see a message asking if you want to stop - type `y` and press Enter
4. The program stops! 👋

## 🔄 How to Start It Again Later

Next time you want to use it, just run the quick start script:

**🍎 macOS / 🐧 Linux:**
```bash
./start.sh
```

**🪟 Windows:**
```
start.bat
```

Or manually:

1. Open Terminal/Command Prompt
2. Type:
   ```bash
   cd local-latex-editor
   ```
3. Then type:
   ```bash
   pnpm dev
   ```
4. Go to **http://localhost:3000** in your browser

That's it! Much faster the second time! 🚀

## 🆘 Help! Something Went Wrong

### ❌ "command not found: pnpm"

**What it means:** The computer can't find pnpm

**How to fix:**
1. Try installing pnpm again:
   ```bash
   npm install -g pnpm
   ```
2. Close Terminal and open it again
3. Try again!

### ❌ "command not found: node"

**What it means:** Node.js isn't installed or can't be found

**How to fix:**
1. Go back to Step 2 and install Node.js
2. After installing, close Terminal and open a new one
3. Try `node --version` again

### ❌ "Cannot find module"

**What it means:** Some pieces are missing

**How to fix:**
1. Make sure you're in the `local-latex-editor` folder
2. Run:
   ```bash
   pnpm install
   ```
3. Wait for it to finish

### ❌ "LaTeX not found" or compilation fails

**What it means:** LaTeX isn't installed properly

**How to fix:**
1. Go back to Step 2, Part 3
2. Install LaTeX for your computer
3. After installing, close everything and start over

### ❌ "Port 3000 already in use"

**What it means:** Something else is using that port

**How to fix:**
1. Find what's using port 3000 and close it, OR
2. Change the port in the settings (ask an adult for help with this one!)

### ❌ The page doesn't load

**What it means:** The program might not be running

**How to fix:**
1. Check your Terminal - is the program still running?
2. Try refreshing the browser page (press F5)
3. Make sure you typed the address correctly: **http://localhost:3000**

## 🎨 What Can You Do With It?

Now that it's running, you can:

- ✏️ Write papers and documents
- 📊 Add math equations and formulas
- 📚 Create bibliographies
- 🖼️ Insert pictures
- 📄 Export as PDF files
- 🗂️ Organize multiple files in projects

## 📚 Want to Learn More?

- **LaTeX Tutorial:** https://www.overleaf.com/learn/latex/Learn_LaTeX_in_30_minutes
- **Example Documents:** Check the `docs/` folder in the program
- **Get Help:** Ask a teacher, parent, or friend who knows about computers!

## 📝 Remember

- **Save your work often!** 💾
- **Don't share your password** if you set one up 🔒
- **Have fun experimenting!** 🎉

## 🐛 Found a Bug?

If something doesn't work right:

1. Read the error message carefully
2. Check the "Help!" section above
3. Ask for help from someone who knows computers
4. Or tell the person who gave you this program!

---

## 🤝 For Contributors

Want to help improve this project? Check out our [Contributing Guide](CONTRIBUTING.md) for detailed information about:
- Development setup
- Code conventions
- How to submit changes
- Project structure

---

**Good luck and happy writing!** 🎓✨

*Made with ❤️ for students, teachers, and anyone who loves beautiful documents!*
