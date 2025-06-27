<script lang="ts">
  import Profile from '$lib/profile.svelte';
  import PostCard from '$lib/posts/postCard.svelte';
  import LanguageToggle from '$lib/LanguageToggle.svelte';
  import { t } from '$lib/i18n';
  export let data;
  let { posts, lang } = data;
</script>

<svelte:head>
  <title>{t(lang, 'allPostsTitle')}</title>
  <meta name="description" content={t(lang, 'allPostsDescription')} />
  <meta property="og:url" content="https://blog.kota-yata.com/en/posts" />
  <meta property="og:title" content={t(lang, 'allPostsTitle')} />
  <meta property="og:image" content="https://blog.kota-yata.com/ogp.webp" />
  <meta property="og:description" content={t(lang, 'allPostsDescription')} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@kota_yata" />
</svelte:head>

<LanguageToggle {lang} />

<div class="container">
  <div class="profile"><Profile {lang} /></div>
  <div class="slot">
    {#each posts as post}
      <div class="post-container"><PostCard meta={post} {lang} /></div>
    {/each}
  </div>
</div>

<style lang="scss">
  @import '../../styles/variable.scss';

  .container {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-top: 6vh;
    .profile {
      width: 280px;
      height: 400px;
      padding-right: 30px;
      border-right: 1px $border-white solid;
    }
    .slot {
      width: calc(100% - 280px - 100px);
      .post-container {
        margin-bottom: 40px;
      }
    }
  }

  @media screen and (max-width: 700px), screen and (orientation: portrait) {
    .container {
      display: block;
      .profile {
        width: 80%;
        text-align: center;
        margin: 0 auto;
        border: none;
        height: auto;
        padding-right: 0;
        padding-bottom: 20px;
        margin-bottom: 20px;
        border-bottom: 1px $border-white solid;
      }
      .slot {
        width: 100%;
        padding: 0;
      }
    }
  }
</style>
