export const load = async (data) => {
  const url = `/en/posts/${data.params.path}.json`;
  const res: Response = await data.fetch(url);
  if (!res.ok) return;
  const post: post = await res.json();
  return { post };
};
