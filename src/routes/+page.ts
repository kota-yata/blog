import { getPostsClient } from '$lib/posts/getPosts';

export const load = async ({ fetch }) => {
  const posts = await getPostsClient(fetch, 0, '', 'ja');
  return { posts, lang: 'ja' as const };
};