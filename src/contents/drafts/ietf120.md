---
title: IETF120に行ってきた
date: 2024-07-27
category: Network
description: IETF120とバンクーバーの振り返り
ogp: ietf120
---

2024年7月20日から27日にかけてバンクーバーで開催されたIETF120に現地参加してきたので，そこでやったことをまとめておく．

## 現地参加した目的
現地参加した目的は，一言で言えば，気になるワーキンググループの人と話してみたかったというただそれだけである．

自分はここ数回のIETFでQUICまわり，特にMedia over QUIC WG ([moq](https://datatracker.ietf.org/wg/moq/about/))をウォッチしており，116-119回開催にはリモートで参加していた．ドラフトに関してもまだMedia over QUICという名前がつく前から追っていたわけだが，いかんせんメディアストリーミングに関する知識が乏しく，議論を追っていてもいまいち理解できない点やコンテキストを追えない部分が多かったためワーキンググループに入り込んで活動することはなかった．

ただ，そろそろドラフトを眺めるだけじゃなくて何か手を動かしてワーキンググループに入り込んでみたいという気持ちも芽生えており，そのタイミングで回ってきたのがIETF奨学金の話であった．知識云々の前にそもそも海外に行く金を持ち合わせていなかったというのがこれまでのリモート参加の理由だったが，奨学金で行けるのであれば話は変わってくる．募集告知を見た瞬間に応募を決め，しばらくして奨学金の支給が決まった．円安とカナダの物価高の影響は凄まじく，支給額を見たときは度肝を抜いて桁数を数え直したほどだが，とにかくWIDEの皆様に感謝である．

## 参加前の準備
開催月になった途端ワーキンググループで大量のドラフトが公開された（5個くらい）．願わくば全部読み込んでなんならその実装とかもして現地に乗り込みたかったところだが，不幸なことにIETF開催期間が大学の学期末と被っており，全てをIETFに捧げる余裕がなかった（ブログを書いている今も期末発表が3日後に迫っている）．ミーティングのアジェンダは出ていたので，そこで議題に上がりそうなドラフトいくつかをかいつまんで読み，他は現地についてから読むことにした．実装に関しても，全てを試している暇はなかったため，moqメインのプロトコルであるMedia over QUIC Transportの実装だけ済ませておいた．

## ハッカソン
現地に到着してまず参加したのはハッカソンである．自分は今までリモートでしか参加したことがなかったのでその存在をよく知らなかったが，IETFミーティングでは毎回開催前の週末にハッカソンが行われる．事前に[ハッカソンWiki](https://wiki.ietf.org/en/meeting/120/hackathon)に登録されているプロジェクトもあれば，個人でもくもくと進めて成果物だけを発表するタイプのプロジェクトもある．今回は，宇宙におけるネットワーク通信の方法を探る，[deepspace](https://deepspace.github.io)のプロジェクトに参加した．

### QUIC in Deep Space
宇宙空間においてのルーターの動きは地球上でのそれとは異なる．異なる点はたくさんあるのだが，最も大きな違いは，ルーターがパケットを長い時間保持した後に転送するStore and forward機能が必要な点だ．例えば，地球-火星で通信を行う際，おそらく途中の衛星などを通じてパケットがリレーされていくわけだが，その伝送遅延は数十分に及ぶ．具体的な数字が述べられないのは火星にある通信対象がいつも地球側（か経路中のルーター側）を向いているとは限らず，たまたま真正面を向いている時と真裏にいる時では遅延に大きな差が出るからである．通信対象にアクセス可能になるまで，経路中のルーターはパケットを保持しておく必要があるが，現在地球上のインターネットで主流であるTCPとIPの組み合わせでこれは実現できない．

{TODO: なぜTCP/IPではStore&forwardできないのか？}

これに対してIETFで長らく議論されているのがBundle Protocolである．Bundle Protocolは先に述べたStore and forwardの機能を持つネットワークレイヤーのプロトコルで，宇宙での通信のみならず，災害時の通信などへの利用も期待される．

このBundle Protocolが議論されているのはIETFのdtn WGであるが，今回のハッカソンを率いるMarc Blanchetはdtnに所属しつつdeepspaceなる新しいnon-WGなグループを作り，QUICを宇宙空間で使うための思索を始めた．

{TODO: なぜTCPではダメでQUICだとできるのか？}

それを踏まえて，今回のハッカソンでは，様々なQUIC実装（aioquic, quinn, quiche etc.）で"dtnオプション"を実装し，その相互接続テストを行った．具体的には，ハンドシェイク開始時のRTTを超大きくし，輻輳制御を無効にするオプションを追加した．自分はPython実装のaioquicを担当したが，サンプル実装にフラグを付け足していくだけなので難易度は高くなく，証明書周りの枝葉末節なエラーで半日苦しんだことを除けばほとんどの時間はMarcに宇宙での通信について質問することに費やした．

{TODO: dtnとIOTの話}

## moq WGへの貢献
日曜日にハッカソンが終わり，月曜からミーティングが本格的に始まった．ミーティング期間は1週間あり，