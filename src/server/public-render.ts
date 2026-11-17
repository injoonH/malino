import { parseDocument, type DocumentNode } from '../shared/document';

function escape(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function renderPublicDocument(value: unknown): string {
  const document = parseDocument(value);
  function render(node: DocumentNode): string {
    const body = (node.content ?? []).map(render).join('');
    let output = '';
    switch (node.type) {
      case 'doc': return body;
      case 'text': output = escape(node.text); break;
      case 'paragraph': return `<p>${body}</p>`;
      case 'heading': return `<h${node.attrs?.level}>${body}</h${node.attrs?.level}>`;
      case 'blockquote': return `<blockquote>${body}</blockquote>`;
      case 'bulletList': case 'taskList': return `<ul>${body}</ul>`;
      case 'orderedList': return `<ol>${body}</ol>`;
      case 'listItem': return `<li>${body}</li>`;
      case 'taskItem': return `<li>${node.attrs?.checked === true ? '☑' : '☐'} ${body}</li>`;
      case 'codeBlock': return `<pre><code>${body}</code></pre>`;
      case 'hardBreak': return '<br>';
      case 'horizontalRule': return '<hr>';
      case 'image': return `<img src="${escape(node.attrs?.src)}" alt="${escape(node.attrs?.alt)}" loading="lazy" referrerpolicy="no-referrer">`;
      case 'table': return `<table><tbody>${body}</tbody></table>`;
      case 'tableRow': return `<tr>${body}</tr>`;
      case 'tableCell': return `<td>${body}</td>`;
      case 'tableHeader': return `<th>${body}</th>`;
    }
    for (const mark of node.marks ?? []) {
      if (mark.type === 'link') output = `<a href="${escape(mark.attrs?.href)}" rel="noopener noreferrer">${output}</a>`;
      else {
        const tag = { bold: 'strong', italic: 'em', strike: 's', code: 'code' }[mark.type];
        if (tag) output = `<${tag}>${output}</${tag}>`;
      }
    }
    return output;
  }
  return render(document);
}
