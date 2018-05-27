# garoogle

Garoon から Google Calendar へ定期的に予定を更新するアプリケーションです。

## Feature

* 予定の追加・削除・変更 に対応

## Setup

```sh
$ git clone git@github.com:hiroppy/garoogle.git
$ cd garoogle
$ cp .env.sample .env # end edit
$ docker-compose up -d
```

Google Calendar の設定は[こちら](./docs/google-calendar.md)

## API

### health

`/api/health`
