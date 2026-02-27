const https = require('https');
const cheerio = require('cheerio');
const chalk = require('chalk');

/**
 * Scrape a user's GitHub contribution graph for a specific year
 * @param {string} username - GitHub username
 * @param {number} year - Target year
 * @returns {Promise<Object>} Object containing daily commits map and the max commits found
 */
async function scrapeContributions(username, year) {
    return new Promise((resolve, reject) => {
        const url = `https://github.com/users/${username}/contributions?from=${year}-01-01&to=${year}-12-31`;

        console.log(chalk.gray(`  🔍 Analyzing existing contributions for ${username} in ${year}...`));

        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Node.js/Graph-Art-Service)',
                'Accept': 'text/html'
            }
        }, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Failed to fetch from GitHub (Status Code ${res.statusCode})`));
            }

            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const $ = cheerio.load(data);
                    const days = {};
                    let maxCommits = 0;

                    // GitHub uses <td class="ContributionCalendar-day" data-date="YYYY-MM-DD" ...>
                    // The text inside the tool-tip (or data-level attribute) describes the commit count
                    // Alternatively, we can parse the <tool-tip> elements linking to the td IDs

                    // As of late 2023, GitHub's SVG calendar uses tooltips for the actual counts.
                    // The easiest and most reliable way to extract the count is parsing the tooltip text.
                    $('tool-tip').each((i, el) => {
                        const forAttr = $(el).attr('for');
                        if (!forAttr || !forAttr.startsWith('contribution-day-component-')) return;

                        const text = $(el).text().trim();
                        // Text format: "No contributions on January 1, 2024" or "15 contributions on January 2, 2024"
                        let count = 0;
                        if (!text.toLowerCase().startsWith('no ')) {
                            const match = text.match(/^([\d,]+)\s+contribution/i);
                            if (match) {
                                count = parseInt(match[1].replace(/,/g, ''), 10);
                            }
                        }

                        // Now find the corresponding <td> to get the date
                        const dateCell = $(`#${forAttr}`);
                        if (dateCell.length) {
                            const dateStr = dateCell.attr('data-date');
                            if (dateStr) {
                                days[dateStr] = count;
                                if (count > maxCommits) {
                                    maxCommits = count;
                                }
                            }
                        }
                    });

                    // If tooltip parsing failed or layout changed, fallback to data-level parsing (less accurate, usually 0-4)
                    if (Object.keys(days).length === 0) {
                        console.log(chalk.yellow('  ⚠️  Warning: Could not parse exact tooltips. GitHub layout may have changed.'));
                        resolve({ days: {}, maxCommits: 0 });
                        return;
                    }

                    resolve({ days, maxCommits });
                } catch (e) {
                    reject(new Error(`HTML Parsing error: ${e.message}`));
                }
            });
        }).on('error', (err) => {
            reject(new Error(`Network error: ${err.message}`));
        });
    });
}

module.exports = {
    scrapeContributions
};
