# NextGen EPFO — EPFO Claim Portal

Next-Generation Citizen-First EPFO Portal with Automated Claim Diagnostics, Statutory Eligibility Calculator, and Instant eKYC Gateway.

---

## 💻 How to Download and Run on Your Local Computer

### 1. Download the Project
- **Option A (AI Studio Export / GitHub):** Click the **Export to GitHub** or **Download ZIP** option in the AI Studio top/settings menu.
- **Option B (ZIP extraction):** Extract the downloaded `.zip` file into a folder on your computer (e.g., `epfo-claim-portal`).

### 2. Install Prerequisites
Ensure you have **Node.js** (version 18 or higher) installed on your machine:
- Download Node.js from [nodejs.org](https://nodejs.org/) if you don't already have it.

### 3. Open Terminal & Install Dependencies
Open your terminal (Command Prompt / PowerShell on Windows, or Terminal on macOS / Linux) in the project directory:

```bash
# Navigate into the project folder
cd path/to/epfo-claim-portal

# Install all npm dependencies
npm install
```

### 4. Run Development Server Locally
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```
(or the port shown in your terminal, such as `http://localhost:5173`).

### 5. Build for Production
```bash
npm run build
```
This produces the optimized production-ready bundle inside the `dist/` folder.

---

## 🚀 How to Deploy on Vercel

This repository is **100% ready for Vercel deployment** with zero additional configuration needed.

### Method 1: Deploy via GitHub (Recommended)
1. Push this repository or export it to your **GitHub** account.
2. Log in to [vercel.com](https://vercel.com).
3. Click **"Add New..."** → **"Project"**.
4. Import your GitHub repository.
5. Vercel will automatically detect:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Click **"Deploy"**. Your live website URL will be ready in under 1 minute!

### Method 2: Deploy using Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy directly from your computer
vercel
```
Follow the prompts and select the default settings.
