import { getPosts } from '../../lib/posts/getPosts';

const xml = (posts: postMeta[]) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:dc="https://purl.org/dc/elements/1.1/" xmlns:content="https://purl.org/rss/1.0/modules/content/" xmlns:atom="https://www.w3.org/2005/Atom" version="2.0">
<channel>
  <title>Kota Yatagai</title>
  <link>https://blog.kota-yata.com</link>
  <description><![CDATA[Technical posts by Kota Yatagai]]></description>
  ${posts.map(
    post => {
      // Date format adaptation for sugokunaritai-gakusei-group/sgg-feed
      const dateSplitted: number[] = post.meta.date.split('-').map((s) => parseInt(s));
      const date = new Date(dateSplitted[0], dateSplitted[1] - 1, dateSplitted[2], 0, 0, 0, 0);
      return `
        <item>
          <title><![CDATA[${post.meta.title}]]></title>
          <description><![CDATA[${post.meta.description}]]></description>
          <category>${post.meta.category}</category>
          <author>kota-yata</author>
          <link>https://blog.kota-yata.com/posts/${post.path}</link>
          <guid isPermaLink="true">https://blog.kota-yata.com/posts/${post.path}</guid>
          <pubDate><![CDATA[${date.toUTCString()}]]></pubDate>
          <enclosure url="${`https://blog.kota-yata.com/ogp/${post.meta.ogp}.png`}" length="0" type="image/png"/>
          <dc:creator>Kota Yatagai</dc:creator>
        </item>
      `;
    }
  ).join('')}
</channel>
</rss>`;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const GET = async (): Promise<Response> => {
  const headers = {
    'Cache-Control': 'max-age=0, s-maxage=600',
    'Content-Type': 'application/xml',
  };
  const posts = getPosts();
  const body = xml(posts);
  return new Response(body, { headers });
};
