#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const [baseUrl, executablePath] = process.argv.slice(2);
assert(baseUrl, 'Usage: node tests/collect-worldgen-v1-browser-audit.cjs BASE_URL [CHROMIUM_PATH]');

async function run() {
    const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const browser = await chromium.launch({ executablePath, headless: true });
    const output = { revision, node: process.version, chromium: browser.version(), tests: [] };
    try {
        for (const [path, expected] of [['tests/worldgen-phase0-tests.html', 5], ['tests/crafting-tests.html', 270]]) {
            const page = await browser.newPage();
            const pageErrors = [];
            page.on('pageerror', error => pageErrors.push(error.message));
            const response = await page.goto(new URL(path, baseUrl).href);
            assert.equal(response.status(), 200);
            await page.waitForFunction(() => /Провалено: \d+/.test(document.querySelector('#summary')?.textContent ?? ''));
            const summary = await page.locator('#summary').textContent();
            const [total, passed, failed] = summary.match(/\d+/g).map(Number);
            assert.deepEqual([total, passed, failed], [expected, expected, 0]);
            assert.equal(await page.locator('.test.fail').count(), 0);
            assert.deepEqual(pageErrors, []);
            output.tests.push({ path, total, passed, failed, pageErrors });
            await page.close();
        }
        const page = await browser.newPage();
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200);
        const canvases = await page.locator('canvas').evaluateAll(nodes => nodes.map(node => node.id));
        assert.deepEqual(canvases, ['mapCanvas', 'gameCanvas', 'selectedCharacterPortrait']);
        assert(await page.evaluate(() => typeof window.Game?.systems?.worldgenPhase0?.createPhase0OrchestrationAdapter === 'function'));
        assert.deepEqual(pageErrors, []);
        output.gameBoot = { status: response.status(), canvases, pageErrors };
        console.log(JSON.stringify(output, null, 2));
    } finally {
        await browser.close();
    }
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
