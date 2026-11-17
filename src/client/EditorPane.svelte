<script lang="ts">
  import { onMount } from 'svelte';
  import { Editor } from '@tiptap/core';
  import type { JSONContent } from '@tiptap/core';
  import { editorExtensions } from './editor/extensions';
  import { welcome, largeNote, largeTable } from './editor/fixtures';
  import { loadDraft, saveDraft } from './drafts';
  import { isSafeUrl } from '../shared/urls';
  import { messages, type Locale } from './i18n';

  let { id, locale }: { id: string; locale: Locale } = $props();
  const t = $derived(messages(locale));
  let element: HTMLDivElement;
  let dialog: HTMLDialogElement;
  let fileInput: HTMLInputElement;
  let editor = $state<Editor>();
  let status = $state<'loading' | 'saving' | 'saved' | 'failed'>('loading');
  let error = $state('');
  let inTable = $state(false);
  let urlKind = $state<'image' | 'link'>('image');
  let url = $state('');
  let alt = $state('');
  let timer: ReturnType<typeof setTimeout>;
  let generation = 0;
  let dirty = false;

  function persist(instance: Editor) {
    if (!dirty) return;
    dirty = false;
    const version = generation;
    const document = instance.getJSON();
    void saveDraft(id, document).then(() => {
      if (version === generation) status = 'saved';
    }).catch(() => { dirty = true; status = 'failed'; });
  }

  onMount(() => {
    let disposed = false;
    const instance = new Editor({
      element,
      extensions: editorExtensions(),
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      editable: false,
      editorProps: { attributes: { role: 'textbox', 'aria-label': 'Note content', 'aria-multiline': 'true', spellcheck: 'true' } },
      onSelectionUpdate: ({ editor }) => { inTable = editor.isActive('table'); },
      onUpdate: () => {
        dirty = true; generation++; status = 'saving';
        clearTimeout(timer);
        timer = setTimeout(() => persist(instance), 200);
        inTable = instance.isActive('table');
      },
    });
    editor = instance;
    void (async () => {
      let content: JSONContent = id === 'welcome' ? welcome : id === 'large' ? largeNote : id === 'table' ? largeTable : { type: 'doc', content: [{ type: 'paragraph' }] };
      try {
        const draft = await loadDraft(id);
        if (draft) content = draft.document;
        if (disposed) return;
        instance.commands.setContent(content, { emitUpdate: false });
        status = 'saved';
      } catch {
        if (disposed) return;
        instance.commands.setContent(content, { emitUpdate: false });
        status = 'failed';
      }
      instance.setEditable(true);
      element.dataset.ready = 'true';
      performance.mark('malino-editor-ready');
    })();
    const flush = () => persist(instance);
    window.addEventListener('pagehide', flush);
    return () => {
      disposed = true; clearTimeout(timer); persist(instance);
      window.removeEventListener('pagehide', flush);
      instance.destroy();
    };
  });

  function openUrl(kind: 'image' | 'link') {
    urlKind = kind; url = ''; alt = ''; error = '';
    dialog.showModal();
  }
  function insertUrl(event: SubmitEvent) {
    event.preventDefault();
    if (!isSafeUrl(url, urlKind === 'image')) { error = locale === 'ko' ? '올바른 URL을 입력하세요. 이미지는 HTTPS만 지원합니다.' : 'Enter a valid URL. Images require HTTPS.'; return; }
    if (urlKind === 'image') editor?.chain().focus().setImage({ src: url, alt }).run();
    else editor?.chain().focus().setLink({ href: url }).run();
    dialog.close();
  }
  async function download() {
    try {
      const { exportMarkdown } = await import('./editor/markdown');
      const output = exportMarkdown(editor!.getJSON());
      const href = URL.createObjectURL(new Blob([output], { type: 'text/markdown;charset=utf-8' }));
      const anchor = document.createElement('a'); anchor.href = href; anchor.download = 'malino-note.md'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000); error = '';
    } catch (cause) { error = t.error + String(cause); }
  }
  async function importFile() {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      if (file.size > 256 * 1024) throw new Error('File exceeds 256 KiB.');
      const { importMarkdown } = await import('./editor/markdown');
      const doc = importMarkdown(await file.text());
      if (window.confirm(t.replace)) editor?.commands.setContent(doc);
      error = '';
    } catch (cause) { error = t.error + String(cause); }
    fileInput.value = '';
  }
