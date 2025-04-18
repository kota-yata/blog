---
title: 暗号モードまとめ
date: 2021-05-15
category: Computer
description: 暗号を基礎から勉強しようの会
ogp: ctsenc
---

暗号モードというのはブロック暗号において、長い平文を暗号化するための前置き的な手順です。言い換えれば暗号アルゴリズムの入力の決め方みたいなもの。
僕自身で発展させた知見はないので[Scrapbox](https://scrapbox.io/chicken/)の方に書こうかなとも思ったんだけど、見出し使うしある程度体系化されてるのでこっちに書きます。

<details>
  <summary>目次</summary>
  <ul>
    <li>ECBモード</li>
    <li>CBCモード</li>
    <li>CTSモード</li>
    <li>CFBモード</li>
    <li>OFBモード</li>
    <li>CTRモード</li>
  </ul>
</details>

## Electric CodeBlock (ECB)
ブロックに区切られた暗号文をそのまま順番に暗号化して暗号文ブロックをつなぎ合わせる方法。最も単純かつ最も脆弱。

![ECBモードの暗号化](/media/ecbenc.png)

### ECBモードが脆弱な理由
ECBを使うべきでない理由は単に、暗号文を解読することなく平文を操作できるからです。取引データなど同じフォーマットで平文が繰り返されている場合、平文を読むことなく暗号文のパターンを把握し、その順番を入れ替えることで平文を操作できてしまうのです。他のモードであれば暗号文をいじれば平文のメッセージに意味がなくなる場合がほとんどですが、ECBでは意味の通る状態で平文を書き換えられるわけです。

## Cipher Block Chaining (CBC)
CBCは一つ前の暗号文ブロックと平文ブロックのXORをとる方法。これをすることでECBの問題であった「平文のパターンがバレる」という問題は解決します。

![CBCモードの暗号化](/media/cbcenc.png)

復号はこれを逆に実行すれば良いだけですが、ビットが破損した場合その平文と、破損した暗号文とXORを取る平文の二つの復号に影響が出ます。また暗号文のビットが欠落した場合、その後の暗号文ブロックが全てズレて復号してもわけが分からなくなります。

図にあるように最初は「初期化ベクトル」なるランダムなビット列と平文でXORをとります。この初期化ベクトルがランダムでないと1ブロック目に同じ平文が来た時に同じ暗号文ブロックが出力されてしまうので、ECB同様攻撃者に情報を与えてしまうことになります。

### CBCの弱点
初期化ベクトルをいじることができれば、最初の平文の1ビットごとの操作が可能になります。[TLS1.0では前回暗号化した最後のブロックを初期化ベクトルとして用いていた](https://jvndb.jvn.jp/ja/contents/2011/JVNDB-2011-002305.html)のでこの攻撃が可能でしたが、先述の通り正しく実装されていれば初期化ベクトルはランダム生成なのでほとんどの場合不可能でしょう。

また平文をブロックの整数倍に合わせる際のパディング内容を若干変化させながら暗号文を送信し、そのエラー文から平文情報を得る**パディングオラクル攻撃**の対象にもなります。パディングオラクル攻撃に関しては、デジタル署名なりで送り手を認証し、変な送信元だったら抽象的なエラーメッセージしか返さないことで対策できます。

さらに、複数の暗号文ブロックをすり替えた時に最初の平文ブロック以外は正しく復号できてしまうので平文を書き換えることができてしまいます。これを**再生攻撃**と言います。

セキュリティ以外で言えば、前の暗号文ブロックを利用するため並列処理ができない点は痛いですね。

## Cipher Text Stealing (CTS)
パディングに前の暗号文ブロックの末尾を用いる方法。ECBモードやCBCモードと組み合わせて使うモードで、パディングに利用したブロックの部分は暗号文としては使用しません。CTSモードを使っていることが分かっていれば、末尾の特定のサイズはXORにかけずその前の暗号文の末尾として復号を進めれば良いので復号も問題なくできます。

![CTSモードの暗号化](/media/ctsenc.png)

## Cipher-FeedBack (CFB)
一つ前の暗号文ブロックを暗号アルゴリズムの入力にし、それと平文のXORをとって暗号文ブロックとする方法。一見平文から暗号文ブロックを生成する間に暗号化がないので不安になりますが（少なくとも僕はなった）その後で暗号文ブロックを暗号化する処理があるので結果的には暗号アルゴリズムの恩恵を受けられる仕組みになっています。

![CFBモードの暗号化](/media/cfbenc.png)

復号の際は同じように、前の暗号文ブロックを**暗号化**したビット列と暗号文のXORをとって平文を取得します。ここで、XORで同じ値を出力するには暗号化の際と同じ値が必要なため、前の暗号文ブロックを復号ではなく暗号化するのです。

図を見るとわかる通り、平文から暗号文を導出する時はXORをとって1ビットずつ生成しています。なのでCFBモードはストリーム暗号を作っているとみなせるのです。

### CFBの弱点
CBC同様に再生攻撃のリスクと、並列処理ができないという欠点があります。また、暗号文の1ビットを反転させると平文の1ビットも反転するという脆弱性があります。

## Output-FeedBack (OFB)
前の暗号アルゴリズムの出力を入力として鍵ストリームを作成し、それと平文のXORをとって暗号文とする方法。先に鍵ストリームを作っておくことができ、そうすればあとはXORをとるだけなので非常に高速化かつ並列処理が可能になります。

![OFBモードの暗号化](/media/ofbenc.png)

### OFBの弱点
再生攻撃などの弱点は克服していますが、暗号文のビット反転が平文のビットに影響するという弱点は変わりません。それに加えて、万が一前の鍵ストリームの暗号化結果が暗号化前と同じになってしまった場合、暗号アルゴリズムは常に同じなためそれ以降の鍵ストリームが全て同じになってしまうというリスクがあります。

## CounTeR (CTR)
暗号化のたびに増加するカウンタを用いて鍵ストリームを生成する方法です。CFBやOFB同様、機能的にはストリーム暗号です。

毎度nonceを生成し、その後にカウンタを挿入します。128bitsのブロック長だった場合、前半8bitsがnonce、後半8bitsがブロック番号になります。

```js
// カウンタ初期値の例（カウント1の時）
6d 5f 17 f1 24 c7 bb 4e 00 00 00 00 00 00 00 01
```

![CTRモードの暗号化](/media/ctrenc.png)

CTRモードの長所としては、OFB同様に暗号化と復号の構造が全く同じなので実装が楽なことと、nonceとブロック番号からカウンタが求められるので暗号化の段階から並列処理が可能なことが挙げられます。また、OFBモードにあった鍵ストリームの暗号化結果によってはそれ以降の鍵ストリームが全て同じになるという脆弱性は、そもそも前の鍵ストリームを利用しないCTRモードには残っていません。

# おわりに
これで暗号スイート見てもモードが何を意味してるのか分かるようになりました。万歳
