---
title: 曲単位でSpotifyのおすすめを探す
date: 2023-11-16
category: Programming
description: Spotify APIを使ってみる
ogp: vibe-interface
---

Spotifyアプリ上では「Discover Weekly」や各プレイリストの下部のおすすめなど、至る所でおすすめシステムが使われているが、ある一つの曲に関連するおすすめ、つまり似たようなテンポや似たような雰囲気の曲を知ることはできない。幸いSpotifyはレコメンドシステムをAPIとしても提供しているので、今回はそれを使って曲単位でのおすすめを取得するWebアプリを作る。

## アプリの想定フロー
Spotify APIの認証を終えたらまずおすすめの元になる楽曲のIDを取得する必要がある。これまた幸い[Spotifyは曲の検索システムもAPIとして提供しており](https://developer.spotify.com/documentation/web-api/reference/search)、Spotifyアプリの検索欄と同じ体験を自分のアプリで提供することができる。検索窓を通じて楽曲IDを取得したらそれをレコメンドのエンドポイント（/recommendations）に投げ、ついでにBPMやSpotify特有の指標（danceabilityやliveness）もしておく。個人的に本当はジャンルを絞りたくなかったが、シードとしてアーティスト、楽曲、ジャンルのどれかを指定する必要があったため指定された楽曲をシードとして入れることにした。これにより最終的なおすすめはかなりジャンルに縛られる結果になった。

## セッション管理
今回のアプリは僕がロジックを書くことはほとんどない（ほぼAPIに任せるため）ので、
