#!/usr/bin/env node

/**
 * Reset Script
 * Wipes out all tracking data, configurations, the local repo,
 * AND force-pushes a clean state to the remote repo.
 * Then immediately restarts the Graph Art Service.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');

console.log('');
console.log(chalk.red.bold('  ⚠️  Resetting Graph Art Service...'));
console.log('');

const dataDir = path.join(__dirname, '..', 'data');
const configPath = path.join(__dirname, '..', 'config.json');

// 1. Read config to find repoPath and repoUrl before deleting
let repoPath = path.join(__dirname, '..', 'art-repo');
let repoUrl = '';
if (fs.existsSync(configPath)) {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.repoPath) repoPath = config.repoPath;
        if (config.repoUrl) repoUrl = config.repoUrl;
    } catch (e) {
        // Ignore config parse errors
    }
}

// 2. Delete Tracker Data
const trackerFile = path.join(dataDir, 'commits.json');
if (fs.existsSync(trackerFile)) {
    try {
        fs.unlinkSync(trackerFile);
        console.log(chalk.gray('  ✓ Deleted tracker data (data/commits.json)'));
    } catch (err) {
        console.error(chalk.red(`  ✗ Failed to delete tracker data: ${err.message}`));
    }
} else {
    console.log(chalk.gray('  - No tracker data found (already clean)'));
}

// 3. Delete local repo
if (fs.existsSync(repoPath)) {
    try {
        fs.rmSync(repoPath, { recursive: true, force: true });
        console.log(chalk.gray(`  ✓ Deleted local repository (${path.basename(repoPath)})`));
    } catch (err) {
        console.error(chalk.red(`  ✗ Failed to delete repository: ${err.message}`));
    }
} else {
    console.log(chalk.gray('  - No local repository found (already clean)'));
}

// 4. Force-push a clean state to the remote (MOST IMPORTANT!)
if (repoUrl) {
    console.log('');
    console.log(chalk.yellow(`  🧹 Cleaning remote repository: ${repoUrl}`));
    try {
        // Create a fresh temporary repo
        const tempDir = path.join(__dirname, '..', '.temp-reset-repo');
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        fs.mkdirSync(tempDir, { recursive: true });

        execSync('git init', { cwd: tempDir, stdio: 'pipe' });
        execSync('git checkout -b main', { cwd: tempDir, stdio: 'pipe' });

        // Create a single initial commit
        fs.writeFileSync(path.join(tempDir, '.contribution'), '# Contribution Graph Art\n');
        execSync('git add .contribution', { cwd: tempDir, stdio: 'pipe' });
        execSync('git commit -m "init: clean slate"', { cwd: tempDir, stdio: 'pipe' });

        // Add remote and force push to overwrite all old commits
        execSync(`git remote add origin ${repoUrl}`, { cwd: tempDir, stdio: 'pipe' });
        execSync('git push --force origin main', { cwd: tempDir, stdio: 'pipe' });

        console.log(chalk.green('  ✓ Remote repository cleaned (force-pushed clean state)'));

        // Remove temp dir
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
        console.log(chalk.yellow(`  ⚠ Could not clean remote: ${err.message}`));
        console.log(chalk.yellow('    You may need to delete and recreate the remote repo manually.'));
    }
}

// 5. Delete config.json
if (fs.existsSync(configPath)) {
    try {
        fs.unlinkSync(configPath);
        console.log(chalk.gray('  ✓ Deleted configuration (config.json)'));
    } catch (err) {
        console.error(chalk.red(`  ✗ Failed to delete configuration: ${err.message}`));
    }
} else {
    console.log(chalk.gray('  - No configuration found (already clean)'));
}

console.log('');
console.log(chalk.green.bold('  ✅ Full reset complete. Starting fresh...'));
console.log('');

// 6. Start the service again
const startProcess = spawn('node', [path.join(__dirname, 'index.js')], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
});

startProcess.on('close', (code) => {
    process.exit(code);
});
