import { getPosts } from "$lib/posts/getPosts"

export const entries = () => {
  const posts = getPosts();
  return posts.map(post => { return {path: `${post.path}`}});
}

export const prerender = true;
