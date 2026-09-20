---
title: Consenseの体験をObsidianに持ってくる
date: 2026-09-20
category: Computer
description: ありがとうConsense，こんにちはObsidian
ogp: obsinc
---

[Gyazoインシデントの件](https://corp.helpfeel.com/news/news-20260916-1)で，（一時的かもしれないが）Consenseに上げていた全ての画像が見えなくなった．これまでConsenseを6年ほど使って，合計3000ページ以上作ってきており，ほとんど自分の外部的な脳と言っても過言ではなかった．今回は画像だったのでまだ良かったが，Consense自体がサービス停止した場合，日常の作業，特に研究活動に非常に大きな影響が出る．今回のような情報漏洩でページの内容が漏れると尚更である．またそうなった時にConsenseを責めることしかできず，自分で責任を取ることができないというのもまた問題である．

というわけで，Obsidianをセルフホストしつつ，Consenseの体験をできるだけ引き継ぐために諸々の環境構築をしていく．

## データの移行
[blu3mo/ScrapboxToObsidian](https://github.com/blu3mo/ScrapboxToObsidian)でエクスポートしたJSONを変換し，出力されたディレクトリでObsidianのVaultを作成し完了．

## セルフホスト&複数端末同期
前提として，Obsidian純正の同期機構は基本的にObsidianのクラウドサーバーにデータをアップロードする形式である．ローカルのVaultも保持されるのでサービスが止まったら終わりというわけではないが，やはり自分で全てを管理したい気持ちなのでこれは使わない（将来的にconfidentialな情報もメモる予定なので第三者サーバーは避けたいというモチベーションもある）．

サーバーをセルフホストして複数端末同期する方法として[vrtmrz/obsidian-livesync](https://github.com/vrtmrz/obsidian-livesync)というプラグインを使うことにした．これはCouchDB，もしくはS3などのオブジェクトストレージにObsidianのページデータを保持し，HTTPでクライアントと同期するプラグインである．クライアント端末では軽量なPouchDBが動作し，[REST API](https://docs.couchdb.org/en/stable/api/database/bulk-api.html)でCouchDBなどと同期を行ってくれる．プラグインはクライアント端末のVaultとCouchDBの同期や暗号化などを担う．同期についての詳細は[LiveSyncのドキュメント](https://github.com/vrtmrz/obsidian-livesync/blob/main/docs/tech_info.md)を読むと良い．
![flowchart of obsidian self-host](/media/obsinc-flowchart-without-diary.png)

研究室のサーバーは他の学生も使っているので，これのために80/tcpと443/tcpを占有することはできない．そこで，上の構成図のように今回は，自分が持っているドメインのA/AAAAレコードを研究室サーバーに向け，nginxでserver_nameでのルーティングをすることにした．

## 日記の自動生成
ConsenseではカスタムJavaScriptを書くことができた．自分の場合は[pin-diary](https://scrapbox.io/villagepump/pin-diary-4)で日記を自動生成するというのをやっていて，非常に重宝していた．

ObsidianにもDaily Notesという機能があるが，MacとiPhone両方でTemplaterを追加して同じ設定をし，なおかつ同じ日にMacとiPhoneでObsidianを開くたびに小さな競合を発生させるというのは中々嬉しくないデザインである．そこで今回はサーバー側で日記のMarkdownを毎日自動生成し，[vrtmrz/livesync-bridge](https://github.com/vrtmrz/livesync-bridge)でVaultと同期をとってもらうことにした．日記はpin-diary同様前後の日付やn年前の同じ日付とリンクするようにCodexにパパッと書いてもらった．勝手に閏年も考慮してくれてアツい．

```python
import argparse
from datetime import date, datetime, timedelta
from pathlib import Path
import os
import tempfile
from zoneinfo import ZoneInfo

def previous_year(day: date, years: int) -> date:
    try:
        return day.replace(year=day.year - years)
    except ValueError:
        # February 29 links to February 28 in non-leap years.
        return day.replace(year=day.year - years, day=28)

def render(day: date, folder: Path, years: int) -> str:
    def label(value: date) -> str:
        return f"{value.year:04d}/{value.month:02d}/{value.day:02d}"

    def link(value: date) -> str:
        text = label(value)
        target = (folder / text).as_posix()
        return f"[[{target}|{text}]]"

    lines = [label(day), "", "今日のn年前"]
    lines.extend(
        f"- {link(previous_year(day, n))}" for n in range(1, years + 1))
    lines.extend([
        "", "",
        f"{link(day - timedelta(days=1))}←{label(day)}→{link(day + timedelta(days=1))}",
        "",
    ])
    return "\n".join(lines)

def create_note(target: Path, content: str) -> bool:
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=target.parent,
            prefix=".diary-", suffix=".tmp", delete=False,
        ) as stream:
            temporary = Path(stream.name)
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        try:
            os.link(temporary, target)
        except FileExistsError:
            return False
        return True
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vault", required=True, type=Path)
    parser.add_argument("--folder", default="Diary", type=Path)
    parser.add_argument("--date", type=date.fromisoformat, help="Override date: YYYY-MM-DD")
    parser.add_argument("--years", type=int, default=4, help="Years to link (default: 4)")
    parser.add_argument("--dry-run", action="store_true", help="Print note without writing files")
    args = parser.parse_args()
    day = args.date or datetime.now(ZoneInfo("Asia/Tokyo")).date()
    if args.folder.is_absolute() or ".." in args.folder.parts:
        parser.error("--folder must be a relative path within the vault")
    if any(char in args.folder.as_posix() for char in "[]|#^\\\n\r"):
        parser.error("--folder contains characters unsupported in wiki links")
    if args.years < 0 or args.years >= day.year:
        parser.error("--years must be nonnegative and smaller than the note's year")
    if day in (date.min, date.max):
        parser.error("--date must allow both a previous and a next day")
    vault = args.vault.expanduser().resolve()
    folder = (vault / args.folder).resolve()
    if not folder.is_relative_to(vault):
        parser.error("--folder resolves outside the vault")
    target = folder / f"{day.year:04d}" / \
        f"{day.month:02d}" / f"{day.day:02d}.md"
    if not target.resolve().is_relative_to(vault):
        parser.error("note path resolves outside the vault")
    content = render(day, args.folder, args.years)
    if args.dry_run:
        print(content, end="")
        return
    created = create_note(target, content)
    print(f"{'Created' if created else 'Skipped (already exists)'}: {target}")

if __name__ == "__main__":
    main()

```

構成は以下のように変わった:
![flowchart of obsidian self host with diary generation](/media/obsinc-flowchart.png)

## Webクライアント
日記生成だけなら，実はLiveSync Bridgeを使う必要はない．[@vrtmrz/livesync-commonlib](https://github.com/vrtmrz/livesync-commonlib)の`DirectFileManipulator`を叩けばCouchDBに直接書き込みを行える．ただ，ここでわざわざ別のVaultを作ったのはWebクライアントを建てるためである．

[Ignis](https://github.com/Nystik-gh/ignis)というObsidianのWebクライアントのOSSプロジェクトがある．Consenseの良かったところとしてWebでどこからでもアクセスでき，かつ，ネットサーフィン中に別アプリを立ち上げずすぐにメモが取れた点がある（クラウドサービスなので当たり前と言えば当たり前だが）．Ignisも当然セルフホストができるので同様に研究室のサーバーに置こうと考えたが，これをクライアントとして配置するとLiveSync on Ignisをやる必要がある．Ignisはプラグインに対応しているが，[LiveSyncについては若干不安定な感じ](https://github.com/Nystik-gh/ignis/issues/9)なので，今回は，BridgeでCouchDBと同期しつつ，日記自動生成とIgnisの参照元を兼ねたVaultをサーバーに置こうという意思決定になった．Ignisのホスティングについても，これまた別のサブドメインのレコードを研究室サーバーに向けnginxで捌くようにした．

Ignisを加えた構成は以下の通り
![flowchart of obsidian selfhost with ignis](/media/obsinc-flowchart-with-ignis.png)

IgnisホストのログインはGoogleアカウントにした．新しいマシンからのGoogleログインというのはパスキーがないので面倒なんだけどまあそういうのは今は気にしない．

![Ignis working on the web](/media/obsinc-web.png)
Webからも見えている！万歳🙌

このプロジェクトの多くは[@vorotamoroz](https://x.com/vorotamoroz)氏のプラグイン，それを取り巻くソフトウェアが無ければ100倍の時間がかかっていたと思う．本当にありがとうございます．
