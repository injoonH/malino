import { mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import Image from '@tiptap/extension-image';
import { isSafeUrl } from '../../shared/urls';

// Validate at rendering too: input rules and imported documents can bypass the URL form.
const SafeImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    if (!isSafeUrl(HTMLAttributes.src, true)) return ['span', { 'data-blocked-image': '' }, '[Image URL blocked]'];
    return ['img', mergeAttributes(HTMLAttributes, {
      referrerpolicy: 'no-referrer', loading: 'lazy', decoding: 'async',
    })];
  },
  parseHTML() {
    return [{ tag: 'img[src]', getAttrs: (element) => isSafeUrl(element.getAttribute('src'), true) ? null : false }];
  },
});

export function editorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      underline: false,
      link: {
        openOnClick: false,
        autolink: false,
        isAllowedUri: (url) => isSafeUrl(url),
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      },
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableCell.extend({ content: 'paragraph' }),
    TableHeader.extend({ content: 'paragraph' }),
    TaskList,
    TaskItem.configure({ nested: true }),
    SafeImage.configure({ allowBase64: false }),
  ];
}
