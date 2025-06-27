export const load = async (data) => {
  const url = `/posts/${data.params.path}.json`;
  const res: Response = await data.fetch(url);
  if (!res.ok) return { post: null, lang: 'ja' as const };
  const post: post = await res.json();
  return { post, lang: 'ja' as const };
};
