import { getSchema, type JSONContent } from '@tiptap/core';
import { MarkdownManager } from '@tiptap/markdown';
import { editorExtensions } from './extensions';
import { isSafeUrl } from '../../shared/urls';

const extensions = editorExtensions();
const manager = new MarkdownManager({ extensions });
const schema = getSchema(extensions);
const encoder = new TextEncoder();
export const MAX_DOCUMENT_BYTES = 256 * 1024;

export function validateDocument(doc: JSONContent): JSONContent {
  if (encoder.encode(JSON.stringify(doc)).byteLength > MAX_DOCUMENT_BYTES) throw new Error('Document exceeds 256 KiB.');
  function visit(node: JSONContent, depth: number) {
    if (depth > 100) throw new Error('Document is nested too deeply.');
    if (node.type === 'image' && !isSafeUrl(node.attrs?.src, true)) throw new Error('Images require a safe HTTPS URL.');
    if ((node.type === 'tableCell' || node.type === 'tableHeader') &&
      ((node.attrs?.colspan ?? 1) !== 1 || (node.attrs?.rowspan ?? 1) !== 1)) {
      throw new Error('Merged table cells are not supported.');
    }
    for (const mark of node.marks ?? []) {
      if (mark.type === 'link' && !isSafeUrl(mark.attrs?.href)) throw new Error('Unsafe link URL.');
    }
    for (const child of node.content ?? []) visit(child, depth + 1);
  }
  visit(doc, 0);
  const parsed = schema.nodeFromJSON(doc);
  parsed.check();
  return parsed.toJSON();
}

export function importMarkdown(markdown: string): JSONContent {
  if (encoder.encode(markdown).byteLength > MAX_DOCUMENT_BYTES) throw new Error('Markdown exceeds 256 KiB.');
  // Raw HTML has ambiguous portability and security semantics: reject before parsing.
  const tokens = manager.instance.lexer(markdown);
  manager.instance.walkTokens(tokens, (token) => {
    if (token.type === 'html') throw new Error('Raw HTML is not supported. Use Markdown formatting.');
  });
  return validateDocument(manager.parse(markdown));
}

export function exportMarkdown(document: JSONContent): string {
  return manager.serialize(validateDocument(document));
}
