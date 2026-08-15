# NestJS Query Boolean Lab

`GET /tasks?includeArchived=false`でアーカイブ済みタスクまで返してしまう不具合を、NestJSとTypeScriptで再現し、修正する最小プロジェクトです。

## 不具合の概要

`@Query('includeArchived') includeArchived?: boolean`と型注釈を付けただけでは、HTTPクエリ文字列は実行時に真偽値へ変換されません。そのため、`false`は非空文字列の`'false'`としてサービスへ渡り、条件式ではtruthyになります。

| リクエスト | 期待するタスク数 | バグ状態のタスク数 | 修正後のタスク数 |
| --- | ---: | ---: | ---: |
| `GET /tasks?includeArchived=false` | 1 | 2 | 1 |
| `GET /tasks?includeArchived=true` | 2 | 2 | 2 |
| `GET /tasks` | 1 | 1 | 1 |

## 前提条件

Node.js 22以上とnpmを使用します。このリポジトリはNode.js 22.13.0で検証しています。

```bash
git clone https://github.com/tonbiattack/nestjs-query-boolean-lab.git
cd nestjs-query-boolean-lab
npm install
```

## バグを再現する

バグ再現コミットでは、`includeArchived=false`を指定してもアーカイブ済みタスクが返り、E2Eテストが失敗します。

```bash
git checkout e1405aa
npm ci
npm run test:e2e
```

期待値はアクティブな1件だけですが、実測値にはアーカイブ済みの1件も含まれます。

```text
Expected: [active task]
Received: [active task, archived task]
```

## 修正内容

コントローラーのクエリ引数に、`DefaultValuePipe(false)`と`ParseBoolPipe`をこの順で指定します。

```ts
@Query('includeArchived', new DefaultValuePipe(false), ParseBoolPipe)
includeArchived: boolean,
```

`DefaultValuePipe`が未指定時の値を`false`にし、`ParseBoolPipe`が`'true'`または`'false'`を真偽値に変換します。変換できない値はコントローラーの実行前に`400 Bad Request`になります。

## 修正後を検証する

```bash
git checkout main
npm ci
npm run test:e2e
npm run build
```

E2Eテストは、`false`、`true`、未指定、無効値の4ケースをHTTP境界で確認します。詳細な観測結果は[docs/debugging-record.md](docs/debugging-record.md)を参照してください。

## 制約

このプロジェクトは、Expressアダプターを使うHTTP APIのクエリ引数だけを対象にしています。データベース、認証、GraphQL、WebSocket、マイクロサービスの入力変換は扱いません。

## 参考資料

- [NestJS Documentation: Validation - Explicit conversion](https://docs.nestjs.com/techniques/validation)
- [NestJS Documentation: Pipes](https://docs.nestjs.com/pipes)
