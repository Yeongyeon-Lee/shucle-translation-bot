'use client';

export type FileStatus = 'pending' | 'translating' | 'done' | 'error';

export interface FileStatusEntry {
  filename: string;
  keyCount: number;
  status: FileStatus;
  error?: string;
}

interface Props {
  entries: FileStatusEntry[];
}

const statusConfig: Record<FileStatus, { label: string; className: string }> = {
  pending:     { label: '대기중',  className: 'bg-gray-100 text-gray-500' },
  translating: { label: '번역중',  className: 'bg-blue-100 text-blue-600' },
  done:        { label: '완료',    className: 'bg-green-100 text-green-700' },
  error:       { label: '오류',    className: 'bg-red-100 text-red-600' },
};

export default function TranslationStatus({ entries }: Props) {
  if (entries.length === 0) return null;
  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      {entries.map((entry) => {
        const cfg = statusConfig[entry.status];
        return (
          <li key={entry.filename} className="flex items-center justify-between px-4 py-3 bg-white">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{entry.filename}</p>
              {entry.error && <p className="text-xs text-red-500 mt-0.5 truncate">{entry.error}</p>}
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <span className="text-xs text-gray-400">{entry.keyCount} keys</span>
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                {entry.status === 'translating' && (
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {cfg.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
