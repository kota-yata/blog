import { getPostsClient } from '$lib/posts/getPosts';

export const load = async ({ fetch }): Promise<postsProps> => {
  const posts = await getPostsClient(fetch);
  return { props: { posts } };
};
