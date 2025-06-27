export const load = async (data) => {
  const url = `/en/posts/${data.params.path}.json`;
  const res: Response = await data.fetch(url);
  if (!res.ok) return { post: null, lang: 'en' as const };
  const post: post = await res.json();
  return { post, lang: 'en' as const };
};
