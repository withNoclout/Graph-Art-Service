/**
 * Renderer Module
 * Renders the contribution graph preview in the terminal
 */

const chalk = require('chalk');

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

/**
 * Render a colored block based on commit intensity
 */
function getBlock(commits) {
    if (commits === 0) return chalk.gray('░░');
    if (commits <= 4) return chalk.green('▓▓');
    if (commits <= 9) return chalk.greenBright('▓▓');
    if (commits <= 14) return chalk.hex('#2ea043')('██');
    return chalk.hex('#26a641')('██'); // max intensity
}

/**
 * Render the contribution graph to terminal
 * @param {number[][]} grid - 7×53 matrix of commit counts
 * @param {number} year - The year for month labels
 */
function renderGrid(grid, year) {
    const { getGraphStartDate } = require('./planner');
    const graphStart = getGraphStartDate(year);

    console.log('');
    console.log(chalk.bold.white(`  📊 GitHub Contribution Graph Preview — ${year}`));
    console.log('');

    // Month labels row
    let monthRow = '     ';
    let lastMonth = -1;
    for (let week = 0; week < 53; week++) {
        const date = new Date(graphStart);
        date.setDate(graphStart.getDate() + week * 7);
        const month = date.getMonth();
        if (month !== lastMonth) {
            monthRow += MONTH_LABELS[month] + ' ';
            lastMonth = month;
        } else {
            monthRow += '   ';
        }
    }
    console.log(chalk.gray(monthRow));

    // Grid rows
    for (let row = 0; row < 7; row++) {
        let line = chalk.gray(` ${DAY_LABELS[row]} `);
        for (let col = 0; col < 53; col++) {
            line += getBlock(grid[row][col]);
        }
        console.log(line);
    }

    console.log('');

    // Legend
    const legend = '  ' +
        chalk.gray('Less ') +
        chalk.gray('░░') + ' ' +
        chalk.green('▓▓') + ' ' +
        chalk.greenBright('▓▓') + ' ' +
        chalk.hex('#2ea043')('██') + ' ' +
        chalk.hex('#26a641')('██') +
        chalk.gray(' More');
    console.log(legend);
    console.log('');
}

/**
 * Render plan statistics
 */
function renderStats(stats) {
    console.log(chalk.bold.white('  📈 Plan Statistics'));
    console.log(chalk.gray('  ─────────────────────────────────'));
    console.log(`  ${chalk.cyan('Total commit days:')}  ${chalk.white(stats.totalDays)}`);
    console.log(`  ${chalk.cyan('Total commits:')}      ${chalk.white(stats.totalCommits)}`);
    console.log(`  ${chalk.cyan('Characters:')}         ${chalk.white(stats.uniqueChars.join(', '))}`);
    console.log(`  ${chalk.cyan('Date range:')}         ${chalk.white(stats.dateRange.start)} → ${chalk.white(stats.dateRange.end)}`);
    console.log('');
}

/**
 * Render a simple text representation (no colors, for logs)
 */
function renderGridPlain(grid) {
    const lines = [];
    for (let row = 0; row < 7; row++) {
        let line = `${DAY_LABELS[row]} `;
        for (let col = 0; col < 53; col++) {
            line += grid[row][col] > 0 ? '██' : '░░';
        }
        lines.push(line);
    }
    return lines.join('\n');
}

module.exports = { renderGrid, renderStats, renderGridPlain, printBanner };
