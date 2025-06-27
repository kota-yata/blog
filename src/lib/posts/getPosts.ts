import fs from 'fs';
import { separateData, formatMeta } from '$lib/posts/process';
import type { Lang } from '$lib/types';

const filterPosts = (posts: postMeta[], num = 0, category = ''): postMeta[] => {
  let postsToReturn = posts;
  if (num > 0) postsToReturn = posts.slice(0, num);
  if (category) postsToReturn = postsToReturn.filter((post) => post.meta.category === category);
  return postsToReturn;
};

// Getting posts during build
const getMeta = (data: string): meta => {
  const separatedData = separateData(data);
  const meta = formatMeta(separatedData.meta);
  return meta;
};

const retrieveMetaFromMarkdown = (fileName: string): { path: string, meta: meta } => {
  const path = fileName.split('.')[0];
  const isEn = path.endsWith('-en') // temporary solution
  const base = !isEn ? 'src/contents/posts' : 'src/contents/posts-en';
  return {
    path: path,
    meta: getMeta(fs.readFileSync(`${base}/${fileName}`).toString())
  };
};

export const getPosts = (lang: Lang = 'ja', num = 0, category = ''): postMeta[] => {
  const url = lang === 'ja' ? 'src/contents/posts' : 'src/contents/posts-en';
  const posts = fs.readdirSync(url).map(retrieveMetaFromMarkdown);
  posts.sort((a: postMeta, b: postMeta): number => {
    const aDate = Date.parse(a.meta.date);
    const bDate = Date.parse(b.meta.date);
    return aDate > bDate ? -1 : 1;
  });
  const result = filterPosts(posts, num, category);
  return result;
};

// Getting posts with given filters from client
// Simply fetching /posts.json since it should be already generated
export const getPostsClient = async (doFetch: (arg0: string) => Promise<Response>, num = 0, category = '', lang: Lang = 'ja'): Promise<postMeta[]> => {
  const url = lang === 'ja' ? '/index.json' : '/en/index.json';
  const res = await doFetch(url);
  if (!res.ok) return [];
  const posts: postMeta[] = await res.json();
  if (num > posts.length) throw Error('arg2 must be smaller than the length of posts');
  const filtered = filterPosts(posts, num, category);
  return filtered;
};
