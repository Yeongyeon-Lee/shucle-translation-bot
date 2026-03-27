'use client';

import { ALL_LANGUAGES, LANGUAGE_LABELS, TargetLanguage } from '@/lib/glossary';

interface Props {
  selected: TargetLanguage[];
  onChange: (langs: TargetLanguage[]) => void;
  disabled?: boolean;
}

export default function LanguageSelector({ selected, onChange, disabled }: Props) {
  function toggle(lang: TargetLanguage) {
    if (selected.includes(lang)) {
      onChange(selected.filter((l) => l !== lang));
    } else {
      onChange([...selected, lang]);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {ALL_LANGUAGES.map((lang) => (
        <label
          key={lang}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer select-none transition-colors ${
            selected.includes(lang)
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            className="accent-blue-500"
            checked={selected.includes(lang)}
            onChange={() => toggle(lang)}
            disabled={disabled}
          />
          <span className="text-sm font-medium">{LANGUAGE_LABELS[lang]}</span>
        </label>
      ))}
    </div>
  );
}
