/**
 * Planner Module
 * Converts text + year into a list of { date, commits } entries
 * Maps pixel font characters onto the GitHub contribution graph grid
 */

const { FONT, getCharWidth } = require('./fonts');

/**
 * Get the first Sunday of the year (start of contribution graph)
 * GitHub graph starts from the first Sunday on or before Jan 1
 */
function getGraphStartDate(year) {
    const jan1 = new Date(year, 0, 1);
    const dayOfWeek = jan1.getDay(); // 0 = Sunday
    // Go back to previous Sunday if Jan 1 is not Sunday
    const startDate = new Date(jan1);
    startDate.setDate(jan1.getDate() - dayOfWeek);
    return startDate;
}

/**
 * Convert a week/day offset to an actual date
 * @param {Date} graphStart - First Sunday of the graph
 * @param {number} week - Week index (0-based, column)
 * @param {number} day - Day index (0-6, row, Sunday=0)
 * @returns {Date}
 */
function offsetToDate(graphStart, week, day) {
    const date = new Date(graphStart);
    date.setDate(graphStart.getDate() + week * 7 + day);
    return date;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Generate the full commit plan for a text
 * @param {string} text - Text to draw
 * @param {number} year - Target year
 * @param {number} commitsPerPixel - Number of commits per filled pixel (default 20)
 * @param {number} startWeek - Week offset to start drawing (default 0)
 * @param {number|null} globalBackgroundLevel - The target total commits for background padding (e.g. 45)
 * @param {Object} scrapedExisting - Existing commits scraped from GitHub { 'YYYY-MM-DD': count }
 * @returns {Array<{date: string, commits: number, char: string, row: number, col: number}>}
 */
function generatePlan(text, year, commitsPerPixel = 20, startWeek = 0, globalBackgroundLevel = null, scrapedExisting = {}) {
    // Generate text pixels first
    const graphStart = getGraphStartDate(year);
    const upperText = text.toUpperCase();
    const textPlanMap = new Map(); // Store text pixels by date

    let currentWeek = startWeek;

    for (let ci = 0; ci < upperText.length; ci++) {
        const char = upperText[ci];

        // Handle special multi-char symbols
        let charKey = char;
        if (char === '<' && ci + 1 < upperText.length && upperText[ci + 1] === '3') {
            charKey = '<3';
            ci++; // skip the '3'
        }

        const matrix = FONT[charKey];
        if (!matrix) {
            console.warn(`Warning: Character '${charKey}' not found in font, skipping`);
            continue;
        }

        const charWidth = matrix[0].length;

        // Check if character fits within 52 weeks
        if (currentWeek + charWidth > 53) {
            console.warn(`Warning: Text too long, stopping at character '${charKey}'`);
            break;
        }

        // Map each pixel
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < charWidth; col++) {
                if (matrix[row][col] === 1) {
                    const date = offsetToDate(graphStart, currentWeek + col, row);
                    const dateStr = formatDate(date);

                    // Only include dates within the target year
                    if (date.getFullYear() === year) {
                        textPlanMap.set(dateStr, {
                            date: dateStr,
                            isText: true,
                            char: charKey,
                            row,
                            col: currentWeek + col,
                        });
                    }
                }
            }
        }

        currentWeek += charWidth + 1; // +1 for gap between characters
    }

    const plan = [];

    // If globalBackgroundLevel is set, we need to iterate over all 365 days
    if (globalBackgroundLevel !== null) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDate(d);
            const existing = scrapedExisting[dateStr] || 0;
            const textEntry = textPlanMap.get(dateStr);

            // Calculate total target for this day
            // Background day: needs to reach globalBackgroundLevel
            // Text day: needs to reach globalBackgroundLevel + commitsPerPixel
            const targetLevel = textEntry ? (globalBackgroundLevel + commitsPerPixel) : globalBackgroundLevel;

            const neededCommits = Math.max(0, targetLevel - existing);

            if (neededCommits > 0) {
                plan.push({
                    date: dateStr,
                    commits: neededCommits,
                    char: textEntry ? textEntry.char : 'bg',
                    row: textEntry ? textEntry.row : -1,
                    col: textEntry ? textEntry.col : -1,
                });
            }
        }
    } else {
        // No background padding, just use the text pixels
        for (const [dateStr, entry] of textPlanMap.entries()) {
            plan.push({
                date: entry.date,
                commits: commitsPerPixel,
                char: entry.char,
                row: entry.row,
                col: entry.col,
            });
        }
    }

    // Sort by date
    plan.sort((a, b) => a.date.localeCompare(b.date));

    return plan;
}

/**
 * Build a 7×53 grid matrix for visualization
 */
function buildGrid(plan) {
    const grid = Array.from({ length: 7 }, () => Array(53).fill(0));

    for (const entry of plan) {
        if (entry.row >= 0 && entry.row < 7 && entry.col >= 0 && entry.col < 53) {
            grid[entry.row][entry.col] = entry.commits;
        }
    }

    return grid;
}

/**
 * Get summary statistics for the plan
 */
function getPlanStats(plan) {
    const totalDays = plan.length;
    const totalCommits = plan.reduce((sum, e) => sum + e.commits, 0);
    const uniqueChars = [...new Set(plan.map(e => e.char))];
    const dateRange = plan.length > 0
        ? { start: plan[0].date, end: plan[plan.length - 1].date }
        : { start: 'N/A', end: 'N/A' };

    return { totalDays, totalCommits, uniqueChars, dateRange };
}

module.exports = { generatePlan, buildGrid, getPlanStats, getGraphStartDate, formatDate };
