# Google Calendar の設定

## 必要な環境変数

`CALENDAR_ID`, `SERVICE_ACCT_ID`, `GOOGLE_API_KEY_FILE`

## Google API の利用設定

https://console.developers.google.com/cloud-resource-manager

1.  プロジェクトを作成
2.  認証情報のページへ行く https://console.developers.google.com/apis/credentials?project=xxxx
3.  認証情報を作成 -> サービスアカウントキー
4.  サービスアカウントを選択し、JSON でダウンロード
5.  `GOOGLE_API_KEY_FILE`のパスをこのファイルのパスへ変更

## カレンダーを作成する

https://calendar.google.com/calendar

1.  Garoon と同期されるカレンダーを用意する
2.  作ったら、左のサイドメニューのマイカレンダーからそのカレンダーの設定(設定と共有)を開く
3.  カレンダーの統合からカレンダー ID を取得
4.  `CALENDAR_ID`の名前を 3 で取得した名前にする(e.g. `xxx@group.calendar.google.com`)

以下の記事を参考にしてください。  
[Google カレンダー連携 - Garoon の予定を Google カレンダーに表示 -](https://developer.cybozu.io/hc/ja/articles/204426680-Google%E3%82%AB%E3%83%AC%E3%83%B3%E3%83%80%E3%83%BC%E9%80%A3%E6%90%BA-Garoon%E3%81%AE%E4%BA%88%E5%AE%9A%E3%82%92Google%E3%82%AB%E3%83%AC%E3%83%B3%E3%83%80%E3%83%BC%E3%81%AB%E8%A1%A8%E7%A4%BA-)
