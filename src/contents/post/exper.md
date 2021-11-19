---
title: "工業的製法と化合物生成アルゴリズム"
date: "2021-01-31"
category: "化学"
description: "アルゴリズムって言っとけばなんとなかなる"
ogp: "/ogp.jpeg"
---

何でもいいから物質を新たに合成するとき、時と場合によって製造方法が**工業的製法**と**実験室的製法**という2種類に分類される、というのを最近知りました。もうオリジナル性のかけらもない備忘録そのものですが、こうやって記事にしておけば記憶に定着するかもなという願いをこめて書き残しておきます。アルゴリズムの定義実はよく分かってないんだけど、「問題解決の方法や手順」という意味では物質の製造方法もアルゴリズムじゃね？と思ったのでタイトルに入れました。いやむしろ入れないと技術ブログではなくなってしまうのでやむをえず入れました。

### 工業的製法
例えばある物質を大量生産して売り捌いてビジネスとしてやっていきたい場合、学校の実験みたいにちまちま沸騰させたり液体たらしたりしてたらコストに見合わないわけです。もっとデカイ作業場を用意して、一発大爆発させて一気に大量生産して薄利多売したい。そこで用いられるのが工業的製法。
工業的製法の特徴としては、実験室的製法に比べて高い温度や圧力を使うことが多く、また製造過程で出た副産物をなるべく利用できるように設計されている点が挙げられます。メリットはもちろん大量生産できる点ですが、高温高圧が可能な環境を用意するコストと生成された物質の純度が一般的に低いことがデメリットです。別に大量生産したいわけでもないのに人里離れた場所に工場を用意するのは無駄ですよね。そこでもう一つの手段として考えられているのが実験室的製法です。

### 実験室的製法
実験室的製法はその名の通り、学校や研究の実験で用いられる物質の製法です。生成までのステップは工業的製法に比べると少なく（=単純）、全てに該当するわけではありませんが一般的に工業的製法よりも物質の純度が高いことが多いです。

# 代表的な工業的製法
工業的製法はしっかりステップ分けされてて文系にもわかりやすいものとか名前がかっこいい製法があって、なんとなくテンションが上がるよね。

