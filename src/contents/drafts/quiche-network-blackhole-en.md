---
title: Quiche's "Network blackhole detected" error
date: 2025-06-15
category: Computer
description: Excesive loss or unclosed streams cause this error
ogp: quiche-network-blackhole-en
---

Recently, I ran into a stubborn issue while experimenting with live video & audio streaming using **[moqtail](https://github.com/kota-yata/moqtail)**, a browser‑side implementation of the Media over QUIC (MoQ) Transport proposal.  
Everything would start fine—then, anywhere from **5 seconds** to **30 minutes** later, the connection to my relay server (Meta’s **[Moxygen](https://github.com/facebookexperimental/moxygen)**) would drop with the following exception:

```text
proxygen::HTTPException: Got error=TransportError: No Error, Server closed by peer reason=85:Network blackhole detected
```

### Digging into Quiche

A network blackhole typically refers to a situation where network packets sent from one endpoint never reach their destination, nor does any error or feedback (such as ICMP unreachable) return to the sender. In other words packets are silently dropped, vanishing into a "blackhole", and the sender cannot tell if the network path is down or just very slow. 

Chrome uses **[Quiche](https://github.com/google/quiche)** for its QUIC implementation. Buried inside I found [`quiche/quic/core/quic_network_blackhole_detector.cc`](https://github.com/google/quiche/blob/446875b7172a09b60be78acf8eacb67de54815ec/quiche/quic/core/quic_network_blackhole_detector.cc).

This component sets deadlines for degradation, MTU reduction, and complete blackhole detection—and uses an alarm to trigger appropriate callbacks when these deadlines are reached. So it seems like the problem is either moqtail on Chrome or the Chrome itself.

### The Real Culprit

After several debugging sessions the root cause turned out to be on moqtail:

* I was opening a new WebTransport *unidirectional* stream for every video GoP.  
* After sending all media objects, I forgot to close the stream (`stream.close()`).

Those half‑open streams made the connection look idle or stalled from Chrome’s point of view. Eventually Quiche’s detector declared the path dead and returned `Network blackhole detected`, closing the connection from the peer side.

So the solution is just to close the stream after sending an object with OBJECT_STATUS set to 0x3 (End of group) or 0x4 (End of track), following the last frame in the GoP.

Happy streaming—and may your QUIC connections stay out of the blackhole :)

