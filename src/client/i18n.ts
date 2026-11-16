export type Locale = 'en' | 'ko';

const en = {
  notes: 'MY NOTES', welcome: 'Welcome to malino', daily: 'A fresh page',
  little: 'My Little Note', local: 'Local editor preview',
  localNotice: 'This preview saves only in this browser. Export a copy to keep your notes.',
  loading: 'Opening your note…', saving: 'Saving on this device…', saved: 'Saved on this device',
  failed: 'Could not save on this device. Export your note to keep a copy.',
  bold: 'Bold', italic: 'Italic', strike: 'Strikethrough', paragraph: 'Text', heading: 'Heading',
  bullets: 'Bullet list', numbered: 'Numbered list', tasks: 'Checklist', quote: 'Quote', code: 'Code block',
  inlineCode: 'Inline code', divider: 'Divider', table: 'Table', image: 'Image URL', link: 'Link',
  undo: 'Undo', redo: 'Redo', import: 'Import Markdown', export: 'Export Markdown',
  addRow: 'Add row', addColumn: 'Add column', deleteRow: 'Delete row', deleteColumn: 'Delete column', deleteTable: 'Delete table',
  insert: 'Insert', cancel: 'Cancel', url: 'URL', alt: 'Image description',
  urlHint: 'External images load from their host, which can see your IP address.',
  replace: 'Replace this note with the imported Markdown? Export a copy first if you want to keep it.',
  error: 'This content could not be imported or exported. ',
  samples: 'Performance samples', longNote: 'Long note', bigTable: '100-row table', manyPages: '1,000 pages',
};
const ko: typeof en = {
  notes: '내 노트', welcome: '말리노에 오신 것을 환영해요', daily: '새로운 페이지',
  little: '나의 작은 노트', local: '로컬 편집기 미리보기',
  localNotice: '이 미리보기는 현재 브라우저에만 저장됩니다. 내보내기로 사본을 보관하세요.',
  loading: '노트를 여는 중…', saving: '이 기기에 저장 중…', saved: '이 기기에 저장됨',
  failed: '이 기기에 저장하지 못했어요. 내보내기로 사본을 보관하세요.',
  bold: '굵게', italic: '기울임', strike: '취소선', paragraph: '본문', heading: '제목',
  bullets: '글머리 기호', numbered: '번호 목록', tasks: '체크리스트', quote: '인용', code: '코드 블록',
  inlineCode: '인라인 코드', divider: '구분선', table: '표', image: '이미지 URL', link: '링크',
  undo: '실행 취소', redo: '다시 실행', import: '마크다운 가져오기', export: '마크다운 내보내기',
  addRow: '행 추가', addColumn: '열 추가', deleteRow: '행 삭제', deleteColumn: '열 삭제', deleteTable: '표 삭제',
  insert: '삽입', cancel: '취소', url: 'URL', alt: '이미지 설명',
  urlHint: '외부 이미지를 불러오면 이미지 호스트가 IP 주소를 볼 수 있습니다.',
  replace: '가져온 마크다운으로 이 노트를 바꿀까요? 기존 내용을 보관하려면 먼저 내보내기 해주세요.',
  error: '이 콘텐츠를 가져오거나 내보내지 못했어요. ',
  samples: '성능 테스트 예제', longNote: '긴 노트', bigTable: '100행 표', manyPages: '1,000개 페이지',
};
export function messages(locale: Locale) { return locale === 'ko' ? ko : en; }