## アンモニアソーダ法 (ソルべー法)
![アンモニアソーダ法のフローチャート](https://user-images.githubusercontent.com/51294895/106385384-6a915e00-6413-11eb-99ba-378ee91a4b43.png)
アンモニアソーダ法は1863年にベルギーの化学者[エルネスト・ソルべー](https://artsandculture.google.com/exhibit/QQ8X_Kko)が考案した、炭酸ナトリウム$\text{Na}_{2}\text{CO}_{3}$の生成アルゴリズムです。
### 手順
1. $\text{CaCO}_{3}$を熱分解して$\text{CaO}$と$\text{CO}_{2}$を用意する
$$
\text{CaCO}_{3}\rightarrow\text{CaO}+\text{CO}_{2}
$$
2. 塩化ナトリウムの飽和水溶液$\text{NaCl aq}$に1で取得した$\text{CO}_{2}$と$\text{NH}_{3}$を吹き込み、炭酸水素ナトリウムの沈殿$\text{NaHCO}_{3}$と$\text{NH}_{4}\text{Cl}$を生成する
$$
\text{NaCl} + \text{H}_{2}\text{O} + \text{NH}_{3} + \text{CO}_{2}\rightarrow\text{NaHCO}_{3} + \text{NH}_{4}\text{Cl}
$$
3. 1で取得した$\text{CaO}$を水に溶かし、$\text{Ca(OH)}_{2}$を生成する
$$
\text{CaO}+\text{H}_{2}\text{O}\rightarrow\text{Ca(OH)}_{2}
$$
4. 2で生成した$\text{NH}_{4}\text{Cl}$(弱塩基)と3で生成した$\text{Ca(OH)}_{2}$(強塩基)を反応させて遊離を起こし、$\text{CaCl}_{2}$と$\text{NH}_{3}$を生成する
$$
\text{Ca(OH)}_{2} + 2\text{NH}_{4}\text{Cl}\rightarrow\text{CaCl}_{2} + 2\text{NH}_{3} + 2\text{H}_{2}\text{O}
$$
5. 2で生成した$\text{NaHCO}_{3}$を熱分解して目的の$\text{Na}_{2}\text{CO}_{3}$と水と$\text{CO}_{2}$を生成する
$$
\text{NaHCO}_{3}\rightarrow\text{Na}_{2}\text{CO}_{3}+\text{H}_{2}\text{O}+\text{CO}_{2}
$$

### 特徴
このアルゴリズムは副産物を効率良く再利用している点が特徴です。手順4で生成した$\text{NH}_{3}$は手順2で吹き込む$\text{NH}_{3}$として再利用されます。また手順5で生成した$\text{H}_{2}\text{O}$は手順2の塩化ナトリウムの飽和水溶液に、$\text{CO}_{2}$は手順2で吹き込む$\text{CO}_{2}$として再利用されます。最終的に再利用されずに廃棄される物質は手順4で生成される$\text{CaCl}_{2}$だけということになります。

この製造方法を一つの式で表すと以下のようになります。

$$
2\text{NaCl} + \text{CaCO}_{3}\rightarrow\text{Na}_{2}\text{CO}_{3} + \text{CaCl}_{2}
$$

## 接触法
接触法は濃硫酸$\text{H}_{2}\text{SO}_{4}$を生成するアルゴリズムです。発案者は明確ではないらしく、Wikipediaには
> 1831年にイギリスの酢の商人Peregrine Phillipsにより特許が取得された

とだけ書かれています。
### 手順
1. 硫黄$S$を燃焼させ、二酸化硫黄$\text{SO}_{2}$を用意する
$$
\text{S}+\text{O}_{2}\rightarrow\text{SO}_{2}
$$
2. 1で取得した$\text{SO}_{2}$を、酸化バナジウム$\text{V}_{2}\text{O}_{5}$を触媒として酸化させ、三酸化硫黄$\text{SO}_{3}$を生成する
$$
2\text{SO}_{2}+\text{O}_{2}\overset{\text{V}_{2}\text{O}_{5}}\rightarrow2\text{SO}_{3}
$$
3. 2で生成した$\text{SO}_{3}$を濃硫酸に吸収させて発煙硫酸とし、これを希硫酸で薄めて濃硫酸$\text{H}_{2}\text{SO}_{4}$を生成する
$$
\text{SO}_{3}+\text{H}_{2}\text{O}\rightarrow\text{H}_{2}\text{SO}_{4}
$$

### 特徴
アンモニアソーダ法に比べると幾分かシンプルですね。最後に出てきた発煙硫酸というのは、$\text{SO}_{3}$ガスの白煙を発生させる、皮膚に触れるとバチクソにやけどするやつです。

## オストワルト法
オストワルト法とは、1902年にドイツの化学者[フリードリヒ・ヴィルヘルム・オストヴァルト](https://artsandculture.google.com/entity/wilhelm-ostwald/m0872h)が考案した、硝酸$\text{HNO}_{3}$生成アルゴリズムです。
### 手順
1. 白金$\text{Pt}$を触媒としてアンモニア$\text{NH}_{3}$を酸化させて一酸化窒素$\text{NO}$を用意
$$
4\text{NH}_{3}+5{O}_{2}\overset{\text{Pt}}\rightarrow\text{NO}
$$
2. 1で取得した$\text{NO}$を再び酸化させて二酸化窒素$\text{NO}_{2}$を生成
$$
2\text{NO}+\text{O}_{2}\rightarrow2\text{NO}_{2}
$$
3. 2で生成した$\text{NO}_{2}$を温水に吸収させ、硝酸$\text{HNO}_{3}$を生成する
$$
3\text{NO}_{2}+\text{H}_{2}\text{O}\rightarrow2\text{HNO}_{3}+\text{NO}
$$

## 特徴
これも接触法同様シンプルなアルゴリズムで、手順3で生成された$\text{NO}$が手順2で酸化させる$\text{NO}$として再利用可能になっていることが分かります。

# 終わりに
本気で化学の勉強をしてる人がこの記事にたどり着くことはないはずなのでまとめもクソもありませんが、他にもアンモニア$\text{NH}_{3}$を生成する[ハーバー・ボッシュ法](http://www.mech.nias.ac.jp/biomass/Haber1.htm)(三重結合で反応しにくい$N_{2}$を鉄を触媒として$H_{2}$と反応させるアルゴリズム)とかも勉強したので、試験まで覚えていられるようにがんばります。では