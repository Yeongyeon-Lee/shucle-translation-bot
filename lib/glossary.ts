export type TargetLanguage = 'ja' | 'zh_CN' | 'zh_TW' | 'hu';

export const LANGUAGE_LABELS: Record<TargetLanguage, string> = {
  ja: '일본어',
  zh_CN: '중국어(간체)',
  zh_TW: '중국어(번체)',
  hu: '헝가리어',
};

export const ALL_LANGUAGES: TargetLanguage[] = ['ja', 'zh_CN', 'zh_TW', 'hu'];

export interface BrandMapping {
  ko: string;
  ja: string;
  zh_CN: string;
  zh_TW: string;
  hu: string;
}

export const BRAND_MAPPINGS: BrandMapping[] = [
  { ko: '이응패스',     ja: 'イウンパス',      zh_CN: '应通行证',     zh_TW: '應通行證',    hu: 'Eung Pass'           },
  { ko: '이응버스',     ja: 'イウンバス',      zh_CN: '应巴士',       zh_TW: '應巴士',      hu: 'Eung Busz'           },
  { ko: '이응카드',     ja: 'イウンカード',    zh_CN: '应卡',         zh_TW: '應卡',        hu: 'Eung Kártya'         },
  { ko: '어울링',       ja: 'アウルリング',    zh_CN: 'Eoullim',      zh_TW: 'Eoullim',     hu: 'Eoullim'             },
  { ko: '광주투어버스', ja: '光州ツアーバス',  zh_CN: '光州旅游巴士',  zh_TW: '光州旅遊巴士', hu: 'Gwangju turisztikai busz' },
  { ko: '똑타',         ja: 'ドクタ',          zh_CN: 'Ddokta',       zh_TW: 'Ddokta',      hu: 'Ddokta'              },
  { ko: '두루타',       ja: 'ドゥルタ',        zh_CN: 'Duruta',       zh_TW: 'Duruta',      hu: 'Duruta'              },
  { ko: '세종',         ja: '世宗',            zh_CN: '世宗',         zh_TW: '世宗',        hu: 'Szejong'             },
  { ko: '드림',         ja: 'より',            zh_CN: '敬上',         zh_TW: '敬上',        hu: 'Üdzvözlettel'         },
];

// Terms that must be preserved as-is in all target languages
export const PRESERVED_TERMS = [
  'Shucle', 'DRT', 'K-Pass', 'MaaS', 'PM', 'QR',
  'Wi-Fi', 'APK', 'TTS',
];
