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
    trailingSlash: 'always'
  },
};

export default config;
