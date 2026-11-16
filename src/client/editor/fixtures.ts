import type { JSONContent } from '@tiptap/core';

const text = (value: string): JSONContent => ({ type: 'text', text: value });
const paragraph = (value: string): JSONContent => ({ type: 'paragraph', content: [text(value)] });

export const welcome: JSONContent = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [text('A little room to think.')] },
    paragraph('Big ideas, small reminders, and everything in between. Start writing here — there is no syntax to learn.'),
    { type: 'bulletList', content: [
      { type: 'listItem', content: [paragraph('Select some text to make it your own.')] },
      { type: 'listItem', content: [paragraph('Add a table, a checklist, or an image from a URL.')] },
      { type: 'listItem', content: [paragraph('한국어로도 편하게 기록하세요.')] },
    ] },
  ],
};

export const largeNote: JSONContent = {
  type: 'doc',
  content: Array.from({ length: 100 }, () => paragraph('A small thought 오늘의 기록 '.repeat(20).trim())),
};

export const largeTable: JSONContent = {
  type: 'doc',
  content: [{ type: 'table', content: Array.from({ length: 101 }, (_, row) => ({
    type: 'tableRow', content: Array.from({ length: 4 }, (_, col) => ({
      type: row === 0 ? 'tableHeader' : 'tableCell',
      content: [paragraph(row === 0 ? `Column ${col + 1}` : `기록 ${row} · ${col + 1}`)],
    })),
  })) }],
};
