<script lang="ts">
  export let meta: postMeta = {} as postMeta;
  export let displayEyecatch = false;
  export let lang: 'ja' | 'en' = "ja";
  import { getPostUrl } from '$lib/i18n';

  $: postPath = lang === 'ja' ? '/posts' : '/en/posts';
</script>

<div class="container">
  {#if displayEyecatch}
    <picture width="100%" height="200px">
      <source srcset={`/ogp/${meta.meta.ogp}.png`} type="image/png" />
      <img alt="eyecatch" src={`/ogp/${meta.meta.ogp}.png`} width="100%" height="200px" />
    </picture>
  {/if}
  <div class="info">
    <span class="info-tag">{meta.meta.category}</span>
    <span class="info-date">{meta.meta.date}</span>
  </div>
  <h3><a href="{postPath}/{meta.path}/">{meta.meta.title}</a></h3>
  <p>{meta.meta.description}</p>
</div>

<style lang="scss">
  @import '../../styles/variable.scss';
  .container {
    a {
      color: $code;
    }
    width: 100%;
    & > picture > img {
      width: 100%;
      object-fit: cover;
    }
    .info {
      padding: 10px 0 0 0;
      font-size: 14px;
      font-weight: 600;
      &-tag {
        color: $orange;
        padding-right: 5px;
      }
      &-date {
        color: gray;
      }
    }
    & > h3 {
      padding: 5px 0 10px 0;
      & > a {
        text-decoration: none;
      }
    }
    & > p {
      padding: 0;
    }
  }
</style>
