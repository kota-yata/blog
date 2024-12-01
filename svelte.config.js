import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // hydrate the <div id="svelte"> element in src/app.html
    // target: '#svelte',
    adapter: adapter({
      pages: 'build',
      assets: 'build',
    }),
    prerender: {
      entries: [
        '/posts/ceratopyus',
        '/posts/memoir-20231108',
        '/posts/memoir-20231120',
        '/posts/sep2022'
      ],
    }
  },
};

export default config;
