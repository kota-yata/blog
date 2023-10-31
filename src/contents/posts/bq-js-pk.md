---
title: Node.jsのBigQuery APIから主キーを設定してテーブルを作成する
date: 2023-10-31
category: Programming
description: Googleのドキュメントが更新される気配がないので書く
---

今年の夏にBigQueryに主キー（Primary Key）が正式サポートされた。とは言っても他のデータベースに見られるようないわゆる主キーとは違ってオプショナルかつ重複やNULLも許可され、結合の最適化が主な目的だと思われる。主キーの詳細や使い方は[Google Cloudのブログ](https://cloud.google.com/blog/ja/products/data-analytics/join-optimizations-with-bigquery-primary-and-foreign-keys/)を参照。

今回タイトルにあるようにNode.jsのBQクライアントライブラリから主キーを設定しようとした動機としては、Storage Write APIでUpsertを行う際の制約がある。これもかなり最近のアップデートだが、[BigQueryのテーブルへのUpsert/Delete操作がStorage Write APIでPre-GAサポートされるようになった](https://cloud.google.com/bigquery/docs/change-data-capture)。ドキュメント内ではBigQuery CDCと呼ばれているこの機能を使えば、これまで基本的にInsertのみだったStorage Write APIの応用の幅が効くようになる。
しかし、BigQuery CDCを使用する際の要件として主キーの設定がある。

>To use BigQuery CDC, your workflow must meet the following conditions:
You must use the Storage Write API in the default stream.
**You must declare primary keys for the destination table in BigQuery**. Composite primary keys containing up to 16 columns are supported.
Your destination table in BigQuery must be clustered.
Sufficient BigQuery compute resources must be available to perform the CDC row operations. Be aware that if CDC row modification operations fail, you might unintentionally retain data that you intended to delete. For more information, see Deleted data considerations.

ダッシュボードから手動でテーブルを作る場合はスキーマを設定した後にクエリを叩いて主キーを設定すれば良いのだが、クライアントライブラリからプログラマブルにテーブルを作成し、主キーも同時に設定したい場合の手法がどこにも記載されていなかった。クライアントライブラリのソースコードから主キーを設定できるオプションのプロパティを見つけたので以下にそれを示す。

## テーブル作成のコード
```js
import { BigQuery } from '@google-cloud/bigquery';

export async function createTable(datasetId, tableId, schema) {
  const bigquery = new BigQuery();
  const options = {
    schema: schema,
    tableConstraints: {
      primaryKey: {
        columns: ['user_id']
      }
    }
  };
  const [table] = await bigquery.dataset(datasetId).createTable(tableId, options).catch((err) => {
    if (err.errors[0].reason === 'duplicate') {
      console.log(`Table ${datasetId}.${tableId} already exists`);
      return;
    }
    console.error(err.message, err.code);
    return;
  })
  console.log(`Table ${table.id} created`);
}
const schema = [
  { name: 'user_id', type: 'STRING' },
  { name: 'timestamp', type: 'TIMESTAMP' },
  { name: 'email', type: 'STRING' },
];
```

ポイントは`options`の`tableConstraints`。[nodejs-bigqueryリポジトリのsrc/types.d.tsの3860行目](https://github.com/googleapis/nodejs-bigquery/blob/e73f810e65180dfd8b13bb1bae5410413cb17cc5/src/types.d.ts#L3860)に定義がある`primaryKey`プロパティに値を入れることで主キーを設定することができる。BigQueryには主キーと同時に外部キーもサポートされており、この`tableConstraints`では`foreignKeys`の設定も可能になっている。

## おわりに
主キー&外部キーサポートはクエリ性能や結合性能がとても向上するっぽく、良い。

あとGoogleは早くこれをドキュメントにしてほしい。
