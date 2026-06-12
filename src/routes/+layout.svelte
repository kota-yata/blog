<script lang="ts">
  import '../styles/app.scss';
  import '../styles/fonts.scss';
  import '../styles/a11y-dark.min.css';
  import '../styles/katex.min.css';
  import { dev } from '$app/environment';

  const analyticsSrc = dev
    ? 'https://va.vercel-scripts.com/v1/script.debug.js'
    : '/_vercel/insights/script.js';
</script>

<svelte:head>
  <script defer src={analyticsSrc}></script>
</svelte:head>

<main>
  <slot />
</main>

<footer>Kota Yatagai</footer>

<style lang="scss">
  @import '../styles/variable.scss';

  main {
    margin: 0 auto;
    width: 85%;
  }
  footer {
    width: 100vw;
    text-align: center;
    padding: 100px 0 10px 0;
  }

  @media screen and (max-width: 600px) {
    main {
      width: 95%;
    }
  }
</style>
