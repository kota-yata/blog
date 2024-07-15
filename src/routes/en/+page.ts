import { getPostsClient } from '$lib/posts/getPosts';

export const load = async ({ fetch }): Promise<postsProps> => {
  const posts = await getPostsClient(fetch, 0, '', 'en');
  return { props: { posts } };
};
