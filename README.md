# garoogle

Garoon と Google Calendar を双方向に同期します。

## Setup

```sh
$ git clone git@github.com:hiroppy/garoogle.git
$ cd garoogle
$ npm install --production
$ cp .env.sample .env # and edit
$ docker-compose up -d
```

Google Calendar の設定は[こちら](./docs/google-calendar.md)

## API

### health

`/api/health`
