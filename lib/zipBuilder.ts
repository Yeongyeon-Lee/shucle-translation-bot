import JSZip from 'jszip';
import { TargetLanguage } from './glossary';

export interface TranslationResult {
  filename: string;
  translations: Partial<Record<TargetLanguage, Record<string, string>>>;
}

export async function buildZip(
  results: TranslationResult[],
  selectedLanguages: TargetLanguage[]
): Promise<Blob> {
  const zip = new JSZip();
  const dateStr = new Date().toISOString().slice(0, 10);
  const rootFolder = `shucle-translations-${dateStr}`;

  for (const result of results) {
    for (const lang of selectedLanguages) {
      const translated = result.translations[lang];
      if (!translated) continue;
      const json = JSON.stringify(translated, null, 2);
      zip.file(`${rootFolder}/after/${lang}/${result.filename}`, json);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
