---
title: Establishing P2P Connection over QUIC
date: 2024-02-14
category: Network
description: Partially demonstrating an IETF draft [Using QUIC to traverse NATs]
ogp: quic-p2p
---

When setting up P2P connection within an application, UDP is commonly used. With the ICE protocol and WebRTC, it’s quite easy to establish P2P connections through standard APIs. However, using QUIC instead of UDP offers advantages such as mandatory TLS and connection migration, which would enable, for example, seamless transitions between WiFi and mobile networks during activities like gaming or video conferencing. Despite these benefits, there aren’t yet protocols like ICE or WebRTC for QUIC. **This post demonstrates how to establish P2P communication over QUIC using the ICE protocol over UDP**.

## Method
First, a P2P connection is established between two nodes using the ICE protocol, which is based on UDP. Since QUIC is a UDP-based protocol as well, a handshake can be performed on this P2P connection to switch the communication to QUIC, thus achieving P2P communication over QUIC.

![ice and quic](/media/p2p-quic-01.png)
Although the ICE protocol is used here for convenience, the initial P2P connection setup doesn't necessarily require it. As long as a UDP-based P2P connection can be established, the method works. For example, [libp2p already implements P2P communication over QUIC without using the ICE protocol](https://github.com/libp2p/specs/blob/master/relay/DCUtR.md#the-protocol).

### Reference: Method Used in libp2p
When two peers (A and B) are behind NATs, libp2p's protocol works as follows: B sends a `CONNECT` message to A via a relay server. A responds with a `CONNECT` message. B then sends a `SYNC` message to A. After calculating half the round-trip time (RTT) from the `CONNECT` message exchanges, B repeatedly sends arbitrary UDP packets to A to create a mapping in B's NAT device for A’s address. Upon receiving the `SYNC` message, A sends a QUIC connection request to B. This completes the NAT mapping, establishing a P2P connection with A as the client and B as the server.
![libp2p](/media/p2p-quic-02.png)

## Implementation
To implement this method, both ICE and QUIC communications must use the same UDP socket, as they need to share the same internal address. However, neither [aioice](https://github.com/aiortc/aioice) nor [aioquic](https://github.com/aiortc/aioquic) originally provided means for users to access or pass the socket. Thus, aioice was extended to retrieve the socket used for the final selected IP/port pair (Candidate), and aioquic was modified to accept an existing socket as an argument in its connect and serve functions. For details of extension, please refer to [my repository](https://github.com/kota-yata/2023f-wip)

### Signaling Server Implementation
The ICE protocol requires a signaling server. Below is a simple implementation based on an aioice example, which was deployed on Heroku.
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

### Client Implementation
The client implementation uses the extended aioice and aioquic libraries to establish a QUIC connection over the ICE-established UDP socket.
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

The implementation is quite a mess since it simply attaches QUIC processing to the ICE client example from aioice, and currently, the client side can only perform the answer function. It does work. In the answer function, the socket is retrieved from aioice using `sock = connection.sock`, and then passed to the `connect` function in `run_quic_client` using `sock=sock`. These properties and arguments were extended and added for this purpose.

### Server Implementation
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

An argument `sock` in `serve` function in `run_quic_server` was also extended and added for this purpose.

## Testing
The setup was tested with one peer (client) on a MacOS Ventura machine at home and the other (server) on a virtual machine running Ubuntu 18.0.4 on Compute Engine. Both peers were behind Address-restricted cone NATs. The following Wireshark capture shows the results.

![ice and quic](/media/p2p-quic-03.png)
Initially, several STUN packets are exchanged as part of the ICE protocol. Then, the QUIC handshake begins, and the connection is established.

## Conclusion
This implementation is based on one of the methods discussed in the IETF QUIC WG draft, [Using QUIC to traverse NATs](https://datatracker.ietf.org/doc/draft-seemann-quic-nat-traversal/). While the main method of this draft is still under active implementation and the draft itself is in the discussion phase, the progress will be monitored to continue refining the implementation.
