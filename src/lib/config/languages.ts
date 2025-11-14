/**
 * Language configuration for track metadata
 * Supports South African languages, French, Portuguese, Shona, Ndebele, and others
 */

export interface LanguageOption {
  code: string;
  name: string;
  nativeName?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', name: 'Auto-detect', nativeName: 'Auto-detect' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'nso', name: 'Northern Sotho', nativeName: 'Sesotho sa Leboa' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenda' },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga' },
  { code: 'ss', name: 'Swati', nativeName: 'SiSwati' },
  { code: 'nr', name: 'Southern Ndebele', nativeName: 'isiNdebele' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona' },
  { code: 'nd', name: 'Ndebele', nativeName: 'isiNdebele' },
  { code: 'other', name: 'Other', nativeName: 'Other' },
];

export function getLanguageByCode(code: string): LanguageOption | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getLanguageDisplayName(code: string): string {
  const lang = getLanguageByCode(code);
  return lang?.nativeName || lang?.name || code;
}
