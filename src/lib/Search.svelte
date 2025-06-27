<script lang="ts">
  import Fuse from 'fuse.js';
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import PostCard from '$lib/posts/postCard.svelte';
  import type { Lang } from '$lib/types';

  export let posts: postMeta[] = [];
  export let lang: Lang;

  let searchQuery = '';
  let searchResults: postMeta[] = [];
  let fuse: Fuse<postMeta>;
  let isSearching = false;
  let searchInput: HTMLInputElement;

  // Initialize Fuse.js
  onMount(() => {
    const options = {
      keys: [
        { name: 'meta.title', weight: 0.7 },
        { name: 'meta.description', weight: 0.3 },
        { name: 'meta.category', weight: 0.2 }
      ],
      threshold: 0.3, // Lower = more strict, higher = more fuzzy
      includeScore: true,
      minMatchCharLength: 2,
    };
    
    fuse = new Fuse(posts, options);
  });

  // Handle search
  $: if (fuse && searchQuery.trim()) {
    isSearching = true;
    const results = fuse.search(searchQuery.trim());
    searchResults = results.map(result => result.item);
    isSearching = false;
  } else {
    searchResults = [];
  }

  // Clear search
  function clearSearch() {
    searchQuery = '';
    searchResults = [];
    searchInput?.focus();
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      clearSearch();
    }
  }
</script>

<div class="search-container">
  <div class="search-box">
    <input
      bind:this={searchInput}
      bind:value={searchQuery}
      on:keydown={handleKeydown}
      type="text"
      placeholder={t(lang, 'searchPlaceholder')}
      class="search-input"
    />
    {#if searchQuery}
      <button on:click={clearSearch} class="clear-button" aria-label="Clear search">
        ✕
      </button>
    {/if}
  </div>

  {#if searchQuery && searchResults.length === 0 && !isSearching}
    <div class="no-results">
      {t(lang, 'searchNoResults')}
    </div>
  {/if}

  {#if searchResults.length > 0}
    <div class="search-results">
      <div class="results-header">
        {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for "{searchQuery}"
      </div>
      <div class="results-list">
        {#each searchResults as post}
          <div class="result-item">
            <PostCard meta={post} {lang} />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  @import '../styles/variable.scss';

  .search-container {
    width: 100%;
    margin-bottom: 30px;
  }

  .search-box {
    position: relative;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px;
    padding-right: 40px;
    border: 2px solid $border-white;
    border-radius: 25px;
    font-size: 16px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: $orange;
      box-shadow: 0 2px 12px rgba(255, 154, 77, 0.2);
    }

    &::placeholder {
      color: $dark-gray;
      opacity: 0.7;
    }
  }

  .clear-button {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: $dark-gray;
    font-size: 18px;
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: $orange;
    }
  }

  .no-results {
    text-align: center;
    color: $dark-gray;
    font-style: italic;
    margin-top: 20px;
    padding: 20px;
  }

  .search-results {
    margin-top: 20px;
  }

  .results-header {
    font-size: 14px;
    color: $dark-gray;
    margin-bottom: 15px;
    font-weight: 600;
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .result-item {
    padding: 20px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    border: 1px solid $border-white;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.8);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
  }

  @media screen and (max-width: 700px) {
    .search-input {
      font-size: 16px; // Prevent zoom on iOS
      padding: 10px 14px;
      padding-right: 36px;
    }

    .clear-button {
      right: 10px;
      width: 22px;
      height: 22px;
      font-size: 16px;
    }

    .result-item {
      padding: 15px;
    }
  }
</style>