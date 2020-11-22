---
title: "Eslint&Prettierとhuskyで幸せになろう！"
tags: [eslint,prettier,husky,pre-commit]
category: コーディング
date: 2020-08-15
excerpt: git commit時に自動でフォーマットする
---

![img](https://live.staticflickr.com/65535/50228712952_343e6e5a59_c.jpg)

PrettierやEslintを毎度毎度コマンドから動かしてフォーマットするのもかったるいので、huskyでコミット時に自動整形してくれるように設定したいと思います。eslintrc等はnpmモジュール用の設定で進めるのでご了承ください。

## 開発環境
パッケージ管理 : npm

OS : Mac OS

言語 : Node.js

## Eslintをインストールする
```
npm install eslint
```

## Eslint init
```
./node_modules/eslint/bin/eslint.js --init
```
ここで色々質問されるので、お好みで答えていきましょう。各質問の詳細は[こちらの記事](https://qiita.com/jobscale/items/eae90308ad885fa2c78c)がおすすめ

## Prettierをインストールする
```
npm install prettier eslint-config-prettier eslint-plugin-prettier --save-dev
```
## eslintrc.jsの設定
先ほどのeslint initで自動的に生成された.eslintrc.js(.eslint.json,.eslint.ymlnの場合もある)をPrettier用に設定します
```javascript
module.exports = {
  env: {
    commonjs: true,//requireを有効にする
    es6: true,//importを有効にする
    es2020: true,//最新のEcmaScriptを有効にする
    node: true,//Webアプリなどブラウザで使用するコードの場合はbrowser:true
    mocha: true,//テストでmochaを使う場合は追記しないとエラーが出る
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],//eslintとprettier両方を追加
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
    //eslintの設定
    indent: ['error', 2],//インデントはスペース2個分
    quotes: ['error', 'single'],//文字列はシングルクオート
    semi: ['error', 'always'],//セミコロンを必須に
    'linebreak-style': ['error', 'unix'],//改行スタイルをunixに
    'no-var': 'error',//varを使ったらエラー
    'prefer-const': 'error',//再代入のないconstはエラー
    'prefer-arrow-callback': 'error',//アロー関数でコールバック関数を書く
    //prettierの設定
    'prettier/prettier': [
      'error',
      {
        useTabs: false,//インデントはタブではなくスペース
        singleQuote: true,//文字列はシングルクオート
        semi: true,//セミコロン必須
        tabWidth: 2,//インデントはスペース2個分
        printWidth: 120,//一行は120文字まで
      },
    ],
  },
};
```
注意点としては、prettierとeslintでルールが競合してしまうとエラーが止まらなくなってしまうので必ずルールは矛盾させないこと。
## huskyとlint-stagedインストール
```
npm install husky lint-staged  --save-dev
```
でも良い
## husky,lint-stagedの初期設定
```
npx mrm lint-staged
```
## package.jsonの設定
```javascript
"lint-staged": {
    "*.js": [
      "prettier '**/*.{js,jsx,ts,tsx,vue}' --write",//js,jsx,ts,tsx,vueファイルを整形
      "eslint --fix"//eslintで全部整形(.eslintignoreを設定すれば対象外のファイルを指定できる)
    ]
},
"husky": {
  "hooks": {
    "pre-commit": "lint-staged"//commit時にlint-stagedを実行
  }
},
//prettierの設定
"prettier": {
  "useTabs": false,
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "printWidth": 120
},
```

---
もしこれでうまく動かないことがあれば、コメント欄で教えていただけると嬉しいです。

---
## 参考文献
https://stackoverflow.com/questions/50048717/lint-staged-not-running-on-precommit
https://qiita.com/berry99/items/d1ca66b477f48856256d
