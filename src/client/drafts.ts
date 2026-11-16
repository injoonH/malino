import type { JSONContent } from '@tiptap/core';

type Draft = { id: string; document: JSONContent; savedAt: number };
let connection: Promise<IDBDatabase> | undefined;

function database() {
  return connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('malino-feasibility', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { connection = undefined; reject(request.error); };
  });
}

export async function loadDraft(id: string): Promise<Draft | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('drafts').objectStore('drafts').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraft(id: string, document: JSONContent): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readwrite');
    transaction.objectStore('drafts').put({ id, document, savedAt: Date.now() } satisfies Draft);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
