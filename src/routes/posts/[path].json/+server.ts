import fs from 'fs';
import { cwd } from 'process';
import { process } from '$lib/posts/process';
import { env } from '$env/dynamic/private';

const generateOGP = async (post: post): Promise<void> => {
  const path = `${cwd()}/static/ogp/${post.path}.png`;
  if (fs.existsSync(path)) return;
  
  try {
    console.log(`Generating OGP for ${post.path}`);
    const res: Response = await fetch(
      `https://blog-img-gen.an.r.appspot.com?title=${post.meta.title}&category=${post.meta.category}&desc=${post.meta.description}`,
      { headers: { Authorization: `Bearer ${env.BEARER_TOKEN}` } }
    );
    if (res.ok) {
      const blobFile: Blob = await res.blob();
      const ab = await blobFile.arrayBuffer();
      const buffer = Buffer.from(ab);
      fs.writeFileSync(path, buffer);
    }
  } catch (error) {
    console.log(`Failed to generate OGP for ${post.path}:`, error);
    // Continue without OGP image - this is not critical
  }
};

export const GET = async ({ params }: { params: { path: string } }): Promise<Response> => {
  const { path } = params;
  const data = fs.readFileSync(`src/contents/posts/${path}.md`, 'utf8');
  const post = process(path, data);
  await generateOGP(post);
  return new Response(JSON.stringify(post), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
