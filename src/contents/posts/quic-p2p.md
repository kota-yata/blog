---
title: QUICでP2P通信を張る
date: 2024-02-14
category: Computer
description: Using QUIC to traverse NATsの実装を途中まで
ogp: quic-p2p
---

現状，アプリケーション内でP2P通信を張ろうとなったら大抵はUDPを使うと思う．ICEプロトコルもあるしWebRTCを使えばICEプロトコルを触ることもなく標準APIを叩いていれば勝手にP2P通信が繋がっている．ただ，UDPじゃなくてQUICを使えばTLS必須だし，コネクションマイグレーションを利用できればそれこそWiFi環境からモバイル通信に切り替わってもゲームやビデオ会議を続けることができる（論理的にはできる）．とはいえQUICの上にはICEやWebRTCみたいな便利なプロトコルはまだ出来上がっていないので，今回はUDP上のICEプロトコルを利用する形でQUIC上でP2P通信を張ってみる．

## 手法
まず普通にICEプロトコルを用いて二つのノード間でP2P通信を確立する．この段階ではもちろん通信はUDPに基づいているが，QUICはUDPベースのプロトコルなのでこのP2P通信の上でハンドシェイクを行うことができる．これで通信はQUICに切り替わり，QUIC上でのP2P通信が実現する．

![ice and quic](/media/p2p-quic-01.png)

