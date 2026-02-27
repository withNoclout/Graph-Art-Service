/**
 * Committer Module
 * Handles the actual git commit operations with backdated dates
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Initialize or validate the contribution repo
 * @param {string} repoPath - Path to the local repo
 * @param {string} repoUrl - Remote URL (optional, for cloning)
 */
function initRepo(repoPath, repoUrl) {
    if (!fs.existsSync(repoPath)) {
        if (repoUrl) {
            console.log(`📥 Cloning repo from ${repoUrl}...`);
            execSync(`git clone ${repoUrl} "${repoPath}"`, { stdio: 'pipe' });
        } else {
            console.log(`📁 Creating new repo at ${repoPath}...`);
            fs.mkdirSync(repoPath, { recursive: true });
            execSync('git init', { cwd: repoPath, stdio: 'pipe' });
        }
    }

    // Ensure .contribution file exists
    const artFile = path.join(repoPath, '.contribution');
    if (!fs.existsSync(artFile)) {
        fs.writeFileSync(artFile, '# Contribution Graph Art\n');
        execSync('git add .contribution', { cwd: repoPath, stdio: 'pipe' });
        execSync('git commit -m "init: contribution art repo"', { cwd: repoPath, stdio: 'pipe' });
    }
}

/**
 * Make N commits for a specific date
 * @param {string} repoPath - Path to the local repo
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {number} count - Number of commits to make
 * @param {string} charLabel - Character being drawn (for commit message)
 * @param {boolean} dryRun - If true, don't actually commit
 * @returns {number} Number of commits made
 */
function makeCommits(repoPath, date, count, charLabel = '', dryRun = false) {
    const artFile = path.join(repoPath, '.contribution');
    let committed = 0;

    for (let i = 0; i < count; i++) {
        // Create a unique timestamp for each commit on the same day
        const hour = String(Math.floor((i / count) * 23)).padStart(2, '0');
        const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
        const second = String(Math.floor(Math.random() * 60)).padStart(2, '0');
        const dateTime = `${date}T${hour}:${minute}:${second}`;

        const message = charLabel
            ? `art: pixel for '${charLabel}' [${i + 1}/${count}]`
            : `art: contribution ${i + 1}/${count}`;

        if (dryRun) {
            committed++;
            continue;
        }

        try {
            // Append a tiny change
            const content = `${dateTime} | commit ${i + 1}/${count} for '${charLabel}'\n`;
            fs.appendFileSync(artFile, content);

            // Stage and commit with specific date
            execSync('git add .contribution', { cwd: repoPath, stdio: 'pipe' });
            execSync(
                `GIT_AUTHOR_DATE="${dateTime}" GIT_COMMITTER_DATE="${dateTime}" git commit -m "${message}"`,
                { cwd: repoPath, stdio: 'pipe', env: { ...process.env } }
            );

            committed++;
        } catch (err) {
            console.error(`  ❌ Failed commit ${i + 1}/${count} for ${date}: ${err.message}`);
        }
    }

    return committed;
}

/**
 * Push commits to remote
 * @param {string} repoPath - Path to the local repo
 */
function pushToRemote(repoPath) {
    try {
        execSync('git push', { cwd: repoPath, stdio: 'pipe' });
        return true;
    } catch (err) {
        // Try setting upstream
        try {
            execSync('git push -u origin main', { cwd: repoPath, stdio: 'pipe' });
            return true;
        } catch (err2) {
            try {
                execSync('git push -u origin master', { cwd: repoPath, stdio: 'pipe' });
                return true;
            } catch (err3) {
                console.error(`  ❌ Failed to push: ${err3.message}`);
                return false;
            }
        }
    }
}

module.exports = { initRepo, makeCommits, pushToRemote };
