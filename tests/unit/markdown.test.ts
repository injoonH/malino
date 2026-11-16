import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import { importMarkdown, exportMarkdown, validateDocument } from '../../src/client/editor/markdown';
import { editorExtensions } from '../../src/client/editor/extensions';
import { largeNote, largeTable } from '../../src/client/editor/fixtures';

const fixtures = {
  korean: '# 오늘의 기록\n\n안녕하세요. **중요한 생각**과 *작은 메모*를 남겨요.\n\n~~지운 내용~~과 `코드`.',
  lists: '- 첫 번째\n  - 중첩 항목\n- 두 번째\n\n1. One\n2. Two\n\n- [x] Finished\n- [ ] Pending',
  table: '| 이름 | 내용 |\n| --- | --- |\n| 한국어 | **중요** |\n| Link | [site](https://example.com) |',
  escapes: 'Escaped \\*stars\\*, \\[brackets\\], and a backslash \\\\.',
  code: '```typescript\nconst sample = "<script>not HTML</script>";\n```\n\n> A quote\n\n---',
  image: '![한국의 풍경](https://example.com/landscape.png "Landscape")',
  link: '[A link](https://example.com/path?q=one&lang=ko "Title")',
};

describe('supported Markdown round trips', () => {
  for (const [name, source] of Object.entries(fixtures)) {
    it(`preserves structured content: ${name}`, () => {
      const parsed = importMarkdown(source);
      expect(importMarkdown(exportMarkdown(parsed))).toEqual(parsed);
    });
  }
  it('preserves 100 table rows', () => {
    const parsed = importMarkdown(exportMarkdown(largeTable));
    expect(parsed.content?.[0].content).toHaveLength(101);
  });
  it('accepts the large Korean/English note fixture', () => {
    expect(validateDocument(largeNote).content).toHaveLength(100);
  });
});

describe('untrusted content', () => {
  it.each(['<script>alert(1)</script>', '<img src="https://example.com/a.png" onerror="alert(1)">', 'text <b>HTML</b>'])('rejects raw HTML: %s', (source) => {
    expect(() => importMarkdown(source)).toThrow('Raw HTML');
  });
  it.each(['javascript:alert(1)', 'data:image/png;base64,abc', 'http://example.com/a.png'])('rejects unsafe image %s', (src) => {
    expect(() => validateDocument({ type: 'doc', content: [{ type: 'image', attrs: { src } }] })).toThrow('HTTPS');
  });
  it('rejects unsafe imported links', () => {
    expect(() => importMarkdown('[bad](javascript:alert%281%29)')).toThrow('Unsafe link');
  });
  it('rejects oversized Markdown before conversion', () => {
    expect(() => importMarkdown('가'.repeat(100_000))).toThrow('256 KiB');
  });
  it('never renders an unsafe JSON image as an img', () => {
    const editor = new Editor({ extensions: editorExtensions(), content: { type: 'doc', content: [{ type: 'image', attrs: { src: 'javascript:alert(1)' } }] } });
    expect(editor.getHTML()).not.toContain('<img');
    expect(editor.getHTML()).not.toContain('javascript:');
    editor.destroy();
  });
  it('drops pasted script and unsafe image nodes', () => {
    const editor = new Editor({ extensions: editorExtensions(), content: '<p>Safe</p><script>alert(1)</script><img src="data:image/svg+xml,bad">' });
    expect(editor.getHTML()).toBe('<p>Safe</p>');
    editor.destroy();
  });
});