今回はライブラリを使えて楽なのでICEプロトコルを用いるが，最初にP2P通信を確立する部分はICEプロトコルを用いなくても問題ない．どうにかしてUDP上でのP2P通信が張れれば良いのである．例えば[libp2pはすでにP2P通信 over QUICを実装しているが，ICEプロトコルは用いていない](https://github.com/libp2p/specs/blob/master/relay/DCUtR.md#the-protocol)．

### 参考: libp2pで用いられている手法
NAT背後にある二つのピアA,Bがある時，libp2pのプロトコルでは，まずBが仲介サーバーを介して`CONNECT`メッセージをAに送り，受け取ったAは同じく`CONNECT`メッセージを送り返す．このメッセージを受け取ったBは次に`SYNC`メッセージをAに送る．その後`CONNECT`メッセージの往復で算出したRTTの半分の時間が経ったら（これは`SYNC`メッセージがAに到達したと思われるタイミング），BはAに適当なUDPパケットを繰り返し送る．これはB側のNATデバイスにAのアドレスをマッピングさせるためのものなのでUDPパケットで良い．Aは`SYNC`メッセージを受け取ったらすぐBにQUICの接続要求を送る．これにより双方ピアのNATマッピングが完了し，Aが送った接続要求が成功，Aをクライアント，BをサーバーとしたP2P通信が確立する．
![libp2p](/media/p2p-quic-02.png)

## 実装
libp2pはさておき，今回はICEプロトコルを用いて最初のP2P通信確立を行う．諸事情でPythonを使うことになったので，aiortcが提供するICEライブラリ[aioice](https://github.com/aiortc/aioice)とQUICライブラリ[aioquic](https://github.com/aiortc/aioquic)を少し拡張して実装を行うことにした．

上で述べた手法を実現するには，ICEでの通信，QUICでの通信について同じUDPソケットを使う必要がある．これは二つが同じ内部アドレスを使っていないと手法が成立せず，同じアドレスを使うには同じソケットを使う必要があるからである．しかし，aioice側には通信に使われたソケットをユーザーが取り出せるようなゲッターなどはなく，またaioquic側にもユーザーがソケットを渡せる機能は存在しない．なので今回の手法の実装前に，aioiceについてはICEプロトコルで最終的に選択されたIPアドレス/ポートのペア（いわゆるCandidate）のソケットを取り出すゲッターを加え，aioquicはconnect関数，serve関数それぞれについて既存のソケットを引数で渡せるように拡張を行なった．具体的な変更箇所については[リポジトリ](https://github.com/kota-yata/2023f-wip)を参照いただきたい．（研究発表が迫っていてものすごく雑なコミットになっています．ごめんなさい．）

### シグナリングサーバーの実装
ICEプロトコルは当然仲介サーバーなしでは動かない．以下はaioiceのexampleにあったシンプルなシグナリングサーバーの実装である．今回はたまたまHerokuのクレジットが残っていたのでこれをHerokuにデプロイした．
```python
import asyncio
import binascii
import os

import websockets

clients = {}

async def echo(websocket, path):
    client_id = binascii.hexlify(os.urandom(8))
    clients[client_id] = websocket

    try:
        async for message in websocket:
            for c in clients.values():
                if c != websocket:
                    print("Sending to", c.remote_address, ":", message)
                    await c.send(message)
    finally:
        clients.pop(client_id)


asyncio.get_event_loop().run_until_complete(websockets.serve(echo, "0.0.0.0", int(os.environ.get("PORT", 8765))))
asyncio.get_event_loop().run_forever()
```

### クライアントの実装
```python
import argparse
import asyncio
import json
import logging
import os
import time
import aioice
import websockets

from quic_protocol import EchoClientProtocol
import m_socket
from aioquic.quic.configuration import QuicConfiguration
from aioquic.asyncio import connect

STUN_SERVER = ("stun.l.google.com", 19302)
WEBSOCKET_URI = "wss://some-signaling-server.com"

async def run_quic_client(sock, remote_host, remote_port):
    print("establishing QUIC connection")
    configuration = QuicConfiguration(is_client=True)
    configuration.load_verify_locations("../../certs/pycacert.pem")

    async with connect(remote_host, remote_port, configuration=configuration, create_protocol=EchoClientProtocol, sock=sock) as protocol:
        stream_id = protocol._quic.get_next_available_stream_id()
        protocol._quic.send_stream_data(stream_id, b"Hello!", end_stream=True)
        received_data = await protocol.received_data.get()

async def answer(options):
    connection = aioice.Connection(
        ice_controlling=False, components=options.components, stun_server=STUN_SERVER
    )
    await connection.gather_candidates()

    websocket = await websockets.connect(WEBSOCKET_URI)

    # await offer
    message = json.loads(await websocket.recv())
    for c in message["candidates"]:
        await connection.add_remote_candidate(aioice.Candidate.from_sdp(c))
    await connection.add_remote_candidate(None)
    connection.remote_username = message["username"]
    connection.remote_password = message["password"]

    # send answer
    await websocket.send(
        json.dumps(
            {
                "candidates": [c.to_sdp() for c in connection.local_candidates],
                "password": connection.local_password,
                "username": connection.local_username,
            }
        )
    )
    await websocket.close()

    await connection.connect()
    remote_addr = connection.established_remote_addr
    sock = connection.sock
    await run_quic_client(sock, remote_addr[0], remote_addr[1])

    await asyncio.sleep(5)
    await connection.close()


parser = argparse.ArgumentParser(description="ICE tester")
parser.add_argument("--components", type=int, default=1)
options = parser.parse_args()

logging.basicConfig(level=logging.DEBUG)

asyncio.get_event_loop().run_until_complete(answer(options))
```

aioiceのexampleにあったICEクライアントにQUICの処理をくっつけただけなのでかなり煩雑だしクライアント側はanswerしかできない状態だが，動作はする．answer関数内で`sock = connection.sock`という感じでaioiceのソケットを取り出し，run_quic_client関数内のconnect関数に`sock=sock`でソケットを渡しているが，これらのプロパティと引数は今回拡張して追加したものである．

### サーバーの実装
```python
import argparse
import asyncio
import json
import logging
import os

import aioice
import websockets

import m_socket
from quic_protocol import EchoClientProtocol
from aioquic.quic.configuration import QuicConfiguration
from aioquic.asyncio import serve

STUN_SERVER = ("stun.l.google.com", 19302)
WEBSOCKET_URI = "ws://some-signaling-server.com"

async def run_quic_server(sock):
    configuration = QuicConfiguration(is_client=False)
    configuration.load_cert_chain("../../certs/cert.pem", "../../certs/key.pem")
    await serve(configuration=configuration, create_protocol=EchoClientProtocol, sock=sock)
    await asyncio.Future()

async def offer(options):
    connection = aioice.Connection(
        ice_controlling=True, components=options.components, stun_server=STUN_SERVER
    )
    await connection.gather_candidates()

    websocket = await websockets.connect(WEBSOCKET_URI)

    # send offer
    await websocket.send(
        json.dumps(
            {
                "candidates": [c.to_sdp() for c in connection.local_candidates],
                "password": connection.local_password,
                "username": connection.local_username,
            }
        )
    )

    # await answer
    message = json.loads(await websocket.recv())
    print("received answer", message)
    for c in message["candidates"]:
        await connection.add_remote_candidate(aioice.Candidate.from_sdp(c))
    await connection.add_remote_candidate(None)
    connection.remote_username = message["username"]
    connection.remote_password = message["password"]
    await websocket.close()

    await connection.connect()
    sock = connection.sock
    await run_quic_server(sock)
    await connection.close()

parser = argparse.ArgumentParser(description="ICE tester")
parser.add_argument("--components", type=int, default=1)
options = parser.parse_args()

logging.basicConfig(level=logging.DEBUG)

asyncio.get_event_loop().run_until_complete(offer(options))
```
run_quic_server内のserve関数の引数`sock`も今回拡張して追加したものである．

## 動かしてみる
片方のピアは自宅のMacOS Ventura，もう片方はCompute EngineのUbuntu 18.0.4の仮想マシンを利用した．双方ともNATタイプは[Address-restricted cone NAT](https://ja.wikipedia.org/wiki/%E3%83%8D%E3%83%83%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF%E3%82%A2%E3%83%89%E3%83%AC%E3%82%B9%E5%A4%89%E6%8F%9B)である．
実行結果をWiresharkでキャプチャしたのが以下．

![ice and quic](/media/p2p-quic-03.png)
最初数個のSTUNパケットはICEプロトコルの一部である．そのあとQUICのハンドシェイクが始まり接続が確立しているのが確認できた．

# おわりに
今回の実装は[Using QUIC to traverse NATs](https://datatracker.ietf.org/doc/draft-seemann-quic-nat-traversal/)というIETF quic WGで議論されているドラフトの手法の一つを参考にしている．このドラフトのメインの手法も鋭意実装中という感じだが，ドラフト自体がまだ検討段階で，Authorにメールしたところまだ実装も存在しないらしいので議論が進むのを追いつつ実装も進めていきたい．
