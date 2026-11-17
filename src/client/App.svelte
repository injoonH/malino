<script lang="ts">
  import { onMount } from 'svelte';
  import type EditorPane from './EditorPane.svelte';
  import { messages, type Locale } from './i18n';

  let locale = $state<Locale>(navigator.language.startsWith('ko') ? 'ko' : 'en');
  const t = $derived(messages(locale));
  let Pane = $state<typeof EditorPane>();
  let page = $state('welcome');
  let manyPages = $state(false);
  const title = $derived(page === 'welcome' ? t.welcome : page === 'large' ? t.longNote : page === 'table' ? t.bigTable : page === 'daily' ? t.daily : page);
  onMount(async () => {
    try { const stored = localStorage.getItem('malino-locale'); if (stored === 'ko' || stored === 'en') locale = stored; } catch { /* Preference is optional. */ }
    Pane = (await import('./EditorPane.svelte')).default;
  });
  $effect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem('malino-locale', locale); } catch { /* Preference is optional. */ }
  });
</script>

<div class="workspace">
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="malino"><span class="brand-mark">m.</span> malino</a>
    <p class="brand-caption">{t.little}</p>
    <div class="section-label">{t.notes}</div>
    <nav aria-label={t.notes}>
      <button class:chosen={page === 'welcome'} onclick={() => page = 'welcome'}><span aria-hidden="true">▤</span> {t.welcome}</button>
      <button class:chosen={page === 'daily'} onclick={() => page = 'daily'}><span aria-hidden="true">▤</span> {t.daily}</button>
    </nav>
    <details class="samples">
      <summary>{t.samples}</summary>
      <button onclick={() => page = 'large'}>{t.longNote}</button>
      <button onclick={() => page = 'table'}>{t.bigTable}</button>
      <button onclick={() => manyPages = !manyPages}>{t.manyPages}</button>
    </details>
    {#if manyPages}
      <nav class="many-pages" aria-label={t.manyPages}>
        {#each Array.from({ length: 1000 }, (_, i) => `Note ${i + 1}`) as id (id)}
          <button class:chosen={page === id} onclick={() => page = id}>{id}</button>
        {/each}
      </nav>
    {/if}
    <div class="sidebar-bottom"><span class="small-flower" aria-hidden="true">✳</span><p>A little space.<br />A clearer mind.</p></div>
  </aside>
  <main>
    <header class="topbar">
      <div class="breadcrumb">malino <span>/</span> <span>{title}</span></div>
      <label class="language"><span class="sr-only">Language / 언어</span><select bind:value={locale}><option value="en">English</option><option value="ko">한국어</option></select></label>
    </header>
    <div class="preview-banner"><span class="status-dot"></span>{t.local}<span class="preview-description"> · {t.localNotice}</span></div>
    <section class="note" aria-label={title}>
      <div class="note-eyebrow">MY LITTLE NOTE</div>
      <h1>{title}</h1>
      {#if Pane}
        {#key page}<Pane id={page} {locale} />{/key}
      {:else}<p role="status">{t.loading}</p>{/if}
    </section>
  </main>
</div>
