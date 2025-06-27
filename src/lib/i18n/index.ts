import type { Lang } from '$lib/types';

export const translations = {
  ja: {
    allPosts: '全投稿に戻る',
    blogTitle: 'Kota\'s Blog',
    allPostsTitle: 'All Posts - KOTA YATAGAI',
    allPostsDescription: 'All posts by Kota Yatagai',
    languageToggle: 'English',
    searchPlaceholder: '記事を検索...',
    searchNoResults: '検索結果が見つかりませんでした',
    categories: {
      computer: 'Computer',
      memoir: 'Memoir'
    }
  },
  en: {
    allPosts: 'Back to All Posts',
    blogTitle: 'Kota\'s Blog',
    allPostsTitle: 'All Posts - KOTA YATAGAI',
    allPostsDescription: 'All posts by Kota Yatagai',
    languageToggle: '日本語',
    searchPlaceholder: 'Search posts...',
    searchNoResults: 'No search results found',
    categories: {
      computer: 'Computer',
      memoir: 'Memoir'
    }
  }
} as const;

export type Translations = typeof translations.ja;

export function t(lang: Lang, key: keyof Translations): string;
export function t(lang: Lang, key: `categories.${keyof Translations['categories']}`): string;
export function t(lang: Lang, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

export function getHomeUrl(lang: Lang): string {
  return lang === 'ja' ? '/' : '/en';
}

export function getPostsUrl(lang: Lang): string {
  return lang === 'ja' ? '/posts' : '/en/posts';
}

export function getPostUrl(lang: Lang, path: string): string {
  return `${getPostsUrl(lang)}/${path}`;
}

export function getOgUrl(lang: Lang, path?: string): string {
  const base = lang === 'ja' ? 'https://blog.kota-yata.com' : 'https://blog.kota-yata.com/en';
  return path ? `${base}/posts/${path}` : `${base}/posts`;
}

export function getAlternateUrl(currentLang: Lang, currentPath: string): string {
  if (currentLang === 'ja') {
    // Switch to English - only go to English homepage for now to avoid 404s
    return '/en';
  } else {
    // Switch to Japanese - only go to Japanese homepage for now to avoid 404s  
    return '/';
  }
}