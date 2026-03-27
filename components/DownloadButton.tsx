'use client';

import { useState } from 'react';
import { buildZip, TranslationResult, triggerDownload } from '@/lib/zipBuilder';
import { TargetLanguage } from '@/lib/glossary';

interface Props {
  results: TranslationResult[];
  selectedLanguages: TargetLanguage[];
  disabled?: boolean;
}

export default function DownloadButton({ results, selectedLanguages, disabled }: Props) {
  const [building, setBuilding] = useState(false);

  async function handleDownload() {
    setBuilding(true);
    try {
      const blob = await buildZip(results, selectedLanguages);
      const dateStr = new Date().toISOString().slice(0, 10);
      triggerDownload(blob, `shucle-translations-${dateStr}.zip`);
    } finally {
      setBuilding(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || building}
      className="w-full py-3 px-6 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {building ? 'ZIP 생성 중...' : 'ZIP 다운로드'}
    </button>
  );
}
