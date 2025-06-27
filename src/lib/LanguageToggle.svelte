<script lang="ts">
  import { page } from '$app/stores';
  import { t, getAlternateUrl } from '$lib/i18n';
  import type { Lang } from '$lib/types';

  export let lang: Lang;
  
  $: alternateUrl = getAlternateUrl(lang, $page.url.pathname);
</script>

<a href={alternateUrl} class="language-toggle">
  {t(lang, 'languageToggle')}
</a>

<style lang="scss">
  @import '../styles/variable.scss';
  
  .language-toggle {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid $border-white;
    border-radius: 20px;
    text-decoration: none;
    color: $dark-gray;
    font-weight: 600;
    font-size: 14px;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
    white-space: nowrap;
    
    &:hover {
      background: rgba(255, 255, 255, 1);
      border-color: $orange;
      color: $orange;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  @media screen and (max-width: 700px) {
    .language-toggle {
      top: 10px;
      right: 10px;
      padding: 6px 12px;
      font-size: 12px;
    }
  }
</style>