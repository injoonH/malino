import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
});

test('formats without Markdown and recovers browser drafts after reload', async ({ page }) => {
  await page.getByRole('button', { name: 'A fresh page', exact: false }).click();
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await editor.fill('A little thought 오늘의 기록');
  await editor.press('ControlOrMeta+a');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(editor.locator('strong')).toHaveText('A little thought 오늘의 기록');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await page.getByRole('button', { name: 'A fresh page', exact: false }).click();
  await expect(editor.locator('strong')).toHaveText('A little thought 오늘의 기록');
});

test('table controls and Markdown export work', async ({ page }) => {
  await page.getByRole('button', { name: 'A fresh page', exact: false }).click();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  await expect(page.locator('.tiptap tr')).toHaveCount(3);
  await page.getByRole('button', { name: 'Add row', exact: true }).click();
  await expect(page.locator('.tiptap tr')).toHaveCount(4);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Markdown' }).click();
  expect((await download).suggestedFilename()).toBe('malino-note.md');
});

test('Korean interface and narrow viewport remain usable', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Language / 언어' }).selectOption('ko');
  await expect(page.getByRole('button', { name: '굵게', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '이미지 URL', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '굵게', exact: true })).toBeVisible();
});

test('keeps typing offline and restores it after a reload online', async ({ page, context }) => {
  await page.getByRole('button', { name: 'A fresh page', exact: false }).click();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('textbox', { name: 'Note content' }).fill('Offline thought');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await context.setOffline(false);
  await page.reload();
  await page.getByRole('button', { name: 'A fresh page', exact: false }).click();
  await expect(page.getByRole('textbox', { name: 'Note content' })).toHaveText('Offline thought');
});
