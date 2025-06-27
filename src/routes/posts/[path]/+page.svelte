<script lang="ts">
  import { onMount } from 'svelte';
  import { t, getHomeUrl, getOgUrl } from '$lib/i18n';
  export let data;
  let { post, lang } = data;
  
  // Guard against missing post data
  if (!post) {
    throw new Error('Post not found');
  }
  let twitterText: string;
  let pocketText: string;
  let instaPaperText: string;
  onMount(() => {
    twitterText = `https://twitter.com/intent/tweet?url=${window.location.href}&text=${post.meta.title}｜Kota Yatagai&related=kota_yata`;
    pocketText = `https://getpocket.com/save?url=${window.location.href}`;
    instaPaperText = `https://instapaper.com/edit?url=${window.location.href}&title=${post.meta.title}`;
  });
</script>

<svelte:head>
  <title>{post.meta.title}</title>
  <meta name="description" content={post.meta.description} />
  <meta property="og:url" content={getOgUrl(lang, post.path)} />
  <meta property="og:title" content={post.meta.title} />
  <meta property="og:image" content="https://blog.kota-yata.com/ogp/{post.path}.png" />
  <meta property="og:description" content={post.meta.description} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@kota_yata" />
</svelte:head>

<div class="root">
  <header>
    <a href={getHomeUrl(lang)}>{t(lang, 'blogTitle')}</a>
  </header>
  <div class="info">
    <h1 class="info-title">{post.meta.title}</h1>
    <span class="info-date">{post.meta.date}</span>
    <span class="info-category">{post.meta.category}</span>
  </div>
  <div class="post">
    {@html post.body}
  </div>
  <div class="share">
    <a class="share-twitter" href={twitterText} target="blank"
      ><img alt="Twitter share button" src="/twitter-white.svg" width="25px" height="25px" /></a
    >
    <a class="share-pocket" href={pocketText} target="blank"
      ><img alt="Pocket share button" src="/pocket.svg" width="25px" height="25px" /></a
    >
    <a class="share-instapaper" href={instaPaperText} target="blank"
      ><img alt="InstaPaper share button" src="/instapaper.svg" width="25px" /></a
    >
  </div>
  <div class="back">
    <a href={getHomeUrl(lang)}>{t(lang, 'allPosts')}</a>
  </div>
</div>

<style lang="scss">
  @import '../../../styles/variable.scss';

  .root {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    header {
      width: 100%;
      padding-top: 30px;
      text-align: center;
      a {
        text-decoration: none;
        color: $dark-gray;
        font-weight: 600;
        font-size: 20px;
      }
    }
    .info {
      padding-top: 10vh;
      padding-bottom: 50px;
      font-weight: 600;
      &-title {
        padding: 0 0 10px 0;
        font-size: 48px;
        border: none;
      }
      &-date {
        color: $dark-gray;
        padding-right: 10px;
      }
      &-category {
        color: $orange;
      }
    }
    .share {
      width: 100%;
      margin: 50px 0;
      text-align: center;
      & > a {
        cursor: pointer;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        padding: 17.5px;
        margin: 0 10px;
        display: inline-block;
      }
      &-twitter {
        background: $twitter;
      }
      &-pocket {
        background: $pocket;
      }
      &-instapaper {
        background: $insta-paper;
      }
    }
    .back {
      text-align: center;
    }
  }

  @media screen and (max-width: 700px) {
    .root {
      width: 95%;
      .info {
        &-title {
          font-size: 28px !important;
        }
      }
    }
  }
</style>
