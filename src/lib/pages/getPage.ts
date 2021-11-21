export const getPage = async (doFetch: (arg0: string) => Promise<Response>, url: string): Promise<{ props: { html: string } }> => {
  const res = await doFetch(url);
  if (!res.ok) return;
  const { html } : pages = await res.json();
  return { props: { html } };
};