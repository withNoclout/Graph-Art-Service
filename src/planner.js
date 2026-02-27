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
 * @returns {Array<{date: string, commits: number, char: string, row: number, col: number}>}
 */
function generatePlan(text, year, commitsPerPixel = 20, startWeek = 0) {
    const graphStart = getGraphStartDate(year);
    const upperText = text.toUpperCase();
    const plan = [];

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
                        plan.push({
                            date: dateStr,
                            commits: commitsPerPixel,
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
