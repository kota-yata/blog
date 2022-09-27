<script lang="ts">
  import { fade } from 'svelte/transition';

  import '../styles/app.scss';
  import '../styles/fonts.scss';
  import '../styles/a11y-dark.min.css';
  import '../styles/katex.min.css';
</script>

<main>
  <slot />
</main>

<footer>@ 2021 Kota Yatagai</footer>

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
