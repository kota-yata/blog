import type { PageServerLoad } from './$types';
import { getPosts } from '$lib/posts/getPosts';

export const load: PageServerLoad = async ({ locals }) => {
  // Get all posts for management
  const posts = getPosts('ja', 0, ''); // Get all Japanese posts
  const postsEn = getPosts('en', 0, ''); // Get all English posts
  
  return {
    posts,
    postsEn,
    username: locals.session.username
  };
};