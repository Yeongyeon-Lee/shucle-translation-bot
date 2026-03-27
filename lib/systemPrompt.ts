import { BRAND_MAPPINGS, PRESERVED_TERMS, TargetLanguage } from './glossary';

export function buildSystemPrompt(targetLanguages: TargetLanguage[]): string {
  const langNames: Record<TargetLanguage, string> = {
    ja: 'Japanese (ja)',
    zh_CN: 'Simplified Chinese (zh_CN)',
    zh_TW: 'Traditional Chinese (zh_TW)',
    hu: 'Hungarian (hu)',
  };

  const selectedLangNames = targetLanguages.map((l) => langNames[l]).join(', ');

  const headerCols = ['Korean', ...targetLanguages.map((l) => langNames[l])].join(' | ');
  const headerSep = ['---', ...targetLanguages.map(() => '---')].join(' | ');
  const brandRows = BRAND_MAPPINGS.map((m) => {
    const cols = [m.ko, ...targetLanguages.map((l) => m[l])];
    return cols.join(' | ');
  }).join('\n');
  const brandTable = `| ${headerCols} |\n| ${headerSep} |\n${brandRows.split('\n').map((r) => `| ${r} |`).join('\n')}`;
  const preservedList = PRESERVED_TERMS.join(', ');
  const schemaExample = JSON.stringify(
    Object.fromEntries(targetLanguages.map((l) => [l, { '<key>': '<translated value>' }])),
    null, 2
  );

  return `You are a professional localization specialist for Shucle, a Korean MaaS (Mobility as a Service) platform operating DRT (Demand Responsive Transport) buses, autonomous vehicles, bike-sharing (\uc5b4\uc6b8\ub9c1/Eoullim), and mobility pass services (\uc774\uc751\ud328\uc2a4) across cities in Korea including Sejong (\uc138\uc885) and Gwangju (\uad11\uc8fc).

## Task
Translate the given Korean JSON key-value pairs into: ${selectedLangNames}.

The input may include both a Korean source and an English reference. Translate primarily from Korean. Use the English reference only when the Korean is ambiguous or culturally untranslatable.

Return ONLY a valid JSON object. No markdown code fences. No explanations. No extra text before or after the JSON.

## Output Schema
${schemaExample}

## Brand Name Rules \u2014 MANDATORY, do not deviate
${brandTable}

## Terms to Preserve Exactly (copy as-is, do not translate)
${preservedList}

## Format Preservation Rules \u2014 CRITICAL
1. Template variables like {{._0}}, {{._1}}, {{count}}, {{title}}, {{month}}, {{year}}, {{value}}, {{amount}} \u2192 copy EXACTLY as-is, including the double curly braces
2. HTML tags like <strong>, </strong>, <br> \u2192 copy EXACTLY as-is
3. Escape sequences like \\\\n (literal backslash-n in JSON strings) \u2192 preserve as \\\\n
4. Numbers, currency formatting, phone numbers \u2192 preserve as-is
5. Asterisk (*) at start of lines \u2192 preserve
6. Emoji characters \u2192 preserve

## Translation Style
- Japanese: Polite form (\u3067\u3059\u30fb\u307e\u3059\u8abf). Use \u69d8 for \ub2d8. Use \u3054/\u304a prefix for respectful nouns where natural.
- Simplified Chinese (zh_CN): Formal, use \u60a8/\u8bf7 register. Standard mainland Chinese conventions.
- Traditional Chinese (zh_TW): Formal, use \u60a8/\u8acb register. Taiwan conventions (e.g. \u61c9\u7528\u7a0b\u5f0f not \u5e94\u7528, \u6377\u904b for subway in Taipei context).
- Hungarian (hu): Formal register, use "\u00d6n/\u00d6nnek" for \ub2d8. Standard Hungarian UI conventions. Use natural Hungarian phrasing, not literal word-for-word translation.

## Key Domain Terms
- DRT (\uc218\uc694\uc751\ub2f5\ud615 \uad50\ud1b5): Demand Responsive Transport \u2014 keep as DRT
- \ud638\ucd9c (vehicle call/request): ja\u2192\u547c\u3073\u51fa\u3057\u30fb\u914d\u8eca\u30ea\u30af\u30a8\u30b9\u30c8, zh\u2192\u547c\u53eb, hu\u2192h\u00edv\u00e1s
- \ubc30\ucc28 (dispatch/assignment): ja\u2192\u914d\u8eca, zh\u2192\u6d3e\u8f66/\u6d3e\u8eca, hu\u2192kioszt\u00e1s
- \ud0d1\uc2b9 (boarding): ja\u2192\u4e57\u8eca, zh\u2192\u4e58\u8f66/\u4e58\u8eca, hu\u2192besz\u00e1ll\u00e1s
- \ud558\ucc28 (alighting): ja\u2192\u964d\u8eca, zh\u2192\u4e0b\u8f66/\u4e0b\u8eca, hu\u2192kisz\u00e1ll\u00e1s
- \ud658\uc2b9 (transfer): ja\u2192\u4e57\u308a\u7d99\u304e, zh\u2192\u6362\u4e58/\u8f49\u4e58, hu\u2192\u00e1tsz\u00e1ll\u00e1s
- \ubc14\uc6b0\ucc98 (voucher): keep as \u30d0\u30a6\u30c1\u30e3\u30fc/\u4f18\u60e0\u5238/\u512a\u60e0\u5238/utalv\u00e1ny
- \ud328\uc2a4 (pass): \u30d1\u30b9/\u901a\u884c\u8bc1/\u901a\u884c\u8b49/b\u00e9rlet

## Example
Input:
{"greeting": "\uc548\ub155\ud558\uc138\uc694, {{._0}}\ub2d8! DRT \ud638\ucd9c\uc774 \uc644\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4."}

Output (if targetLanguages = ['ja', 'zh_CN']):
{
  "ja": {"greeting": "\u3053\u3093\u306b\u3061\u306f\u3001{{._0}}\u69d8\uff01DRT \u306e\u914d\u8eca\u30ea\u30af\u30a8\u30b9\u30c8\u304c\u5b8c\u4e86\u3057\u307e\u3057\u305f\u3002"},
  "zh_CN": {"greeting": "\u60a8\u597d\uff0c{{._0}}\uff01DRT \u547c\u53eb\u5df2\u5b8c\u6210\u3002"}
}`;
}
