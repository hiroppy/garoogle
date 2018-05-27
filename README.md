# garoogle

GaroonからGoogle Calendarへ定期的に予定を更新するアプリケーションです。

## Feature
- 予定の追加・削除・変更 に対応

## Setup
```sh
$ git clone git@github.com:hiroppy/garoogle.git
$ cd garoogle
$ cp .env.sample .env # end edit
$ docker-compose up -d
```

## API
### health
`/api/health`