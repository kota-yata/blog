---
title: SvelteKitのprerender対象を指定する
date: 2025-03-07
category: Computer
description: クローラーに見つからないページを指定
ogp: svkit-prerender
---

最近このブログのUI変更としてカテゴリタブを導入した。

![category tab](/media/blog-category-tab.png)
（トップページのこれ↑）

カテゴリ分けがめんどいので今は2種類だけだが、増やせるように設計されている。

ところで、この変更後のビルドで、Memoirカテゴリの記事ページがどれもレンダリングされないという問題が発生した。これはこのブログサイトで使っているSveltekitの仕様によるものである。このサイトではビルド時に全ての記事をレンダリングするSSG方式を採っており、Sveltekitは静的なページからクローリングすることでレンダリングするページを見つけている。
>SvelteKit will discover pages to prerender automatically, by starting at entry points and crawling them. By default, all your non-dynamic routes are considered entry points
> https://svelte.dev/docs/kit/page-options#entries

例えば/blogという記事一覧が載るパスと/blog/[slug]という各記事がダイナミックにレンダリングされるパスがあった時、/blogは静的なページなのでエントリーポイントとしてみなされ、/blogのレンダリング結果をクロールすることで/blog/[slug]配下の各ページを見つけていく。

ここで先ほどのカテゴリタブに話を戻す。このブログのトップページではデフォルトでComputerカテゴリが設定されており、レンダリング時にはComputerカテゴリの記事が並ぶ。なのでComputerカテゴリの記事はクローラーに見つかり対象になるが、Memoirカテゴリの記事はクローラーには見つからず、レンダリングされない。その結果、Memoirページに行って記事のURLに飛んでも空のページが表示されるだけ、という現象が起きるのである。

### 解決策
これを解決するには、Memoirの記事たちもいるよ、プリレンダリングして欲しいよ、というのをSveltekitに伝える必要がある。この方法は2つある。

1つ目は`svelte.config.js`に愚直にパスを記述していく方法。
```js
const config = {
  kit: {
    prerender: {
      entries: ['/blog/hoge', '/blog/fuga', '/blog/hogehgoe'...]
    }
  }
}
```
これはブログの様な大量に指定対象があるケースではやってられないというのと、本来クロールで見つかっていたはずのページもここに記載していないとレンダリングしてくれない（prerender指定しているとエラーが出る）、という点で採用しかねる。

2つ目の、実際に採用した方法が、動的パス配下の`+page.server.ts`でプリレンダリング対象のパスを全て列挙する方法である。このブログではroutes/posts/[path]配下に記事が入るので、そこで全ての記事を指定するように`entries`関数を追加した。
```ts
import { getPosts } from "$lib/posts/getPosts"

export const entries = () => {
  const posts = getPosts(); // これで全ての記事のパスを取ってくる
  return posts.map(post => { return {path: `${post.path}`}});
}

export const prerender = true;
```
このentries関数を使うにはSveltekitのバージョンが1.16.0以上である必要がある（[CHANGELOG](https://github.com/sveltejs/kit/blob/main/packages/kit/CHANGELOG.md)）。

これでMemoirカテゴリの記事もちゃんとプリレンダリングされる様になり、一件落着。
