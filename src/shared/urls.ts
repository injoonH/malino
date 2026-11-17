export function isSafeUrl(value: unknown, image = false): value is string {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\u007f]/u.test(value)) return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password && (image
      ? url.protocol === 'https:'
      : ['https:', 'http:', 'mailto:'].includes(url.protocol));
  } catch {
    return false;
  }
}
