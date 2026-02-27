/**
 * Tracker Module
 * Tracks which commits have been made to enable catch-up and resumption
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_DATA_DIR = path.join(__dirname, '..', 'data');
const TRACKER_FILE = 'commits.json';

/**
 * Load the tracker data
 * @param {string} dataDir - Directory to store tracker data
 * @returns {Object} Tracker data
 */
function loadTracker(dataDir = DEFAULT_DATA_DIR) {
    const filePath = path.join(dataDir, TRACKER_FILE);

    if (!fs.existsSync(filePath)) {
        return { completed: {}, lastRun: null, text: null, year: null };
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
        return { completed: {}, lastRun: null, text: null, year: null };
    }
}

/**
 * Save tracker data
 * @param {Object} data - Tracker data
 * @param {string} dataDir - Directory to store tracker data
 */
function saveTracker(data, dataDir = DEFAULT_DATA_DIR) {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, TRACKER_FILE);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Mark a date as completed
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {number} commits - Number of commits made
 * @param {string} dataDir - Directory to store tracker data
 */
function markCompleted(date, commits, dataDir = DEFAULT_DATA_DIR) {
    const data = loadTracker(dataDir);
    data.completed[date] = { commits, completedAt: new Date().toISOString() };
    data.lastRun = new Date().toISOString();
    saveTracker(data, dataDir);
}

/**
 * Get pending entries (planned but not completed)
 * @param {Array} plan - The full plan
 * @param {string} dataDir - Directory to store tracker data
 * @returns {Array} Pending plan entries
 */
function getPending(plan, dataDir = DEFAULT_DATA_DIR) {
    const data = loadTracker(dataDir);
    return plan.map(entry => {
        const done = data.completed[entry.date] ? data.completed[entry.date].commits : 0;
        return {
            ...entry,
            pendingCommits: Math.max(0, entry.commits - done),
            doneCommits: done
        };
    }).filter(entry => entry.pendingCommits > 0);
}

/**
 * Reset the tracker
 * @param {string} dataDir - Directory to store tracker data
 */
function resetTracker(dataDir = DEFAULT_DATA_DIR) {
    const filePath = path.join(dataDir, TRACKER_FILE);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

module.exports = { loadTracker, saveTracker, markCompleted, getPending, resetTracker };
