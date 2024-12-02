---
title: TCP Simultaneous Openを試す
date: 2022-11-03
category: computer
description: 同時にSYNパケットを送り合う、TCPホールパンチングの手法の一つ
ogp: tcp-so
---

9月末に[Protocol Lab Research](https://research.protocol.ai)が公開したカンファレンスペーパー:[Decentralized Hole Punching](https://research.protocol.ai/publications/decentralized-hole-punching/)の中でTCPにおけるホールパンチングの手法の一つとしてTCP Simultaneous Openなるものが挙げられていたので調べてみた。手法の解説の後にC言語での実装例を紹介する。

[実装のリポジトリ](https://github.com/kota-yata/tcp-simultaneous-open)

## 通常のTCP通信とP2P通信
通常のTCPでのクライアント-サーバー型通信はThree-Way Handshakeで確立される。まずクライアント側がSYNパケットをサーバー側に送り、サーバー側がSYN-ACKを返し、クライアントがそれに対するACKを返したのちデータのやり取りが始まる。

![TCP-3way-handshake](/media/tcp-so-3way-handshake.png)

ここで前提となっているのが、サーバー側がNATを介していないことである。サーバー側が常にポートを開いていてクライアント側がそこに常にアクセスできる状態にあるからこそこの通信方式は成り立っており、この前提が崩れるのがP2P通信の場合である。P2P通信そのものの説明は省くが、**僕達が日常的に使うようなローカルネットワークの内側にあるコンピューター同士で通信する必要が生まれる**というのがその最も大きな特性である。ローカルネットワークの内側にあるということはほとんどの場合NATの背後にあるということであり、その障壁を越えるのがNAT Traversalであり、ホールパンチングなのである。

ビデオチャットなどで主に使われるP2P通信の特性上ホールパンチングは通常UDP上で行われるものである。流れは以下の通り。
1. 発信側は[STUNサーバー](https://tex2e.github.io/rfc-translater/html/rfc5389.html)を用いて自分の外部IPアドレス（Reflexive Addressという）とポートを取得する
2. 発信側は[シグナリングサーバー](https://webrtcforthecurious.com/ja/docs/02-signaling/)から得た情報をもとに受信側にパケットを送る。この時点でNATに該当アドレスがマッピングされる
3. 2.のパケットは受信側に到達せず破棄されるが、今度は受信側が発信側にパケットを送る
4. 3.のパケットは、送信側のポートが既に開いているので正常に到達する。これにより双方での通信が可能になる

![UDP-Hole-Punching](/media/tcp-so-udp-hole-punching.png)

ここで注意したいのは、STUNサーバーと受信側に向けての外部アドレスが異なる場合このホールパンチングは成立しない。このようなNATのタイプを[Symmetric NAT](https://en.wikipedia.org/wiki/Network_address_translation)といい、この場合TURNサーバーを用いて実質クライアント-サーバー型通信を行うしか方法はない。

## TCP Simultaneous Open
TCP上でホールパンチングを試みる場合、UDPと全く同じ方法では成功しない。上で述べたようにTCPはThree-Way Handshakeが原則であり、最初のSYNパケットが到達しなかった時点で通信がリセットされポートが閉じてしまうからである。しかし、実はThree-Way Handshakeの原則をすり抜けてホールパンチングを成功させる裏技的手法が存在する。それが**TCP Simultaneous Open**である。頑なに英語で書いているのは適切で自然な和訳が浮かばないからだが、強いて訳すならTCP同時開通になるだろうか。裏技"的"と書いたのは、手法はいささか力技っぽいがしっかり[RFC793](https://www.rfc-editor.org/rfc/rfc793)に記載されている仕様だからである。
> The "three-way handshake" is the procedure used to establish a connection.  This procedure normally is initiated by one TCP and responded to by another TCP.  The procedure also works if two TCP simultaneously initiate the procedure.  When simultaneous attempt occurs, each TCP receives a "SYN" segment which carries no acknowledgment after it has sent a "SYN".
(セクション3.4より)

手順は簡単で、双方が相手のアドレスを取得したのち同時にSYNパケットを送り合うだけである。もっと言うと正確に同時である必要はなく、一方が送ったパケットがもう一方に到達する前にもう一方がパケットを送れば良い。それが成功すれば、あとは双方がSYN+ACKパケットを返して通信は確立される。

![TCP-Simultaneous-Open](/media/tcp-so-tso.png)

現実問題タイミングを合わせてパケットを送り合うというのはすごく難しいかつ効率的でないのであまり実際の実装でこの手法が使われているものは見つからないが、方法として可能であることはわかったので今度は実際に書いて動かしてみる。

## 実装
### STUNクライアント
STUNサーバーに問い合わせるクライアントコードはソースコードを貼るだけで省略するが、注意点としてはクライアント側でもソケットをbindする必要があることが挙げられる。実際の通信試行の際に使うローカルポートにbindしてからサーバーに問い合わせないと、NAPTなどで別の外部ポートにマッピングされている場合に接続が上手くいかなくなってしまう。
```c
int main(int argc, char *argv[]) {
  int descriptor = -1;
  unsigned char buffer[BUF_MAX];
  unsigned char binding_request[20];
  memset(&binding_request, 0, sizeof(binding_request));

  struct sockaddr_in sin_server, sin;
  memset(&sin, 0, sizeof(sin));
  memset(&sin_server, 0, sizeof(sin_server));

  descriptor = socket(AF_INET, SOCK_STREAM, 0);
  if (descriptor < 0) {
    printf("Socket creation failed");
    return -1;
  }

  sin.sin_family = AF_INET;
  sin.sin_addr.s_addr = INADDR_ANY;
  sin.sin_port = htons(atoi(argv[1]));

  if (bind(descriptor, (struct sockaddr *)&sin, sizeof(sin)) < 0) {
    printf("Failed to bind\n");
    return -1;
  };

  sin_server.sin_family = AF_INET;
  sin_server.sin_addr.s_addr = inet_addr(argv[2]);
  sin_server.sin_port = htons(atoi(argv[3]));
  

  if (connect(descriptor, (const struct sockaddr *)&sin_server, sizeof(sin_server)) < 0) {
    printf("Failed to connect\n");
    close(descriptor);
    return -1;
  }

  printf("Connected\n");

  *(short *)(&binding_request[0]) = htons(0x0001); // Message Type (Binding Request this time)
  *(int *)(&binding_request[4]) = htonl(0x2112A442); // Magic Cookie (Fixed value to distinguish STUN traffic from other protocols)
  *(int *)(&binding_request[8]) = htonl(0x471B519F); // Transaction ID (Random value to pair up a request and corresponding response)

  printf("Sending Binding Request...");
  if (send(descriptor, &binding_request, sizeof(binding_request), 0) < 0) {
    printf("Failed\n");
    close(descriptor);
    return -1;
  }

  printf("Sent\nReceiving Binding Response...");
  if (recv(descriptor, &buffer, BUF_MAX, 0) < 0) {
    printf("Failed\n");
    close(descriptor);
    return  -1;
  }

  // 0x0101 at the first two bytes means this is Binding Response
  // that being said the response is successfully received
  if (*(short *)(&buffer[0]) == htons(0x0101)) {
    printf("Received\n");
    int i = 20; // Data section starts after the header, which is 20 bytes
    short attribute_type;
    short attribute_length;
    unsigned short port;
    // Continuously read attributes in the data section
    while(i < sizeof(buffer)) {
      attribute_type = htons(*(short *)(&buffer[i]));
      attribute_length = htons(*(short *)(&buffer[i + 2]));
      // If the attribute is XOR_MAPPED_ADDRESS, parse it
      if (attribute_type == 0x0020) {
        port = ntohs(*(short *)(&buffer[i + 6]));
        port ^= 0x2112;
        printf("%d.%d.%d.%d:%d\n", buffer[i + 8] ^ 0x21, buffer[i + 9] ^ 0x12, buffer[i + 10] ^ 0xA4, buffer[i + 11] ^ 0x42, port);
        break;
      }
      i += 4 + attribute_length;
    }
  }
  close(descriptor);

  return 0;
}
```
以下ではSTUNサーバーとして[STUNTMAN](https://www.stunprotocol.org/)を利用するが、TCPに対応しているSTUNサーバーであれば何でも良い。
```
$ ./a.out 44444 18.191.223.12 3478
```
途中のBinding Requestに関してはメッセージの形式が決まっているので[こちら](https://webrtcforthecurious.com/ja/docs/03-connecting/)などを参考にすると理解しやすいかも。レスポンスに関しても明確に仕様でヘッダーサイズやフラグが定められているのでそれに従ってパースしている。

### ホールパンチング
TCP Simultaneous Openのメインとなる実装。流れとしてはソケットを作ってbindし、GMTでタイミングを合わせて同時にconnectするという形になる。
GMTでタイミングを合わせる部分の関数が以下である:
```c
int get_remaining_msec() {
  struct timeval my_time;
  gettimeofday(&my_time, NULL);
  struct tm tm;
  gmtime_r(&my_time.tv_sec, &tm);
  int sec = 60 - tm.tm_sec - 1;
  int ms = 1000000 - my_time.tv_usec;
  return sec * 1000000 + ms;
}
```
秒数とマイクロ秒数が共に0になる(xx:00.00)まで待つ処理だが、ここでマイクロ秒まで計算しないとわずかにconnectのタイミングがずれてしまい接続できなくなってしまう。コンピューターの物理的な場所の違いにもよるが元々NTP時間との差異もあるため正確にタイミングする必要がある。

`get_remaining_sec`を用いた全体のコードは以下である:
```c
int main(int argc, char *argv[]) {
  char* message = "Hello :)";
  int misc_descriptor = -1;
  int my_descriptor = -1;
  int connect_res = -1;

  my_descriptor = socket(AF_INET, SOCK_STREAM, 0);
  if (my_descriptor < 0) {
    printf("Socket generation failed\n");
    return -1;
  }

  struct sockaddr_in my_addr;
  my_addr.sin_family = AF_INET;
  my_addr.sin_addr.s_addr = inet_addr(argv[1]);
  my_addr.sin_port = htons((unsigned short) atoi(argv[2]));

  struct sockaddr_in peer_addr;
  peer_addr.sin_family = AF_INET;
  peer_addr.sin_addr.s_addr = inet_addr(argv[3]);
  peer_addr.sin_port = htons((unsigned short) atoi(argv[4]));

  if (bind(my_descriptor, (struct sockaddr*)&my_addr, sizeof(my_addr)) < 0) {
    printf("Failed to bind %s\n", argv[1]);
    close(my_descriptor);
    return -1;
  }

  int wait_for = get_remaining_msec();
  printf("Waiting for %d microseconds\n", wait_for);
  usleep(wait_for);

  printf("Connecting...\n");
  if (connect(my_descriptor, (struct sockaddr*) &peer_addr, sizeof(peer_addr)) < 0) {
    printf("Connection Attempt Failed\n");
    return -1;
  }
  printf("Connection Established\n");
  if (write(my_descriptor, message, sizeof(message)) < 0) {
    printf("Failed to send message");
    return -1;
  }
  char* buffer = malloc(BUF_SIZE);
  if (read(my_descriptor, buffer, sizeof(buffer)) < 0) {
    printf("Failed to read message");
    free(buffer);
    return -1;
  }
  printf("Received: %s \n", buffer);
  free(buffer);
  close(misc_descriptor);
  close(my_descriptor);

  return 0;
}
```

実装としてはそこまで難しいものではないが、テストをする段階でSymmetric NATの背後にないコンピューターを二つ用意するのに若干手間取った。元々Mac一台しか手元にない僕はサーバーやVPS代をケチってGitHub Codespaceを利用しようとした。が、2日ほどの浪費を経てCodespaceのVMはSymmetric NATの背後にあることが判明したのである。Codespace側のtcpdumpでそもそもパケットが届いていない時点で気付くべきだったが、NATのタイプよりも自分のコードを疑ってしまい無駄な時間を過ごしてしまった。最終的にさくらインターネットのレンタルサーバーが2週間無料(2022/11/3現在)だったのでそちらを借りてテストを行った。これでは片方が静的サーバーなのでp2p通信と言えるのかどうかすら怪しいが背に腹は代えられない。

上のコードをしかるべきコンピューター間で実行すると以下のようなプロンプトが表示される:
```
Waiting for xxxxx microseconds
Connecting...
Connection Established
Received: Hello :)
```

## おわりに
頭のカンファレンスペーパーで紹介されている分散型ホールパンチングの手法は既にlibp2pに実装されており、成功率はUDPとQUICで90%以上、TCPではそれ以下とのこと（参照: 著者[Max Inden](https://twitter.com/mxinden)氏によるプレゼン[Libp2p Hole Punching](https://www.youtube.com/watch?v=pSXlpKlZX7I) ）。まあ数字を出さないあたりあまり高くない、かつそもそもTCP上でlibp2pを使うケースが多くないことが予想できる。

先にも述べたが上のコードは[こちらのリポジトリ](https://github.com/kota-yata/tcp-simultaneous-open)で管理している。
