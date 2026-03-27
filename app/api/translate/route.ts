import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/systemPrompt';
import { TargetLanguage } from '@/lib/glossary';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CHUNK_SIZE = 50;

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return text.trim();
}

function chunkObject(obj: Record<string, string>, size: number): Record<string, string>[] {
  const entries = Object.entries(obj);
  const chunks: Record<string, string>[] = [];
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(Object.fromEntries(entries.slice(i, i + size)));
  }
  return chunks;
}

function mergeChunkResults(
  chunks: Partial<Record<TargetLanguage, Record<string, string>>>[],
  targetLanguages: TargetLanguage[]
): Record<TargetLanguage, Record<string, string>> {
  const merged = {} as Record<TargetLanguage, Record<string, string>>;
  for (const lang of targetLanguages) {
    merged[lang] = {};
    for (const chunk of chunks) {
      Object.assign(merged[lang], chunk[lang] ?? {});
    }
  }
  return merged;
}

export async function POST(req: NextRequest) {
  let filename: string;
  let content: Record<string, string>;
  let targetLanguages: TargetLanguage[];
  let referenceContent: Record<string, string> | undefined;

  try {
    ({ filename, content, targetLanguages, referenceContent } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!targetLanguages?.length) {
    return NextResponse.json({ error: 'No target languages specified' }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(targetLanguages);
  const chunks = chunkObject(content, CHUNK_SIZE);
  const chunkResults: Partial<Record<TargetLanguage, Record<string, string>>>[] = [];

  try {
    for (const chunk of chunks) {
      let userMessage: string;
      if (referenceContent) {
        const combined = Object.fromEntries(
          Object.keys(chunk).map((key) => [
            key,
            { ko: chunk[key], en: referenceContent[key] ?? '' },
          ])
        );
        userMessage = JSON.stringify(combined, null, 2);
      } else {
        userMessage = JSON.stringify(chunk, null, 2);
      }

      const message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 8096,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userMessage }],
      });

      const rawText = message.content.find((c) => c.type === 'text')?.text ?? '';
      const jsonText = extractJson(rawText);

      let parsed: Partial<Record<TargetLanguage, Record<string, string>>>;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        return NextResponse.json(
          { error: `JSON parse failed for chunk in ${filename}`, raw: rawText },
          { status: 502 }
        );
      }

      for (const lang of targetLanguages) {
        if (!parsed[lang]) parsed[lang] = {};
        for (const key of Object.keys(chunk)) {
          if (!parsed[lang]![key]) parsed[lang]![key] = chunk[key];
        }
      }
      chunkResults.push(parsed);
    }
  } catch (err: unknown) {
    if (err instanceof Anthropic.RateLimitError)
      return NextResponse.json({ error: 'Rate limit exceeded, please try again shortly.' }, { status: 429 });
    if (err instanceof Anthropic.AuthenticationError)
      return NextResponse.json({ error: 'Invalid Anthropic API key.' }, { status: 500 });
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const merged = mergeChunkResults(chunkResults, targetLanguages);
  const sourceKeys = Object.keys(content);
  const ordered = {} as Record<TargetLanguage, Record<string, string>>;
  for (const lang of targetLanguages) {
    ordered[lang] = {};
    for (const key of sourceKeys) {
      ordered[lang][key] = merged[lang][key] ?? content[key];
    }
  }

  return NextResponse.json({ translations: ordered });
}