</script>

<div class="editor-actions">
  <span class:error-status={status === 'failed'} class="save-status" role="status">{t[status]}</span>
  <div class="file-actions">
    <button onclick={() => fileInput.click()} disabled={status === 'loading'}>{t.import}</button>
    <button onclick={download} disabled={status === 'loading'}>{t.export} <span aria-hidden="true">↗</span></button>
    <input class="sr-only" tabindex="-1" type="file" accept=".md,.markdown,text/markdown,text/plain" bind:this={fileInput} onchange={importFile} />
  </div>
</div>
<div class="toolbar" role="group" aria-label={locale === 'ko' ? '서식' : 'Formatting'}>
  <button title={t.paragraph} aria-label={t.paragraph} onclick={() => editor?.chain().focus().setParagraph().run()}>¶</button>
  <button title={t.heading} aria-label={t.heading} onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
  <span class="toolbar-divider"></span>
  <button title={t.bold} aria-label={t.bold} onclick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></button>
  <button title={t.italic} aria-label={t.italic} onclick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
  <button title={t.strike} aria-label={t.strike} onclick={() => editor?.chain().focus().toggleStrike().run()}><s>S</s></button>
  <button title={t.inlineCode} aria-label={t.inlineCode} onclick={() => editor?.chain().focus().toggleCode().run()}>&lt;/&gt;</button>
  <button title={t.link} aria-label={t.link} onclick={() => openUrl('link')}>↗</button>
  <span class="toolbar-divider"></span>
  <button title={t.bullets} aria-label={t.bullets} onclick={() => editor?.chain().focus().toggleBulletList().run()}>• ≡</button>
  <button title={t.numbered} aria-label={t.numbered} onclick={() => editor?.chain().focus().toggleOrderedList().run()}>1.</button>
  <button title={t.tasks} aria-label={t.tasks} onclick={() => editor?.chain().focus().toggleTaskList().run()}>☑</button>
  <button title={t.quote} aria-label={t.quote} onclick={() => editor?.chain().focus().toggleBlockquote().run()}>❝</button>
  <button title={t.code} aria-label={t.code} onclick={() => editor?.chain().focus().toggleCodeBlock().run()}>{'{ }'}</button>
  <button title={t.divider} aria-label={t.divider} onclick={() => editor?.chain().focus().setHorizontalRule().run()}>―</button>
  <span class="toolbar-divider"></span>
  <button title={t.table} aria-label={t.table} onclick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦</button>
  <button title={t.image} aria-label={t.image} onclick={() => openUrl('image')}>▧</button>
  <button title={t.undo} aria-label={t.undo} onclick={() => editor?.chain().focus().undo().run()}>↶</button>
  <button title={t.redo} aria-label={t.redo} onclick={() => editor?.chain().focus().redo().run()}>↷</button>
</div>
{#if inTable}
  <div class="table-tools" role="group" aria-label={t.table}>
    <button onclick={() => editor?.chain().focus().addRowAfter().run()}>{t.addRow}</button>
    <button onclick={() => editor?.chain().focus().addColumnAfter().run()}>{t.addColumn}</button>
    <button onclick={() => editor?.chain().focus().deleteRow().run()}>{t.deleteRow}</button>
    <button onclick={() => editor?.chain().focus().deleteColumn().run()}>{t.deleteColumn}</button>
    <button onclick={() => editor?.chain().focus().deleteTable().run()}>{t.deleteTable}</button>
  </div>
{/if}
{#if error}<p class="error-message" role="alert">{error}</p>{/if}
<div class="editor" bind:this={element}></div>

<dialog bind:this={dialog}>
  <form onsubmit={insertUrl}>
    <h2>{urlKind === 'image' ? t.image : t.link}</h2>
    <label>{t.url}<input type="url" bind:value={url} required placeholder="https://…" /></label>
    {#if urlKind === 'image'}<label>{t.alt}<input bind:value={alt} /></label><p>{t.urlHint}</p>{/if}
    {#if error}<p role="alert">{error}</p>{/if}
    <div class="dialog-actions"><button type="button" onclick={() => dialog.close()}>{t.cancel}</button><button class="primary" type="submit">{t.insert}</button></div>
  </form>
</dialog>
