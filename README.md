<div align="center">

# 🎨 GitHub Contribution Graph Art Service
**Turn your GitHub profile into a digital canvas! Draw beautiful text and symbols on your contribution graph with fully automated, backdated commits.**

<p>
    <img src="https://img.shields.io/badge/Status-Active-26a641?style=for-the-badge&logo=github">
    <img src="https://img.shields.io/badge/Node.js-16+-339933?style=for-the-badge&logo=node.js">
    <img src="https://img.shields.io/badge/Platform-Mac%20%7C%20Linux%20%7C%20Windows-blue?style=for-the-badge">
</p>

</div>

---

## 🌟 Features

- **✅ Interactive CLI Wizard** — No complicated config required. Just run `npm start` and answer the prompts!
- **🟩 Solid Background (Graph Leveling)** — Automatically scans your existing commits and pads the rest of the year to a perfect, solid light-green background, making your dark-green text "pop".
- **🔄 Smart Batch Processing** — Bypasses GitHub's display rendering limits by automatically chunking thousands of commits into manageable batches (e.g., 900 at a time).
- **🎨 Live Terminal Preview** — See exactly how your text will look on the 52-week grid before making any actual commits.
- **⚙️ Environment Setup** — Native `.env` support saves you from typing your Repo URL or Username over and over again.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v16 or higher.
- A **GitHub account** with an *empty* repository specifically created for this art (Do **NOT** use your main code repositories!).

### 2. Installation
```bash
# Clone this repository
git clone https://github.com/withNoclout/Graph-Art-Service.git
cd Graph-Art-Service

# Install the required dependencies
npm install
```

### 3. Save Time with `.env` (Optional but Highly Recommended)
Tired of pasting your Git Remote URL and Username every time? 
Copy the example environment file and fill in your details:
```bash
cp .env.example .env
```
Now, whenever you run the wizard, your values will be pre-filled!

### 4. Run the Magic
```bash
npm start
```
Follow the interactive prompts to type your word, pick a year, and watch the art generate!

---

## 🧠 How It Works (Architecture)

If you're a developer curious about the inner workings, here's a brief breakdown of the core modules:

*   **`src/index.js`**: The brains of the operation. Handles the interactive CLI, loads the `.env` configuration, and orchestrates the other modules. It manages the **Smart Batch Processing** loop that distributes commits evenly so your art reveals itself gradually.
*   **`src/planner.js`**: Takes your string of text and maps it onto a 7x53 grid (representing a year). If you enabled **Solid Background**, it will calculate exactly how many commits are needed on every single day of the year to reach the perfect background aesthetic.
*   **`src/scraper.js`**: Uses `cheerio` to fetch your actual public GitHub profile, reading the daily commit totals to ensure the `planner.js` calculates intensity values absolutely perfectly.
*   **`src/committer.js`**: Executes raw Git commands. It generates a temporary `.contribution` file and fires off backdated commits (using `GIT_AUTHOR_DATE`) to trick GitHub's timeline.

---

## ❓ FAQ & Troubleshooting

### Why is the script pausing after 900 commits? (Batching)
GitHub struggles to render contribution graphs if you push 15,000+ commits all exactly at once. The service automatically chunks your commits into "Batches" (default 900) and pushes them sequentially. Just let the script run and enjoy the show!

### My Graph Art looks misaligned or has blank spots!
GitHub graphs start on the *first Sunday* of the year. Depending on leap years, there might be a slight column shift. Use the **Terminal Preview** step to verify alignment before hitting "Yes". 

If you made a mistake, simply run:
```bash
npm run reset
```
This powerful script will wipe the local tracking data AND **Force Push** a completely blank history to your remote repository, allowing you to start entirely fresh!

### Will this ruin my real contribution history?
**No!** As long as you push this art to a *separate* dedicated repository. Your real code contributions live in their own repositories. If you ever get tired of the art, simply delete the remote art repository, and the fake green squares will vanish from your profile.

---

<div align="center">
Made with ❤️ to hack the GitHub aesthetic
</div>
