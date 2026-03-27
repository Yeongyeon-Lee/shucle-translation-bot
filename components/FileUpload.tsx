'use client';

import { useRef, useState } from 'react';

export interface UploadedFile {
  filename: string;
  content: Record<string, string>;
  keyCount: number;
}

interface Props {
  onFiles: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFiles, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function processFiles(fileList: FileList) {
    const parsed: UploadedFile[] = [];
    const errs: string[] = [];

    for (const file of Array.from(fileList)) {
      if (!file.name.endsWith('.json')) {
        errs.push(`${file.name}: JSON 파일만 지원합니다.`);
        continue;
      }
      try {
        const text = await file.text();
        const content = JSON.parse(text) as Record<string, string>;
        if (typeof content !== 'object' || Array.isArray(content)) {
          errs.push(`${file.name}: 최상위 레벨이 객체여야 합니다.`);
          continue;
        }
        parsed.push({ filename: file.name, content, keyCount: Object.keys(content).length });
      } catch {
        errs.push(`${file.name}: JSON 파싱 실패`);
      }
    }

    setErrors(errs);
    if (parsed.length > 0) onFiles(parsed);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(e.target.files);
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <p className="text-gray-500 text-sm">JSON 파일을 드래그하거나 클릭해서 업로드하세요</p>
        <p className="text-gray-400 text-xs mt-1">여러 파일 동시 업로드 가능</p>
        <input ref={inputRef} type="file" accept=".json" multiple className="hidden" onChange={onInputChange} disabled={disabled} />
      </div>
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1">
          {errors.map((e, i) => <li key={i} className="text-red-500 text-xs">{e}</li>)}
        </ul>
      )}
    </div>
  );
}
