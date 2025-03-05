---
title: quic-goにおけるPMTUDを利用した脆弱性 (CVE-2024-53259)
date: 2024-12-04
category: Computer
description: Path MTU Discoveryの実装を利用した攻撃手法と対策
ogp: quic-go-cve
---

この記事は[QUIC Advent Calendar 2024](https://qiita.com/advent-calendar/2024/quic) 12/4の記事です。
## 概要
一昨日（2024/12/02）、QUICの主力なGo実装でもある[quic-go](https://github.com/quic-go/quic-go)の、Linux上における脆弱性が公開された（[CVE-2024-53259](https://nvd.nist.gov/vuln/detail/CVE-2024-53259)）。MTU探索の実装を利用し、ICMPのPacket Too Largeメッセージをターゲットのホストに送信することで通信を中断できる。

すでに[バージョン0.48.2](https://github.com/quic-go/quic-go/releases/tag/v0.48.2)で脆弱性は修正されているが、以下で簡単に内容を紹介する。

## 前提: Path MTU Discovery
今回の脆弱性は、[Path MTU Discovery（PMTUD）](https://www.rfc-editor.org/rfc/rfc1191.html)と呼ばれる、IP通信における経路間のMTU探索の仕組みを利用したものである。
PMTUDの基本的な流れは以下の通りである
- 送信元ホストが適当なサイズ（大抵は自分のインターフェースのMTU）のパケットを生成し、DF (Don't Fragment)フラグを立てて宛先に送信する。
- リンク間のどこかのMTUがそのパケットサイズより小さかった場合、ルーターはパケットを破棄してICMPのPacket Too Largeメッセージを返す
- 上で返されたICMPヘッダーにNext-hop MTUなるフィールドが存在するので、送信元はそれを読んで適切なパケットサイズに直して再送信する
- 以上をパケットが宛先に到達するまで繰り返す

![pmtud](/media/pmtud.png)
出典: https://www.infraexpert.com/info/5.2adsl.htm

PMTUDはICMPを使うことを前提としているが、データグラム型プロトコルでは実際はそれぞれのプロトコルメッセージを用いてPMTUDを行う[Datagram Packetization Layer Path MTU Discovery（DPLPMTUD）](https://www.rfc-editor.org/rfc/rfc8899)が実装されているケースが多い。go-quicもそのうちの一つである。

## quic-goにおけるDPLPMTUDの実装と攻撃
go-quicではLinuxマシン上のホストでDPLPMTUDを行う際に、`IP_PMTUDISC_DO`ソケットオプションをセットしていた。このオプションがセットされているとき、ストリームソケットにおいてはPMTUDが常に実行され、データグラムソケットにおいてはDFフラグが常にセットされる。カーネルは`IP_PMTUDISC_DO`がセットされたソケットに対してのICMPメッセージを信頼し、Fragmentation Neededメッセージを受信したら逐次Path MTUを更新していく。また送信元をチェックしないため、そのソケットが通信を行っている相手からのメッセージでなくても受け取ってしまう。

今回の脆弱性はこれらの`IP_PMTUDISC_DO`の特性が利用される。攻撃者は、QUICの最低MTUである1200バイトより小さい値をNext-hop MTUフィールドに入れたICMP Packet Too Largeメッセージをquic-goで通信を行うLinuxホストに送信する。カーネルはそのメッセージを受け取りPath MTUを更新するが、アプリケーションはそれを知らずに通常のQUICパケットを送信しようとする。`sendmsg`なりでパケットを受け取ったカーネルは、攻撃者の送ったPath MTUを信じているため、通常サイズのQUICパケットに対してもPacket Too Largeエラーを返してしまう。これにより通信が中断されるのである。

## 対策
quic-goの0.48.2ではDPLPMTUD実行時のソケットオプションを`IP_PMTUDISC_DO`から`IP_PMTUDISC_PROBE`に変更した。`IP_PMTUDISC_PROBE`はDFフラグこそセットするものの、Path MTUの更新は行わない。つまりPacket Too Largeなどのフィードバックメッセージが返ってきても、アプリケーションはそれを超えるサイズのメッセージを送ることができるのである。
>It is possible to implement RFC 4821 MTU probing with SOCK_DGRAM or SOCK_RAW sockets by setting a value of IP_PMTUDISC_PROBE (available since Linux 2.6.22).  This is also particularly useful for diagnostic tools such as tracepath(8) that wish to deliberately send probe packets larger than the observed Path MTU.
>[Linux Manual](https://man7.org/linux/man-pages/man7/ip.7.html)

これは主に解析ツールなどのためのオプションだが、quic-goではこのオプションを使うことでオフパスからのICMPパケットによってカーネル内でPath MTUがセットされるのを防いだ。

## おわりに
Path MTU Discoveryがかなり素直な仕組みで驚いた。[Linuxでは線形探索でやっているらしい](https://yokanyukari.hatenablog.com/entry/2022/12/16/030832)。実はこの脆弱性を再現すべくコードを書いていたが、ICMP周りが思いの外厄介で苦戦しているので解説の記事のみになってしまった。実装はまたの機会に。
