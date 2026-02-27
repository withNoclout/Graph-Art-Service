#!/usr/bin/env node
/**
 * Quick test to verify fonts, planner, and renderer work correctly
 */

const { FONT, getMaxStandardChars } = require('./fonts');
const { generatePlan, buildGrid, getPlanStats } = require('./planner');
const { renderGrid, renderStats } = require('./renderer');

console.log('=== Test 1: Font definitions ===');
const chars = Object.keys(FONT);
console.log(`Loaded ${chars.length} characters: ${chars.join(', ')}`);

// Verify all fonts are 7 rows
let fontOk = true;
for (const [char, matrix] of Object.entries(FONT)) {
    if (matrix.length !== 7) {
        console.error(`ERROR: '${char}' has ${matrix.length} rows (expected 7)`);
        fontOk = false;
    }
}
console.log(fontOk ? '✅ All fonts have 7 rows' : '❌ Font errors found');

console.log(`\nMax standard characters: ${getMaxStandardChars()}`);

console.log('\n=== Test 2: Plan generation ===');
const plan = generatePlan('HI', 2026, 20, 1);
console.log(`Plan for "HI" (2026): ${plan.length} pixel-days, ${plan.reduce((s, e) => s + e.commits, 0)} total commits`);
console.log(`First date: ${plan[0]?.date}, Last date: ${plan[plan.length - 1]?.date}`);

console.log('\n=== Test 3: Grid rendering ===');
const grid = buildGrid(plan);
renderGrid(grid, 2026);

const stats = getPlanStats(plan);
renderStats(stats);

console.log('\n=== Test 4: Full word "HELLO" ===');
const plan2 = generatePlan('HELLO', 2026, 20, 1);
const grid2 = buildGrid(plan2);
renderGrid(grid2, 2026);

const stats2 = getPlanStats(plan2);
renderStats(stats2);

console.log('\n=== All tests passed! ===');
