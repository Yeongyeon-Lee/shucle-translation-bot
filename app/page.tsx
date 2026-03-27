'use client';

import { useState } from 'react';
import FileUpload, { UploadedFile } from '@/components/FileUpload';
import LanguageSelector from '@/components/LanguageSelector';
import TranslationStatus, { FileStatus, FileStatusEntry } from '@/components/TranslationStatus';
import DownloadButton from '@/components/DownloadButton';
import { TranslationResult } from '@/lib/zipBuilder';
import { ALL_LANGUAGES, TargetLanguage } from '@/lib/glossary';

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<TargetLanguage[]>(ALL_LANGUAGES);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatusEntry>>({});
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const allDone =
    uploadedFiles.length > 0 &&
    uploadedFiles.every((f) => fileStatuses[f.filename]?.status === 'done');

  function handleFiles(files: UploadedFile[]) {
    setUploadedFiles(files);
    setResults([]);
    const statuses: Record<string, FileStatusEntry> = {};
    for (const f of files) {
      statuses[f.filename] = { filename: f.filename, keyCount: f.keyCount, status: 'pending' };
    }
    setFileStatuses(statuses);
  }

  function setStatus(filename: string, status: FileStatus, error?: string) {
    setFileStatuses((prev) => ({
      ...prev,
      [filename]: { ...prev[filename], status, error },
    }));
  }

  async function handleTranslate() {
    if (!uploadedFiles.length || !selectedLanguages.length) return;
    setIsTranslating(true);
    setResults([]);

    for (const file of uploadedFiles) {
      setStatus(file.filename, 'translating');
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.filename,
            content: file.content,
            targetLanguages: selectedLanguages,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          setStatus(file.filename, 'error', data.error ?? `HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        setResults((prev) => [
          ...prev,
          { filename: file.filename, translations: data.translations },
        ]);
        setStatus(file.filename, 'done');
      } catch (err) {
        setStatus(file.filename, 'error', err instanceof Error ? err.message : String(err));
      }
    }

    setIsTranslating(false);
  }

  const statusList = uploadedFiles.map(
    (f) =>
      fileStatuses[f.filename] ?? {
        filename: f.filename,
        keyCount: f.keyCount,
        status: 'pending' as FileStatus,
      }
  );

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">셔클 번역봇</h1>
          <p className="text-sm text-gray-500 mt-1">
            한국어 JSON 로케일 파일을 업로드하면 자동으로 다국어 번역 후 ZIP으로 다운로드합니다.
          </p>
        </div>

        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">번역 언어 선택</h2>
          <LanguageSelector selected={selectedLanguages} onChange={setSelectedLanguages} disabled={isTranslating} />
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">파일 업로드</h2>
          <FileUpload onFiles={handleFiles} disabled={isTranslating} />
        </section>

        {uploadedFiles.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">파일 목록</h2>
            <TranslationStatus entries={statusList} />
          </section>
        )}

        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            {!allDone && (
              <button
                onClick={handleTranslate}
                disabled={isTranslating || selectedLanguages.length === 0}
                className="w-full py-3 px-6 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTranslating ? '번역 중...' : '번역 시작'}
              </button>
            )}
            {allDone && (
              <DownloadButton results={results} selectedLanguages={selectedLanguages} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
