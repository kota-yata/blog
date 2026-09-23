---
title: UEでの色空間の変換
date: 2026-09-23
category: Computer
description: PLYファイルの色空間は自明でない
ogp: ply-srgb
---

RGBで色を表現する色空間にはリニアなRGBとsRGBの二種類がある．リニアRGBでは各色成分の強さが0から255まで線形に増えていく．一方でsRGBは，数値上は線形であるものの，実際には非線形に，暗い部分に対して数値あたりの光量差が細かくなっている（0-1の光量差より254-255の光量差の方が大きい）．これは，[暗い領域では光量差により敏感になるという人間の視覚特性](https://opg.optica.org/josa/abstract.cfm?uri=josa-38-2-196)を反映するためである．

![linear RGBの数値，輝度の対応グラフ](/media/linear-rgb.png)
![sRGBの数値，輝度の対応グラフ](/media/srgb.png)

両者については[Cygamesのブログ](https://tech.cygames.co.jp/archives/2339/)などでも説明されているので詳細はそちらを参照すると良い．

さて，自分は[PCS (Point Cloud Sequence)](https://github.com/yatagai-mm/pcs)という，Unreal Engine上でXYZRGB形式の点群ボリュメトリックビデオをレンダリングするプラグインを開発しているが，この色空間について特に考えずに全部リニアRGBとしてレンダリングした結果，オブジェクトの色が全部薄くなるという現象に遭遇した．

![sRGBで生成されたlongdressをlinear RGBで描画した結果](/media/longdress-srgb-as-linear.png)
（なんか青白い感じになった）

当初はデータセット側の問題や，レンダリングするシーンのライティングの問題かと思ってデバッグしていたが，Codexと議論した結果，色空間が間違っているという結論に至った．

元のシェーダーの一部を抜粋する:
```glsl
FVertexFactoryIntermediates GetVertexFactoryIntermediates(FVertexFactoryInput Input)
{
	FVertexFactoryIntermediates Intermediates = (FVertexFactoryIntermediates)0;
	Intermediates.SceneData = VF_GPUSCENE_GET_INTERMEDIATES(Input);
	Intermediates.QuadCorner = Input.QuadCorner;
	Intermediates.PointPosition = Input.PointPosition;
	Intermediates.Color = Input.PointColor;

	Intermediates.TangentToWorld[0] = normalize(PCSViewRight);
	Intermediates.TangentToWorld[1] = normalize(PCSViewUp);
	Intermediates.TangentToWorld[2] = normalize(cross(PCSViewRight, PCSViewUp));
	return Intermediates;
}
```

この関数自体は，後続の処理のために頂点の色，座標を正規化する関数である．PCSでは，点のサイズを調節可能にするため，`Intermediates.TangentToWorld`を使って点を正方形に展開して4つの点として描画する（その正方形の辺の長さをエディタから`PointSize`として指定できるようにしている）．しかし，色については`Intermediates.Color`がそのままマテリアルに渡され，マテリアルはこれをリニアRGBとして解釈する．

> /** Interpolated vertex color, in linear color space. */
> half4 VertexColor;
> @Engine/Shaders/Private/MaterialTemplate.ush:433

PCSのシェーダーでは.plyに含まれる色情報をそのまま`Intermediates.Color`に代入していたがために，元データがsRGBだった場合に，本来暗いはずの部分がより明るい輝度でレンダリングされてしまっていた．UEのシェーダーでは`/Engine/Private/GammaCorrectionCommon.ush`に含まれる`sRGBToLinear`関数を使うことでsRGBからリニアRGBへ簡単に変換できる．

```glsl
FVertexFactoryIntermediates GetVertexFactoryIntermediates(FVertexFactoryInput Input)
{
	FVertexFactoryIntermediates Intermediates = (FVertexFactoryIntermediates)0;
	Intermediates.SceneData = VF_GPUSCENE_GET_INTERMEDIATES(Input);
	Intermediates.QuadCorner = Input.QuadCorner;
	Intermediates.PointPosition = Input.PointPosition;
	// VET_Color normalizes the bytes but does not decode the sRGB transfer curve.
	// Materials consume linear RGB; alpha is already linear and stays unchanged.
	Intermediates.Color = Input.PointColor;
	if (PCSConvertSRGBToLinear != 0)
	{
		Intermediates.Color.rgb = sRGBToLinear(Input.PointColor.rgb);
	}

	Intermediates.TangentToWorld[0] = normalize(PCSViewRight);
	Intermediates.TangentToWorld[1] = normalize(PCSViewUp);
	Intermediates.TangentToWorld[2] = normalize(cross(PCSViewRight, PCSViewUp));
	return Intermediates;
}
```

これによって色味がだいぶ良くなった．
![image](/ogp/ply-srgb.png)

解決したのは良いが，**色空間の情報というのは本来データ自体と一緒にメタデータとして付いてくるべきものである**．今はエディタ側で，入力PLYがsRGBかどうかのチェックボックスを用意しているが，sRGBかリニアRGBかというのはデータに依存しており，ユーザーの意思とは関係ないので，本来エディタで選ばせるものではない．
また，一般には点群データのほとんどがsRGBで生成されているが，BlenderではリニアRGBで出力する設定があるなど，リニアRGBの色空間で生成されたデータを入力する可能性はある．そうなった時に，.ply自体に色空間を指定するフィールドが存在しないというのはおかしな話である．フォーマット自体が古く，標準化団体での仕様策定を経て生まれたものでもなさそうなので仕方ないと言えばそれまでだが，BlenderやMitsubaなど，レンダラーがユーザーに真偽値で選択させているのを見ると，いささか冗長だなと思う次第である．
