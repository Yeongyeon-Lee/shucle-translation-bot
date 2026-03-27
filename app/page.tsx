'use client';

import { useState } from 'react';
import FileUpload, { UploadedFile } from '@/components/FileUpload';
import LanguageSelector from '@/components/LanguageSelector';
import TranslationStatus, { FileStatus, FileStatusEntry } from '@/components/TranslationStatus';
import DownloadButton from '@/components/DownloadButton';
import { TranslationResult } from '@/lib/zipBuilder';
import { ALL_LANGUAGES, TargetLanguage } from '@/lib/glossary';

const HANGUL = /[\uAC00-\uD7A3]/;

function hasHangul(content: Record<string, string>): boolean {
  return Object.values(content).some((v) => HANGUL.test(v));
}

function hasNonEmptyContent(content: Record<string, string>): boolean {
  return Object.values(content).some((v) => v.trim() !== '');
}

export default function Home() {
  const [sourceFiles, setSourceFiles] = useState<UploadedFile[]>([]);
  const [mergedReference, setMergedReference] = useState<Record<string, string>>({});
  const [referenceCount, setReferenceCount] = useState(0);
  const [selectedLanguages, setSelectedLanguages] = useState<TargetLanguage[]>(ALL_LANGUAGES);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatusEntry>>({});
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const allDone =
    sourceFiles.length > 0 &&
    sourceFiles.every((f) => fileStatuses[f.filename]?.status === 'done');

  function handleAllFiles(files: UploadedFile[]) {
    const sources: UploadedFile[] = [];
    const merged: Record<string, string> = {};
    let refCount = 0;

    for (const f of files) {
      if (hasHangul(f.content)) {
        sources.push(f);
      } else if (hasNonEmptyContent(f.content)) {
        Object.assign(merged, f.content);
        refCount++;
      }
    }

    setSourceFiles(sources);
    setMergedReference(merged);
    setReferenceCount(refCount);
    setResults([]);

    const statuses: Record<string, FileStatusEntry> = {};
    for (const f of sources) {
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
    if (!sourceFiles.length || !selectedLanguages.length) return;
    setIsTranslating(true);
    setResults([]);

    for (const file of sourceFiles) {
      setStatus(file.filename, 'translating');
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.filename,
            content: file.content,
            referenceContent: Object.keys(mergedReference).length > 0 ? mergedReference : undefined,
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

  const statusList = sourceFiles.map(
    (f) =>
      fileStatuses[f.filename] ?? {
        filename: f.filename,
        keyCount: f.keyCount,
        status: 'pending' as FileStatus,
      }
  );

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">셔클 번역봇</h1>
          <p className="text-sm text-gray-500 mt-1">
            JSON 로케일 파일을 업로드하면 자동으로 다국어 번역 후 ZIP으로 다운로드합니다.
          </p>
        </div>

        {/* Step 1 */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
            <h2 className="text-sm font-semibold text-gray-700">소스 파일을 업로드해주세요</h2>
          </div>
          <p className="text-xs text-gray-400 pl-8">
            한국어 파일과 영어 참고 파일을 한꺼번에 드래그해도 됩니다. 한글이 포함된 파일은 자동으로 번역 소스로, 나머지는 참고 파일로 분류됩니다.
          </p>
          <FileUpload onFiles={handleAllFiles} disabled={isTranslating} />
          {(sourceFiles.length > 0 || referenceCount > 0) && (
            <div className="space-y-1 pt-1">
              {sourceFiles.length > 0 && (
                <p className="text-xs text-indigo-600">
                  번역 소스 ({sourceFiles.length}개): {sourceFiles.map((f) => f.filename).join(', ')}
                </p>
              )}
              {referenceCount > 0 && (
                <p className="text-xs text-gray-400">영어 참고 ({referenceCount}개) 로드됨</p>
              )}
            </div>
          )}
        </section>

        {/* Step 2 */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
            <h2 className="text-sm font-semibold text-gray-700">번역할 언어를 선택해주세요</h2>
          </div>
          <div className="pl-8">
            <LanguageSelector
              selected={selectedLanguages}
              onChange={setSelectedLanguages}
              disabled={isTranslating}
            />
          </div>
        </section>

        {sourceFiles.length > 0 && (
          <section>
            <TranslationStatus entries={statusList} />
          </section>
        )}

        {sourceFiles.length > 0 && (
          <div>
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
