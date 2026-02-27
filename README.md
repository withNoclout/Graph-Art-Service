# 🎨 GitHub Contribution Graph Art Service

> Draw beautiful text and symbols on your GitHub contribution graph with automated commits.

<div align="center">

![Preview](https://img.shields.io/badge/Status-Active-26a641?style=for-the-badge&logo=github)
![Node](https://img.shields.io/badge/Node.js-16+-339933?style=for-the-badge&logo=node.js)
![Platform](https://img.shields.io/badge/Platform-Mac%20%7C%20Linux%20%7C%20Windows-blue?style=for-the-badge)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [How It Works](#-how-it-works)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [Running as a Background Service](#-running-as-a-background-service)
- [Configuration](#-configuration)
- [Available Characters](#-available-characters)
- [FAQ](#-faq)

---

## 💡 Overview

This service creates **backdated Git commits** on specific dates so that when viewed on your GitHub profile, the contribution graph spells out **text or symbols** of your choice.

Each filled "pixel" on the graph receives multiple commits (default: 20) to ensure **maximum intensity** (darkest green).

### Features

- ✅ **Interactive CLI** — Prompts you for text, year, and settings
- 🎨 **Terminal Preview** — See exactly how your text will look before committing
- 🔄 **Catch-up Support** — Missed days? It backdates commits automatically
- 🖥️ **Cross-Platform** — Works on macOS, Linux, and Windows
- ⏰ **Background Service** — Optional auto-run via launchd/systemd/Task Scheduler
- 📊 **Progress Tracking** — Resumes where it left off

---

## 🔧 How It Works

```
GitHub Contribution Graph = 7 rows (days) × 52 columns (weeks)

Each character uses a 5×7 pixel font:

  ██░░██    ░░██░░    █████░    █████░
  ██░░██    ████░░    ██░░░░    ██░░██
  ██░░██    ░░██░░    ████░░    █████░
  █████░    ░░██░░    ██░░░░    ██░░██
  ██░░██    ░░██░░    ██░░░░    ██░░██
  ██░░██    ░░██░░    ██░░░░    ██░░██
  ██░░██    █████░    █████░    █████░
   "H"       "I"       "E"       "B"
```

- **1 character** = 5 columns + 1 gap = **6 weeks**
- **Max ~8 characters** per year (52 ÷ 6 = 8)
- **20 commits/pixel** = darkest green intensity

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 16
- **Git** installed and configured
- A **GitHub account** with a repo for contribution art

### Installation

```bash
# 1. Clone this repo
git clone https://github.com/withNoclout/Graph-Art-Service.git
cd Graph-Art-Service

# 2. Install dependencies
npm install

# 3. Run the interactive CLI
npm start
```

That's it! The CLI will guide you through everything.

---

## 📖 Usage

### Interactive Mode (Recommended)

```bash
npm start
```

The CLI will ask you:
1. **Text** — What to draw (max 8 characters)
2. **Year** — Which year to draw on (default: current year)
3. **Commits per pixel** — Intensity level (default: 20)
4. **Start week** — Offset from start of year (default: 1)
5. **Repo path** — Where the contribution repo lives locally
6. **Remote URL** — GitHub remote to push to

After entering all values, you'll see a **terminal preview** of your contribution graph. Confirm to start committing!

### Preview Mode

```bash
npm run preview
```

Shows the preview based on your saved config without making any commits.

### Plan Mode

```bash
npm run plan
```

Shows a detailed list of every date and how many commits will be made.

### Run Mode (Non-interactive)

```bash
npm run run
```

Executes commits using your saved config. Useful for background service mode.

### Help

```bash
node src/index.js --help
```

---

## ⏰ Running as a Background Service

The service installer auto-detects your OS and sets up the appropriate scheduler.

### 📱 macOS (launchd)

```bash
# Install service (runs every 6 hours)
npm run service:install

# Check status
npm run service:status

# Uninstall
npm run service:uninstall
```

**What it does**: Creates a LaunchAgent plist at `~/Library/LaunchAgents/com.graph-art-service.plist`

### 🐧 Linux / Ubuntu (systemd)

```bash
# Install service (runs every 6 hours)
npm run service:install

# Check status
npm run service:status
# Or manually:
systemctl --user status graph-art-service.timer

# View logs
journalctl --user -u graph-art-service.service

# Uninstall
npm run service:uninstall
```

**What it does**: Creates a systemd user service + timer at `~/.config/systemd/user/`

### 🪟 Windows (Task Scheduler)

```bash
# Install service (runs every 6 hours)
npm run service:install

# Check status
npm run service:status
# Or view in taskschd.msc

# Uninstall
npm run service:uninstall
```

**What it does**: Creates a scheduled task named `graph-art-service` via `schtasks`

---

## ⚙️ Configuration

After running `npm start` once, your settings are saved to `config.json`:

```json
{
  "text": "HELLO",
  "year": 2026,
  "commitsPerPixel": 20,
  "startWeek": 1,
  "repoPath": "/path/to/art-repo",
  "repoUrl": "git@github.com:user/art-repo.git"
}
```

You can edit this file directly if needed.

### Commit Tracking

Progress is tracked in `data/commits.json`. This allows the service to:
- **Resume** if interrupted
- **Skip** dates already completed
- **Catch up** on missed dates using backdated commits

To reset and start over:
```bash
rm data/commits.json
```

---

## 🔤 Available Characters

| Type | Characters |
|---|---|
| **Letters** | A B C D E F G H I J K L M N O P Q R S T U V W X Y Z |
| **Numbers** | 0 1 2 3 4 5 6 7 8 9 |
| **Symbols** | `!` `.` `-` `_` `(space)` `<3` (heart) |

### Character Width

| Character | Width (weeks) |
|---|---|
| Letters & Numbers | 5 + 1 gap = 6 |
| Space | 3 + 1 gap = 4 |
| `!` `.` `-` | 3 + 1 gap = 4 |
| `<3` (heart) | 7 + 1 gap = 8 |

---

## ❓ FAQ

### Won't this mess up my real contributions?

No! You should create a **separate repo** specifically for graph art. Your actual coding contributions in other repos are not affected.

### Can I write more than 8 characters?

The standard GitHub graph shows 52 weeks. At 6 weeks per character, you get ~8 standard characters. Using narrower characters (space, punctuation) allows slightly more.

### Does my computer need to be on 24/7?

**No.** All commits use `--date` to set the date retroactively. Even if your computer was off for a week, the service will catch up and create the "missed" commits when it runs again.

### Can I use this for past years?

Yes! Set the `year` in the config to any past year. GitHub shows contributions for all years.

### How do I change the text?

1. Delete `data/commits.json` to reset progress
2. Run `npm start` and enter new text
3. OR edit `config.json` directly

---

## 📄 License

MIT

---

<div align="center">
Made with ❤️ for GitHub profile art
</div>
