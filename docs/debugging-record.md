# `includeArchived=false`でアーカイブ済みタスクが返る不具合のデバッグ記録

## 対象の不具合

`GET /tasks?includeArchived=false`では、アーカイブ済みではないタスクだけを返す契約です。しかし、バグ状態ではHTTPステータスが`200 OK`であるにもかかわらず、アーカイブ済みタスクもレスポンス配列に含まれます。`@Query()`の引数へ付けたTypeScriptの`boolean`型注釈を、実行時のHTTPクエリ文字列変換と誤認したことが直接の原因です。

| 項目 | 期待値 | バグ状態での実際値 |
| --- | --- | --- |
| HTTPステータス | `200 OK` | `200 OK` |
| `includeArchived=false`のレスポンス | アクティブな1件 | アクティブな1件とアーカイブ済み1件 |
| `includeArchived=true`のレスポンス | 2件 | 2件 |
| クエリ未指定時のレスポンス | アクティブな1件 | アクティブな1件 |

## 再現条件

バグを含むコミットは`e1405aa`です。

```bash
git checkout e1405aa
npm ci
npm run test:e2e
```

実行時に得たテスト出力は次のとおりです。

```text
Expected  - 0
Received  + 5

@@ -2,6 +2,11 @@
  Object {
    "archived": false,
    "id": "active-1",
    "title": "見積もりを確認する",
  },
+ Object {
+   "archived": true,
+   "id": "archived-1",
+   "title": "前月の報告書を送付する",
+ },
```

この失敗はテスト環境の起動やコンパイルではなく、HTTPレスポンス本文の期待値と実測値が異なるために発生しています。

## 調査

| 確認対象 | 観測結果 | 判断 |
| --- | --- | --- |
| 入力 | Supertestの`.query({ includeArchived: false })`で`GET /tasks?includeArchived=false`を送った | クライアントは`false`を明示している |
| 境界出力 | HTTPステータスは`200` | 通信成功だけではフィルター契約を満たしたとはいえない |
| 最終状態 | レスポンス配列に`archived: true`のタスクが残った | サービスはアーカイブを含める分岐を選んだ |
| 関連実装 | `@Query('includeArchived') includeArchived?: boolean`だけを指定していた | TypeScriptの型注釈だけでは実行時にクエリ文字列を変換しない |

NestJSの公式ドキュメントでは、パス引数およびクエリ引数は既定で文字列として到着し、明示的な変換には`ParseBoolPipe`を使えると説明されています。[NestJS Validation: Explicit conversion](https://docs.nestjs.com/techniques/validation)

## 原因

バグ状態のコントローラーは、`includeArchived`を`boolean`と宣言していました。しかし、その宣言はコンパイル時の型検査であり、HTTP入力を実行時に変換する処理ではありません。`false`は非空文字列としてサービスへ渡るため、`if (includeArchived)`は真になります。

```ts
@Get()
findAll(@Query('includeArchived') includeArchived?: boolean) {
  return this.tasksService.findAll(includeArchived);
}
```

## 修正

`DefaultValuePipe(false)`と`ParseBoolPipe`をクエリ引数にバインドしました。

```ts
@Get()
findAll(
  @Query('includeArchived', new DefaultValuePipe(false), ParseBoolPipe)
  includeArchived: boolean,
) {
  return this.tasksService.findAll(includeArchived);
}
```

`DefaultValuePipe`が引数未指定時の値を`false`にし、`ParseBoolPipe`がクエリ文字列を真偽値へ変換します。NestJSのパイプはコントローラーハンドラーの前に引数を変換または検証するため、無効な値はサービスに到達せず、`400 Bad Request`になります。[NestJS Pipes](https://docs.nestjs.com/pipes)

## 回帰確認

```bash
git checkout main
npm ci
npm run test:e2e
npm run build
```

修正コミットは`34fd274`です。`npm run test:e2e`は4件成功し、`npm run build`も成功しました。テストは`false`による除外、`true`による包含、クエリ未指定時の既定値、真偽値に変換できない入力の`400`を確認します。変更対象だけでなく、`true`を指定する既存の包含機能を維持していることも回帰範囲に含めています。

## 設計上の制約

このサンプルでは、`true`、`false`、未指定だけを公開契約にしています。`yes`、`1`、空文字、複数指定のクエリは互換性のために受け入れず、`ParseBoolPipe`による入力検証の対象とします。業務要件で別表記を受け入れる必要がある場合は、許容する入力をAPI仕様に明記したうえで専用のパイプを追加し、同じHTTP境界で回帰テストを増やします。
