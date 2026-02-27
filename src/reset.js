#!/usr/bin/env node

/**
 * Reset Script
 * Wipes out all tracking data, configurations, and the generated repository
 * Then immediately restarts the Graph Art Service.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');

console.log('');
console.log(chalk.red.bold('  ⚠️  Resetting Graph Art Service...'));
console.log('');

const dataDir = path.join(__dirname, '..', 'data');
const configPath = path.join(__dirname, '..', 'config.json');

// 1. Delete Tracker Data
const trackerFile = path.join(dataDir, 'commits.json');
if (fs.existsSync(trackerFile)) {
    try {
        fs.unlinkSync(trackerFile);
        console.log(chalk.gray('  - Deleted tracker data (data/commits.json)'));
    } catch (err) {
        console.error(chalk.red(`  - Failed to delete tracker data: ${err.message}`));
    }
}

// 2. Find and Delete Repo
let repoPath = path.join(__dirname, '..', 'art-repo');
if (fs.existsSync(configPath)) {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.repoPath) {
            repoPath = config.repoPath;
        }
    } catch (e) {
        // Ignore config parse errors
    }
}

if (fs.existsSync(repoPath)) {
    try {
        fs.rmSync(repoPath, { recursive: true, force: true });
        console.log(chalk.gray(`  - Deleted repository (${repoPath})`));
    } catch (err) {
        console.error(chalk.red(`  - Failed to delete repository: ${err.message}`));
    }
}

// 3. Delete config.json
if (fs.existsSync(configPath)) {
    try {
        fs.unlinkSync(configPath);
        console.log(chalk.gray('  - Deleted configuration (config.json)'));
    } catch (err) {
        console.error(chalk.red(`  - Failed to delete configuration: ${err.message}`));
    }
}

console.log('');
console.log(chalk.green.bold('  ✅ Reset complete. Starting fresh...'));
console.log('');

// 4. Start the service again
const startProcess = spawn('node', [path.join(__dirname, 'index.js')], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
});

startProcess.on('close', (code) => {
    process.exit(code);
});
