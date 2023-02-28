import fs from 'fs';
import { process } from '$lib/posts/process';

export const GET = ({ params }: { params: { path: string } }): Response => {
  const { path } = params;
  const data = fs.readFileSync(`src/contents/posts/${path}.md`, 'utf8');
  const post = process(path, data);
  return new Response(JSON.stringify(post), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
