---
title: Performing Live Streaming Demo over Media over QUIC Transport
date: 2024-07-24
category: Network
description: Implementation and simple testings
ogp: moqt-experiment-en
---

I've created a web application that implements a Media over QUIC Transport (MoQT) client and allows testing of live streaming. MoQT is a protocol that has been gaining attention recently in the field of video distribution, including the live streaming market. 

<div class="message"> The description in this blog is based on MoQT Draft-04. Please check the <a href="https://datatracker.ietf.org/doc/draft-ietf-moq-transport">Datatracker</a> for the latest version. </div>

## Media over QUIC Transport
MoQT is a low-latency streaming protocol primarily designed for live streaming. It envisions a pub/sub type application consisting of one or multiple publishers, relay servers, and subscribers.

![moqt-relay](/media/moqt-relay.png)

The key features of MoQT include low latency achieved through the use of QUIC and the high flexibility of the protocol itself. These features will be explained in more detail in the following sections.
### Data Structure
In MoQT, data is packaged into objects as the smallest unit. A group is a collection of one or more objects, and a track is defined as a collection of groups. This classification is designed to accommodate MoQT's diverse use cases. For example, in video distribution, if one frame is packaged as one object (which is possible with MoQT!), P/B frames dependent on a single I-frame can be grouped together. This allows for processes such as distributing the latest group when a subscriber requests the most recent video.

![moqt-data](/media/moqt-data.png)
### Flexibility of MoQT
One of the key features of MoQT is its high protocol flexibility. [MoQT is designed to support live streaming and various quality and scale distributions with low latency](https://www.ietf.org/blog/moq-overview/). The payload format of objects is not specified, allowing for the inclusion of not just video and audio, but also plain text data or binary data. In the case of video distribution, codec settings, encoding, and decoding processes are left to the application developer.

<img style="width: 100%" src="/media/moqt-covers.png" /> 

This flexibility allows for implementations such as lowering the bitrate in environments that require low bandwidth distribution, or distributing with high bitrate and high frame rate in environments that require high-quality distribution. It also enables the implementation of adaptive bitrate streaming (ABR) supported by HLS and DASH by dividing multiple video qualities into multiple tracks.

### Low Latency with MoQT 🏎️
The reason MoQT can achieve low-latency distribution lies in QUIC's multiplexed streams and this high flexibility. Many streaming protocols, including RTMP and HLS, are based on TCP, which has a problem called Head-of-Line Blocking (HoL Blocking). HoL Blocking refers to the issue where the receiver cannot process subsequent packets when the leading packet in an ordered stream is delayed or lost. TCP receives packets in the order they were sent and requests retransmission of missing packets for reliability, which causes HoL Blocking. In video distribution services, this directly leads to rebuffering, which degrades the user experience.

QUIC solves this with multiplexed streams. Multiplexed streams allow multiple streams to be established within a single QUIC connection. While QUIC streams are received in the order they were sent like TCP streams, there is no dependency between streams. This means that even if packet delay or loss occurs in one stream, packet transmission and reception can proceed normally in other streams. This is highly beneficial for video distribution, and by sending each MoQT object on a separate stream (stream-per-object), it's possible to distribute with less delay even during network congestion.

![quic-multiplex](/media/quic-multiplex.png)
Multiplexed streams diagram from [QUIC-EST: A QUIC-Enabled Scheduling and Transmission Scheme to Maximize VoI with Correlated Data Flows](https://ieeexplore.ieee.org/document/9433511)

Using stream-per-object has benefits beyond network congestion scenarios. Most protocols used in VOD and live streaming transmit video in segments of several seconds. This method inevitably introduces delay as it requires waiting for those few seconds of data, no matter how efficiently the segmentation is done. This is the main reason why "Low-Latency" protocols like LL-HLS and LL-DASH cannot achieve delays of less than one second. On the other hand, using stream-per-object with MoQT eliminates the need to wait for multiple frames, thus eliminating buffering and segmentation delays. In this case, the main factors of delay become transmission delay and encoding/decoding processing. The IETF's moq WG is discussing a container format called Low-overhead Container for video distribution with MoQT, which would allow for encoding/decoding processing with minimal overhead, as the name suggests. Regarding transmission delay, the resolution of HoL Blocking puts it at a significant advantage over other protocols, ultimately enabling distribution with delays well below one second.

## What I Created
Now, it's time to see if it works in the real world as expected.

I implemented a MoQT Publisher/Subscriber and conducted a live streaming test. I used the Low-overhead Container mentioned earlier as the container format, and used Meta's MoQT server [Moxygen](https://github.com/facebookexperimental/moxygen) as the relay server. The relay server was placed on Amazon EC2 in the us-west-2 region, and for the client, I created a dashboard-like web application that can view both Publisher and Subscriber simultaneously, as shown in the image below.

![moqt-dashboard](/media/moqt-dashboard.png)

The source code is available at [kota-yata/media-over-quic-experiment](https://github.com/kota-yata/media-over-quic-experiment).

## Measuring Latency
Here are some simple latency measurement. I classified the latency into three types:
- Latency 1: Delay due to encoding/packaging
- Latency 2: Transmission delay through the internet
- Latency 3: Delay due to decoding/depackaging

<img style="width: 100%" src="/media/moqt-delay.png" />

For the measurement, I ran a live stream for about 10 seconds and used the `performance.now()` function to measure the time for all frames from the moment WebCodecs starts encoding to the moment the MoQT package is completed and sent out via WebTransport (Latency 1), from the moment the Publisher sends out the packet to the moment the Subscriber receives the packet (Latency 2), and from the moment the Subscriber receives the packet to the moment decoding is completed in WebCodecs and the frame is rendered (Latency 3).

The video quality during measurement was Full HD (1920px*1080px) at 60FPS, using H.264 as the video codec with keyframes every 60 frames, and Opus as the audio codec. Being able to adjust all these parameters myself is another pleasing point of MoQT (for example, this isn't possible with WebRTC).

### Measurement Results
Latency 1 averaged 12.2ms, Latency 2 was 117.3ms, and Latency 3 was 10.3ms. In this case, I only performed pure encoding/decoding and packaging/depackaging processes, without implementing things like jitter adjustment buffers, so Latencies 1 and 3 are quite fast. The result of the total delay being under 150ms is quite revolutionary, and my impression after seeing these results is that if QUIC becomes widespread, the dream of low latency could become much more achievable.

## Future Work
I did an Interop with the moq WG people in IETF 120, and this implementation passed the Draft-04 test. Currently, the protocol implementation and application implementation are mixed, so I'm gonna have to work on separating them as soon as possible to be recognized as an official implementation.