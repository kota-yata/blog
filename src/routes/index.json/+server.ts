import { getPosts } from '$lib/posts/getPosts';

export const GET = (): Response => {
  const body = getPosts();
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
