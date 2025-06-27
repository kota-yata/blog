<script lang="ts">
  import LanguageToggle from '$lib/LanguageToggle.svelte';
  import { t } from '$lib/i18n';
  import type { Lang } from '$lib/types';

  export let lang: Lang;
  export let showSearch: boolean = false;
  export let onSearchToggle: () => void;
</script>

<div class="top-controls">
  <button 
    class="search-toggle" 
    class:active={showSearch} 
    on:click={onSearchToggle}
    aria-label={showSearch ? 'Hide search' : 'Show search'}
  >
    🔍
  </button>
  <LanguageToggle {lang} />
</div>

<style lang="scss">
  @import '../styles/variable.scss';
  
  .top-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 12px;
    align-items: center;
    z-index: 1000;
    flex-direction: row-reverse;
  }

  .search-toggle {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid $border-white;
    border-radius: 20px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    
    &:hover {
      background: rgba(255, 255, 255, 1);
      border-color: $orange;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    &.active {
      background: $orange;
      border-color: $orange;
      color: white;
    }
  }

  @media screen and (max-width: 700px) {
    .top-controls {
      top: 10px;
      right: 10px;
      gap: 8px;
    }

    .search-toggle {
      width: 36px;
      height: 36px;
      font-size: 14px;
    }
  }
</style>