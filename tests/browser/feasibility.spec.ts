import { test, expect } from '@playwright/test';
import { feasibilityPage } from '../../src/server/feasibility-page';

test('operator check is bounded and its report excludes identity and document contents', async ({ page }) => {
  const saves: { id: string; version: number; document: unknown }[] = [];
  let renders = 0;
  await page.route('**/operator', (route) => route.fulfill({ contentType: 'text/html', body: feasibilityPage('synthetic-test-nonce') }));
  await page.route('**/api/spike/session', (route) => route.fulfill({ json: { userId: 'private-test-identity' } }));
  await page.route('**/api/spike/save', (route) => {
    const body = route.request().postDataJSON();
    saves.push(body);
    return route.fulfill({ json: { version: body.version + 1, rowsRead: 1, rowsWritten: 1 } });
  });
  await page.route('**/api/spike/render', (route) => {
    renders++;
    return route.fulfill({ contentType: 'text/html', body: '<p>Synthetic result</p>' });
  });
  await page.goto('/operator');
  await page.getByRole('button', { name: 'Run a small performance check' }).click();
  await expect(page.getByRole('status')).toContainText('Sign-in, saves, and rendering succeeded', { timeout: 30000 });
  expect(saves).toHaveLength(20);
  expect(renders).toBe(20);
  expect(new Set(saves.map((save) => save.id)).size).toBe(4);
  expect(saves.map((save) => save.version)).toEqual(Array.from({length:20},(_,i)=>i%5));
  const report = await page.locator('#results').innerText();
  const parsed = JSON.parse(report);
  expect(parsed.cases).toHaveLength(4);
  expect(parsed.sessionSamples).toHaveLength(5);
  expect(parsed.cases[0].saveDetails).toHaveLength(5);
  expect(new Date(parsed.cases[0].renderDetails[0].startedAt).getTime()).toBeGreaterThan(new Date(parsed.cases[0].saveDetails[4].endedAt).getTime());
  expect(parsed.cases[1].documentBytes).toBeLessThanOrEqual(256 * 1024);
  expect(parsed.cases[1].documentBytes).toBeGreaterThan(255 * 1024);
  expect(report).not.toContain('private-test-identity');
  expect(report).not.toContain(saves[0].id);
  expect(report).not.toContain('A little note.');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download results' }).click();
  expect((await download).suggestedFilename()).toBe('malino-feasibility-results.json');
});

test('operator check stops on service failure without claiming success', async ({ page }) => {
  let attempts = 0;
  await page.route('**/operator', (route) => route.fulfill({ contentType: 'text/html', body: feasibilityPage('synthetic-test-nonce') }));
  await page.route('**/api/spike/session', (route) => route.fulfill({ json: { userId: 'test' } }));
  await page.route('**/api/spike/save', (route) => {
    attempts++;
    return route.fulfill({ status: 503, body: 'Unavailable' });
  });
  await page.goto('/operator');
  await page.getByRole('button', { name: 'Run a small performance check' }).click();
  await expect(page.getByRole('status')).toContainText('Request failed (503)');
  expect(attempts).toBe(1);
  await expect(page.getByRole('button', { name: 'Run a small performance check' })).toBeEnabled();
  const report = JSON.parse(await page.locator('#results').innerText());
  expect(report.error).toContain('503');
  expect(report.cases).toEqual([]);
});
