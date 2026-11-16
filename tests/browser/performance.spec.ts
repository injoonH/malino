import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, platform, release } from 'node:os';

test('records local editor timing proxies and representative screenshots', async ({ page, browser }) => {
  test.setTimeout(120000);
  const readySamples: number[] = [];
  for (let sample = 0; sample < 5; sample++) {
    const fresh = await browser.newContext();
    const tab = await fresh.newPage();
    await tab.goto('http://127.0.0.1:4173/');
    await expect(tab.locator('[data-ready="true"]')).toBeVisible();
    readySamples.push(await tab.evaluate(() => performance.getEntriesByName('malino-editor-ready')[0].startTime));
    await fresh.close();
  }
  await page.goto('/');
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/editor-desktop.png', fullPage: true });
  await page.getByText('Performance samples', { exact: true }).click();
  await page.getByRole('button', { name: 'Long note', exact: true }).click();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await editor.click();
  await editor.press('ControlOrMeta+End');
  const typing = await page.evaluate(async () => {
    // Double rAF is a paint-opportunity proxy, not a field INP measurement.
    const samples: number[] = [];
    const element = document.querySelector('.tiptap')!;
    const listener = () => {
      const start = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => samples.push(performance.now() - start)));
    };
    element.addEventListener('beforeinput', listener);
    (window as unknown as Record<string, unknown>).malinoPerf = samples;
    return { installed: true };
  });
  expect(typing.installed).toBe(true);
  for (let sample = 0; sample < 60; sample++) {
    await page.keyboard.insertText(sample % 2 ? '가' : 'a');
    await page.waitForTimeout(40);
  }
  const inputSamples = await page.evaluate(() => (window as unknown as { malinoPerf: number[] }).malinoPerf);
  expect(inputSamples.length).toBe(60);
  await page.getByRole('button', { name: '1,000 pages', exact: true }).click();
  const switchSamples: number[] = [];
  for (let i = 0; i < 20; i++) {
    switchSamples.push(await page.evaluate(async (id) => {
      const start = performance.now();
      const before = performance.getEntriesByName('malino-editor-ready').length;
      const button = [...document.querySelectorAll<HTMLButtonElement>('.many-pages button')].find((item) => item.textContent === id)!;
      button.click();
      while (performance.getEntriesByName('malino-editor-ready').length === before) await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      return performance.now() - start;
    }, `Note ${i % 2 + 1}`));
  }
  await page.getByRole('button', { name: '100-row table', exact: true }).click();
  await expect(page.locator('.tiptap tr')).toHaveCount(101);
  await page.screenshot({ path: 'artifacts/editor-table.png' });
  await page.getByRole('button', { name: 'Welcome to malino', exact: false }).click();
  await page.getByRole('button', { name: '1,000 pages', exact: true }).click();
  await page.getByText('Performance samples', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Language / 언어' }).selectOption('ko');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/editor-mobile-ko.png', fullPage: true });
  const percentile = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];
  const report = {
    generatedAt: new Date().toISOString(), browser: browser.version(), os: `${platform()} ${release()}`, cpu: cpus()[0]?.model,
    viewport: { width: 1440, height: 1000 }, network: 'loopback, unthrottled; fresh contexts for load samples',
    caveat: 'Headless local timing proxies, not real IME, mobile hardware, deployed Worker CPU, Korea latency, or field INP.',
    coldReady: { samples: readySamples, p95Ms: percentile(readySamples, .95) },
    inputToSecondRaf: { samples: inputSamples, p95Ms: percentile(inputSamples, .95), fixture: '10,000-word, 100-paragraph English/Korean note' },
    pageSwitch: { samples: switchSamples, p95Ms: percentile(switchSamples, .95), fixture: '1,000 sidebar rows; two repeatedly opened pages' },
  };
  await writeFile('artifacts/browser.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ coldReadyP95: report.coldReady.p95Ms, inputProxyP95: report.inputToSecondRaf.p95Ms, switchP95: report.pageSwitch.p95Ms }));
});
