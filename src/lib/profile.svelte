<script lang="ts">
  const icons: { image: string; link: string }[] = [
    { image: '/github.svg', link: 'https://github.com/kota-yata' },
    { image: '/twitter.svg', link: 'https://twitter.com/kota_yata' },
    { image: '/speakerdeck.svg', link: 'https://speakerdeck.com/kota_yata/' },
    // { image: '/spotify.svg', link: 'https://open.spotify.com/user/jgm80x9h1j84hnk4nv3hozlaf' }
    { image: '/rss.svg', link: '/rss.xml' }
  ];
</script>

<div class="container">
  <img alt="myself" src="/me.webp" width="150px" height="150px" />
  <div class="bio">
    <h4>八谷 航太</h4>
    <p class="bio-enname">Kota Yatagai</p>
    <p>
      趣味で暗号技術や分散型システムに触れつつ、学生インターン兼エンジニアとしてCode for Japanに所属しています。
      詳しい活動などは<a href="https://kota-yata.com">kota-yata.com</a>をご覧ください
    </p>
  </div>
  <div class="icons">
    {#each icons as icon}
      <a href={icon.link} rel="external"><img alt="icon" src={icon.image} width="20px" height="20px" /></a>
    {/each}
  </div>
</div>

<style lang="scss">
  @import '../styles/variable.scss';

  .container {
    min-width: 280px;
    overflow-y: visible;
    & > img {
      border-radius: 50%;
      object-fit: cover;
    }
    .bio {
      & > h4 {
        padding: 10px 0 5px 0;
        font-weight: 600;
      }
      & > p {
        font-size: 13px;
        line-height: 20px;
        color: $dark-gray;
        width: 100%;
        padding: 0;
      }
      &-enname {
        margin-bottom: 10px;
      }
    }
    .icons {
      margin-top: 20px;
      & > a {
        padding-right: 15px;
      }
    }
  }
</style>
