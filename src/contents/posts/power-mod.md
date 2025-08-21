---
title: TypeScriptでべき剰余
date: 2022-07-13
category: Computer
description: BigIntを利用する工業レベルの整数向けべき剰余
ogp: power-mod
---
## はじめに
べき剰余関数というのはべき乗（累乗）と剰余演算（割り算の余りを計算するやつ）を一度にやってくれる関数のこと．そんなもん別々に計算すれば良いじゃんかと思いきや，累乗の指数が大きくなってくるとプログラミング言語によっては整数型のサイズをオーバーしてしまったり，そうでなくとも計算の効率が下がってしまうので，そんな時のために累乗の演算過程で剰余を取ってしまおうというのがべき剰余である．

## 他言語におけるべき剰余
Pythonでは標準ライブラリのpow関数でべき剰余が実装されている．

```python
pow(base, exponent, modulo)
```

という感じで第3引数に法の値を入れればよしなにやってくれる．

## 繰り返し２乗法の実装
まず通常の累乗関数を繰り返し2乗法で実装する．繰り返し2乗法というのは累乗の指数（$x^y$の$y$）を2の累乗に分解していく方法で，例えば$5^{60}$の計算をする際，指数の60を2の累乗に分解して$2^5+2^4+2^3+2^2$とし，$5^{2^5}*5^{2^4}*5^{2^3}*5^{2^2}$を計算する．こうすることで計算量は$O(logN)$になる．

TS(JS)の場合通常の整数型は最大値が$2^53 - 1$で，指数がそこまで大きくなくてもすぐにオーバーフローしてしまう．そんな時のために今回はBigInt型を使用する．BigInt型の詳細については[MDNのドキュメント](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)が有用だが，簡単に言えば整数型よりも大きい値を格納できる型である．

アルゴリズムとしては，
- 指数を1ビットずつ読んでいき，そのビットが1だったら底をかける
- 底を2乗
- 指数を1ビット右にシフトする

という流れになる．

```typescript
const power = (base: bigint, exponent: bigint): bigint => {
  base = BigInt(base);
  exponent = BigInt(exponent);
  //-------------------
  let ret: bigint = 1n;
  while(exponent) {
    if (exponent & 1n) {
      ret = ret * base
    };
    base = base ** 2n;
    exponent = exponent >> 1n;
  }
  return ret;
};
```
上の2行は，JSが引数の型を読めないがために毎回引数がbigintであると教えてあげないとJSへのコンパイル後の実行時にエラーが出る，そのための記述である．これだから動的型付けは．

## 繰り返し2乗法に剰余演算を加える
ここまでは標準ライブラリの`Math.pow()`で実現できるので，ここからは剰余演算を加えてささやかな新規性を出していく．
やることは単純で，結果となる値(`ret`)と底(`base`)を計算する度に剰余を取るだけ．

```typescript
const powerMod = (base: bigint, exponent: bigint, mod: bigint): bigint => {
  base = BigInt(base);
  exponent = BigInt(exponent);
  mod = BigInt(mod);
  //-------------------
  let ret: bigint = 1n;
  base = base % mod;
  while(exponent) {
    if (exponent & 1n) {
      ret = (ret * base) % mod
    };
    base = (base ** 2n) % mod
    exponent = exponent >> 1n;
  }
  return ret;
};
```
これでTypeScriptにおけるべき剰余関数は完成．

## 終わりに
上で貼ったMDNにも書いてあるが，BigIntは暗号処理における使用は非推奨になっている．巨大な整数を扱えるサードパーティーライブラリを使うかサーバー側で別の言語で処理するのが良さげ．

