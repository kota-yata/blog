---
title: WebRTC上の自前プロトコルでファイル共有アプリを作ろう
date: 2023-09-29
category: Computer
description: バイナリーを文字列で扱うJavaScriptな実装
ogp: huffman
---

*この記事は技術書典15で販売した書籍を、ある程度時間が経ったためWeb上で公開しているものです。

## はじめに
ここでは、P2P通信のプロトコルであるWebRTCの上にメディアプロトコルを定義し、簡単なファイル共有Webアプリを作成します。

完成版のWebアプリは以下のリポジトリにあります。特徴的なコードはこの書籍内で説明しますが、細かな実装はリポジトリを参照いただけると幸いです。

[https://github.com/kota-yata/instant-drop](https://github.com/kota-yata/instant-drop)

### WebRTCとは
WebRTCはブラウザ間でのリアルタイム通信のためのAPIであり、プロトコルの名称でもあります。P2P通信のレイテンシの低さを生かしてGoogle Meetなどのビデオ会議ツールやファイル共有ツールなどに利用され、ブラウザ以外でもモバイルアプリやIoTにおいても利用されています。

WebRTCにはDatachannelと呼ばれる、音声や映像情報以外を送るための手法が存在します。Datachannelでは、WebRTCのベースのプロトコルの上にSCTPと呼ばれるパケットの到達保証や順序保証を行うプロトコルが構築されています。  
今回は、このDatachannelを用いてファイルを送り合うWebアプリを実装していきます。

WebRTCは多種多様なプロトコルの集合体です。詳細については以下の参考リンクをご覧ください。

- [WebRTC公式サイト](https://webrtc.org/)
- [好奇心旺盛な人のためのWebRTC（日本語訳）](https://webrtcforthecurious.com/ja/)

### WebRTCにおける通信の大まかな流れ
WebRTCが定義するP2P通信の大まかな手順は次の通りです。

1. **シグナリング**：ピア同士が互いに情報を交換し、通信の準備を行う。
2. **STUN/TURNサーバーを利用**：NATやファイアウォールを越えて直接通信できるパスを確立する（ホールパンチング）。
3. **データのやり取り**：音声やビデオのメディアストリーム、またはDatachannelを通じて任意のデータを送受信する。
4. **エンドツーエンドの暗号化**：通信内容が安全に保護される。
5. **接続の終了**：通信が終了すると、ピア間の接続が適切にクローズされる。

### なぜ自前プロトコルが必要なのか
WebRTCはP2P通信の確立やネットワークトラバーサル、セキュアなデータ転送やフロー制御を担いますが、ファイルのメタデータの型定義やチャンク切り分けのルールなどは自らで定義し、エンコーダーとデコーダーを実装する必要があります。

---

## メディアプロトコルの定義と実装
WebRTC上で自前のメディアプロトコルを定義し、エンコーダーとデコーダーを実装していきます。この後作成するファイル共有アプリはブラウザ上での動作を前提としているため、TypeScriptで記述していきます。

### エンコーダー
インターネットにおける通信プロトコルには、送信できるパケットのサイズに上限があります。WebRTC DatachannelはSCTPを利用していますが、RFC8831では16KBに上限を設定することが推奨されています。

> The SCTP base protocol specified in [RFC4960] does not support the interleaving of user messages. Therefore, sending a large user message can monopolize the SCTP association. To overcome this limitation, [RFC8260] defines an extension to support message interleaving, which SHOULD be used. As long as message interleaving is not supported, the sender SHOULD limit the maximum message size to 16 KB to avoid monopolization.  
> — [RFC8831](https://datatracker.ietf.org/doc/rfc8831/)

以下にファイルを16KBに切り分けるエンコーダーの実装を示します。

```typescript
const fragment = async (file: File, dataId: string): Promise<FragmentSet> => {
  const THRESHOLD = 16000;
  const fragments: ArrayBuffer[] = [];
  if (file.size <= THRESHOLD) {
    const arrayBuffer: ArrayBuffer = await file.arrayBuffer();
    fragments.push(arrayBuffer);
    const fileObject: FileObject = 
      new FileObject(dataId, file.name, file.type, fragments);
    return { fileObject, fragments };
  }
  const total = Math.ceil(file.size / THRESHOLD);
  for (let i = 1; i <= total; i++) {
    const start = THRESHOLD * (i - 1);
    const end = THRESHOLD * i;
    const fragmentBlob = file.slice(start, end, file.type);
    const arrayBuffer: ArrayBuffer = await fragmentBlob.arrayBuffer();
    fragments.push(arrayBuffer);
  }
  const fileObject = new FileObject(dataId, file.name, file.type, fragments);
  return { fileObject, fragments };
};
```

`fragment`関数は、メタデータを含む`FileObject`と、切り分けられたチャンク（fragments）を含む `FragmentSet`を返します。`FileObject`と`FragmentSet`の型定義は次の通りです。

```typescript
export interface FragmentSet {
  fileObject: FileObject
  fragments: ArrayBuffer[]
}

export class FileObject {
  public dataId: string;
  public name: string;
  public type: string;
  public hashDigests: string[];
  constructor(dataId: string, name: string, type: string, data: ArrayBuffer[]) {
    this.dataId = dataId;
    this.name = name;
    this.type = type;
    this.hashDigests = data.map((d: ArrayBuffer) => {
      const base64 = Base64.encode(d);
      return sha256(base64);
    });
  }
}

```

