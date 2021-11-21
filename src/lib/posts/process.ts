import markdownToHTML from 'zenn-markdown-html';

const separateData = (data: string): { meta: string[], body: string } => {
  const separated = data.split('---');
  const meta = separated[1].split(/\n/g);
  const body = separated.slice(2).join('---');
  return { meta, body };
};

const formatMeta = (data: string[]): meta => {
  const lines = data.slice(1, data.length - 1);
  const frontMatter = {} as meta;
  lines.map(c => {
    const content = c.split(':');
    content[1] = content[1].split(' ').slice(1).join(' ');
    frontMatter[content[0]] = content[1];
  });
  return frontMatter;
};

export const parseMD = (data: string): string => {
  const html = markdownToHTML(data);
  return html;
};

export const process = (data: string): post => {
  const separatedData = separateData(data);
  const meta = formatMeta(separatedData.meta);
  const body = parseMD(separatedData.body);
  return { meta, body };
};

export const getMeta = (data: string): meta => {
  const separatedData = separateData(data);
  const meta = formatMeta(separatedData.meta);
  return meta;
};