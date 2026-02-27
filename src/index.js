#!/usr/bin/env node

/**
 * Graph Art Service — Main CLI Entry Point
 * Interactive CLI for creating GitHub contribution graph art
 * 
 * Usage:
 *   node src/index.js              # Interactive mode
 *   node src/index.js --preview    # Quick preview mode
 *   node src/index.js --plan       # Show plan details
 *   node src/index.js --run        # Execute commits (non-interactive)
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { FONT, getMaxStandardChars } = require('./fonts');
const { generatePlan, buildGrid, getPlanStats } = require('./planner');
const { renderGrid, renderStats } = require('./renderer');
const { initRepo, makeCommits, pushToRemote } = require('./committer');
const { loadTracker, saveTracker, markCompleted, getPending, resetTracker } = require('./tracker');

// ─── Banner ──────────────────────────────────────────────────────────
function printBanner() {
    console.log('');
    console.log(chalk.hex('#26a641').bold('  ╔══════════════════════════════════════════╗'));
    console.log(chalk.hex('#26a641').bold('  ║                                          ║'));
    console.log(chalk.hex('#26a641').bold('  ║') + chalk.white.bold('   🎨 GitHub Contribution Graph Art      ') + chalk.hex('#26a641').bold('║'));
    console.log(chalk.hex('#26a641').bold('  ║') + chalk.gray('   Draw text on your GitHub profile       ') + chalk.hex('#26a641').bold('║'));
    console.log(chalk.hex('#26a641').bold('  ║                                          ║'));
    console.log(chalk.hex('#26a641').bold('  ╚══════════════════════════════════════════╝'));
    console.log('');
}

// ─── Available Characters Display ────────────────────────────────────
function showAvailableChars() {
    const chars = Object.keys(FONT).filter(c => c !== '<3');
    console.log(chalk.gray('  Available characters:'));
    console.log(chalk.cyan(`  ${chars.join(' ')}`));
    console.log(chalk.cyan('  <3') + chalk.gray(' (heart symbol)'));
    console.log('');
}

// ─── Config Management ──────────────────────────────────────────────
function loadConfig() {
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return null;
}

function saveConfig(config) {
    const configPath = path.join(__dirname, '..', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// ─── Interactive Mode ───────────────────────────────────────────────
async function interactiveMode() {
    printBanner();

    const existingConfig = loadConfig();
    const maxChars = getMaxStandardChars();
    const currentYear = new Date().getFullYear();

    // Show available characters
    showAvailableChars();

    // Step 1: Get text input
    const { text } = await inquirer.prompt([
        {
            type: 'input',
            name: 'text',
            message: chalk.cyan(`Enter text to draw (max ${maxChars} characters):`),
            default: existingConfig?.text || '',
            validate: (input) => {
                if (!input || input.trim().length === 0) {
                    return 'Please enter at least 1 character';
                }
                const upper = input.toUpperCase().trim();
                // Check character limit
                if (upper.length > maxChars) {
                    return `Text is too long! Maximum ${maxChars} characters (you entered ${upper.length})`;
                }
                // Check all characters are supported
                for (let i = 0; i < upper.length; i++) {
                    const char = upper[i];
                    if (char === '<' && i + 1 < upper.length && upper[i + 1] === '3') {
                        i++; // skip heart
                        continue;
                    }
                    if (!FONT[char]) {
                        return `Character '${char}' is not supported. Use A-Z, 0-9, space, or special: ! . - _`;
                    }
                }
                return true;
            },
        },
    ]);

    // Step 2: Get year
    const { year } = await inquirer.prompt([
        {
            type: 'number',
            name: 'year',
            message: chalk.cyan('Target year:'),
            default: existingConfig?.year || currentYear,
            validate: (input) => {
                if (input < 2000 || input > 2100) return 'Please enter a valid year (2000-2100)';
                return true;
            },
        },
    ]);

    // Step 3: Commits per pixel
    const { commitsPerPixel } = await inquirer.prompt([
        {
            type: 'number',
            name: 'commitsPerPixel',
            message: chalk.cyan('Commits per pixel (determines color intensity):'),
            default: existingConfig?.commitsPerPixel || 20,
            validate: (input) => {
                if (input < 1 || input > 50) return 'Please enter 1-50';
                return true;
            },
        },
    ]);

    // Step 4: Start week offset
    const { startWeek } = await inquirer.prompt([
        {
            type: 'number',
            name: 'startWeek',
            message: chalk.cyan('Start from week (0 = beginning of year):'),
            default: existingConfig?.startWeek || 1,
            validate: (input) => {
                if (input < 0 || input > 52) return 'Please enter 0-52';
                return true;
            },
        },
    ]);

    // Step 5: Batch Limit
    const { batchLimit } = await inquirer.prompt([
        {
            type: 'number',
            name: 'batchLimit',
            message: chalk.cyan('Max commits per run (0 for no limit, 900 to bypass GitHub limits securely):'),
            default: existingConfig?.batchLimit !== undefined ? existingConfig.batchLimit : 900,
            validate: (input) => {
                if (input < 0) return 'Please enter 0 or a positive number';
                return true;
            },
        },
    ]);

    // Step 6: Repo path  
    const defaultRepoPath = existingConfig?.repoPath || path.join(process.cwd(), 'art-repo');
    const { repoPath } = await inquirer.prompt([
        {
            type: 'input',
            name: 'repoPath',
            message: chalk.cyan('Path to the contribution repo (will be created if needed):'),
            default: defaultRepoPath,
        },
    ]);

    // Step 7: Remote URL
    const { repoUrl } = await inquirer.prompt([
        {
            type: 'input',
            name: 'repoUrl',
            message: chalk.cyan('Git remote URL (leave empty to skip push):'),
            default: existingConfig?.repoUrl || '',
        },
    ]);

    // Generate plan and show preview
    const plan = generatePlan(text.trim(), year, commitsPerPixel, startWeek);
    const grid = buildGrid(plan);
    const stats = getPlanStats(plan);

    console.log('');
    console.log(chalk.bold.yellow('  ⚡ Preview of your contribution graph:'));
    renderGrid(grid, year);
    renderStats(stats);
    renderStats(stats);
    // Step 8: Confirmation
    const { confirmed } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.yellow.bold(`\n  Are you sure you want to proceed? This will create ${stats.totalCommits} commits.\n`),
            default: false,
        },
    ]);

    if (!confirmed) {
        console.log(chalk.gray('\n  Cancelled. No commits were made.\n'));
        return;
    }

    // Save config for future use
    const config = {
        text: text.trim(),
        year,
        commitsPerPixel,
        startWeek,
        batchLimit,
        repoPath,
        repoUrl,
    };
    saveConfig(config);

    // Execute!
    await executeCommits(config, plan);
}

// ─── Execute Commits ────────────────────────────────────────────────
async function executeCommits(config, plan) {
    const { repoPath, repoUrl } = config;

    console.log('');
    console.log(chalk.bold.white('  🚀 Starting commit execution...'));
    console.log('');

    // Initialize repo
    initRepo(repoPath, repoUrl);

    // Get pending commits
    const dataDir = path.join(__dirname, '..', 'data');
    const pending = getPending(plan, dataDir);

    if (pending.length === 0) {
        console.log(chalk.green('  ✅ All commits are already completed!'));
        console.log('');
        return;
    }

    console.log(chalk.cyan(`  📋 ${pending.length} days remaining (${pending.reduce((s, e) => s + e.commits, 0)} commits)`));
    console.log('');

    // Process each pending date
    let completed = 0;
    const total = pending.length;
    let commitsThisRun = 0;
    const batchLimit = config.batchLimit || 0; // 0 means no limit
    let hitLimit = false;

    for (const entry of pending) {
        if (batchLimit > 0 && commitsThisRun + entry.commits > batchLimit) {
            console.log(`\n\n  ⏸  ${chalk.yellow('Batch limit of ' + batchLimit + ' reached.')}`);
            console.log(chalk.gray('      Run ' + chalk.white('npm start') + ' again later to resume the remaining ' + (total - completed) + ' days.'));
            hitLimit = true;
            break;
        }

        const progress = Math.round((completed / total) * 100);
        const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));

        process.stdout.write(
            `\r  [${chalk.green(bar)}] ${progress}% | ${chalk.white(entry.date)} | '${chalk.cyan(entry.char)}' | ${completed}/${total}`
        );

        const commitsMade = makeCommits(repoPath, entry.date, entry.commits, entry.char);
        markCompleted(entry.date, commitsMade, dataDir);
        commitsThisRun += commitsMade;
        completed++;
    }

    // Final progress if completed fully
    if (!hitLimit) {
        process.stdout.write(
            `\r  [${chalk.green('█'.repeat(20))}] 100% | ${chalk.white('Done!')}${''.padEnd(40)}\n`
        );
        console.log('');
        console.log(chalk.green.bold(`  ✅ Completed all ${plan.reduce((s, e) => s + e.commits, 0)} commits across ${plan.length} days`));
    } else {
        console.log('');
        console.log(chalk.yellow.bold(`  ⏸ Paused after ${commitsThisRun} commits across ${completed} days`));
    }

    // Push to remote
    if (config.repoUrl) {
        console.log('');
        console.log(chalk.cyan('  📤 Pushing to remote...'));
        const pushed = pushToRemote(repoPath);
        if (pushed) {
            console.log(chalk.green('  ✅ Successfully pushed to remote!'));
        } else {
            console.log(chalk.yellow('  ⚠️  Failed to push. You can push manually: cd ' + repoPath + ' && git push'));
        }
    }

    console.log('');
}

// ─── Quick Preview Mode ─────────────────────────────────────────────
async function previewMode() {
    printBanner();

    const config = loadConfig();
    if (!config) {
        console.log(chalk.yellow('  No config found. Run in interactive mode first: npm start'));
        return;
    }

    const plan = generatePlan(config.text, config.year, config.commitsPerPixel, config.startWeek);
    const grid = buildGrid(plan);
    const stats = getPlanStats(plan);

    renderGrid(grid, config.year);
    renderStats(stats);
}

// ─── Plan Mode ──────────────────────────────────────────────────────
async function planMode() {
    printBanner();

    const config = loadConfig();
    if (!config) {
        console.log(chalk.yellow('  No config found. Run in interactive mode first: npm start'));
        return;
    }

    const plan = generatePlan(config.text, config.year, config.commitsPerPixel, config.startWeek);
    const stats = getPlanStats(plan);

    console.log(chalk.bold.white(`  📅 Commit Plan for "${config.text}" (${config.year})`));
    console.log('');

    // Group by month
    const byMonth = {};
    for (const entry of plan) {
        const month = entry.date.substring(0, 7);
        if (!byMonth[month]) byMonth[month] = [];
        byMonth[month].push(entry);
    }

    for (const [month, entries] of Object.entries(byMonth)) {
        console.log(chalk.cyan(`  ${month}:`));
        for (const e of entries) {
            console.log(chalk.gray(`    ${e.date} → ${e.commits} commits (char: '${e.char}')`));
        }
    }

    console.log('');
    renderStats(stats);
}

// ─── Run Mode (non-interactive, uses saved config) ──────────────────
async function runMode() {
    printBanner();

    const config = loadConfig();
    if (!config) {
        console.log(chalk.yellow('  No config found. Run in interactive mode first: npm start'));
        return;
    }

    console.log(chalk.cyan(`  🔄 Running with saved config: "${config.text}" (${config.year})`));

    const plan = generatePlan(config.text, config.year, config.commitsPerPixel, config.startWeek);
    await executeCommits(config, plan);
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--preview') || args.includes('-p')) {
        await previewMode();
    } else if (args.includes('--plan') || args.includes('-l')) {
        await planMode();
    } else if (args.includes('--run') || args.includes('-r')) {
        await runMode();
    } else if (args.includes('--help') || args.includes('-h')) {
        printBanner();
        console.log(chalk.white('  Usage:'));
        console.log(chalk.gray('    npm start           ') + chalk.white('Interactive mode (recommended)'));
        console.log(chalk.gray('    npm run preview     ') + chalk.white('Show preview of current config'));
        console.log(chalk.gray('    npm run plan        ') + chalk.white('Show detailed commit plan'));
        console.log(chalk.gray('    npm run run         ') + chalk.white('Execute commits (non-interactive)'));
        console.log('');
        console.log(chalk.white('  Flags:'));
        console.log(chalk.gray('    --preview, -p       ') + chalk.white('Preview mode'));
        console.log(chalk.gray('    --plan, -l          ') + chalk.white('Plan mode'));
        console.log(chalk.gray('    --run, -r           ') + chalk.white('Run mode'));
        console.log(chalk.gray('    --help, -h          ') + chalk.white('Show this help'));
        console.log('');
    } else {
        await interactiveMode();
    }
}

main().catch(err => {
    console.error(chalk.red(`\n  ❌ Error: ${err.message}\n`));
    process.exit(1);
});
