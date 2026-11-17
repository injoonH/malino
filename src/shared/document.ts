import { z } from 'zod';
import { isSafeUrl } from './urls';

export type DocumentNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: DocumentNode[];
};
const nodeSchema: z.ZodType<DocumentNode> = z.lazy(() => z.object({
  type: z.enum(['doc', 'paragraph', 'text', 'heading', 'bulletList', 'orderedList', 'listItem', 'taskList', 'taskItem', 'blockquote', 'codeBlock', 'hardBreak', 'horizontalRule', 'image', 'table', 'tableRow', 'tableCell', 'tableHeader']),
  text: z.string().optional(),
  attrs: z.record(z.string(), z.unknown()).optional(),
  marks: z.array(z.object({ type: z.enum(['bold', 'italic', 'strike', 'code', 'link']), attrs: z.record(z.string(), z.unknown()).optional() }).strict()).optional(),
  content: z.array(nodeSchema).optional(),
}).strict());

const blocks = new Set(['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock', 'horizontalRule', 'image', 'table']);
const inline = new Set(['text', 'hardBreak']);

export function parseDocument(input: unknown): DocumentNode {
  const serialized = JSON.stringify(input);
  if (!serialized || new TextEncoder().encode(serialized).length > 256 * 1024) throw new Error('Document exceeds 256 KiB.');
  // Bound depth before invoking recursive schema validation.
  function bound(value: unknown, depth = 0) {
    if (depth > 110) throw new Error('Document nesting limit exceeded.');
    if (Array.isArray(value)) for (const item of value) bound(item, depth + 1);
    else if (value && typeof value === 'object') for (const child of Object.values(value)) bound(child, depth + 1);
  }
  bound(input);
  const doc = nodeSchema.parse(input);
  if (doc.type !== 'doc') throw new Error('Expected a document.');
  function check(node: DocumentNode) {
    const children = node.content ?? [];
    const attrs = node.attrs ?? {};
    const allowedAttrs: Record<string, string[]> = {
      heading: ['level'], orderedList: ['start', 'type'], taskItem: ['checked'], codeBlock: ['language'],
      image: ['src', 'alt', 'title', 'width', 'height'], tableCell: ['colspan', 'rowspan', 'colwidth', 'align'], tableHeader: ['colspan', 'rowspan', 'colwidth', 'align'],
    };
    if (Object.keys(attrs).some((key) => !(allowedAttrs[node.type] ?? []).includes(key))) throw new Error('Unsupported attributes.');
    let allowed = new Set<string>();
    switch (node.type) {
      case 'doc': case 'blockquote': allowed = blocks; break;
      case 'listItem': case 'taskItem': allowed = new Set(['paragraph', 'bulletList', 'orderedList', 'taskList']); break;
      case 'paragraph': case 'heading': allowed = inline; break;
      case 'codeBlock': allowed = new Set(['text']); break;
      case 'bulletList': case 'orderedList': allowed = new Set(['listItem']); break;
      case 'taskList': allowed = new Set(['taskItem']); break;
      case 'table': allowed = new Set(['tableRow']); break;
      case 'tableRow': allowed = new Set(['tableCell', 'tableHeader']); break;
      case 'tableCell': case 'tableHeader':
        allowed = new Set(['paragraph']);
        if (children.length !== 1 || (attrs.colspan ?? 1) !== 1 || (attrs.rowspan ?? 1) !== 1) throw new Error('Only simple table cells are supported.');
        break;
    }
    if (children.some((child) => !allowed.has(child.type))) throw new Error('Invalid document structure.');
    if (node.type === 'text' && (!node.text || children.length)) throw new Error('Invalid text node.');
    if (node.type !== 'text' && node.text !== undefined) throw new Error('Text belongs in a text node.');
    if (node.type === 'heading' && ![1, 2, 3].includes(Number(attrs.level))) throw new Error('Unsupported heading.');
    if (node.type === 'image' && !isSafeUrl(attrs.src, true)) throw new Error('Unsafe image.');
    if (node.type === 'table' && (!children.length || !children[0].content?.length || children.some((row) => row.content?.length !== children[0].content?.length))) throw new Error('Table must be rectangular.');
    for (const mark of node.marks ?? []) {
      if (!inline.has(node.type)) throw new Error('Marks require inline content.');
      if (mark.type === 'link' && !isSafeUrl(mark.attrs?.href)) throw new Error('Unsafe link.');
    }
    for (const child of children) check(child);
  }
  check(doc);
  return doc;
}
