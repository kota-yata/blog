<script lang="ts">
  import Profile from '$lib/profile.svelte';
  import PostCard from '$lib/posts/postCard.svelte';
  export let data;
  let { posts } = data.props;

  let selectedTab = 'Computer';
</script>

<svelte:head>
  <title>All Posts - KOTA YATAGAI</title>
  <meta name="description" content="All posts by Kota Yatagai" />
  <meta property="og:url" content="https://blog.kota-yata.com/posts" />
  <meta property="og:title" content="All Posts - KOTA YATAGAI" />
  <meta property="og:image" content="https://blog.kota-yata.com/ogp.webp" />
  <meta property="og:description" content="All posts by Kota Yatagai" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@kota_yata" />
</svelte:head>

<div class="container">
  <div class="profile"><Profile /></div>
  <div class="slot">
    <div class="tab">
      <button on:click={() => { selectedTab = 'Computer'}}>Computer</button>
      <button on:click={() => { selectedTab = 'Memoir' }}>Memoir</button>
    </div>
    {#each posts as post}
      {#if post.meta.category === selectedTab}
      <div class="post-container"><PostCard meta={post} /></div>
      {/if}
    {/each}
  </div>
</div>

<style lang="scss">
  @import '../styles/variable.scss';

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
      .tab {
        width: 100%;
        margin-bottom: 30px;
        text-align: center;
        button {
          font-weight: 600;
          color: $dark-gray;
          text-decoration: underline;
        }
      }
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
