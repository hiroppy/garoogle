'use strict';

// for Garoon
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

// validate
if (
  !process.env.GAROON_URL ||
  !process.env.GAROON_MY_ID ||
  !process.env.GAROON_MY_NAME ||
  !process.env.GAROON_MY_PASSWORD ||
  !process.env.CALENDAR_ID ||
  !process.env.SERVICE_ACCT_ID ||
  !process.env.GOOGLE_API_KEY_FILE ||
  !process.env.MYSQL_ROOT_PASSWORD ||
  !process.env.MYSQL_DATABASE ||
  !process.env.MYSQL_USER ||
  !process.env.MYSQL_PASSWORD
) {
  console.error('引数が足りません。');
  process.exit(1);
}

const { EventEmitter } = require('events');
const { CronJob } = require('cron');
const xor = require('lodash.xor');
const { getEvents, getFacilities, formatSchema } = require('./garoon');
const { init: initServer, updateLastUpdated } = require('./server');
const {
  postEvent,
  updateEvent,
  deleteEvent,
  refreshList,
  isUpdatedEvent
} = require('./google-calendar');
const {
  setEvent,
  getEvent,
  updateEvent: updateDBEvent,
  deleteEvent: destroyEvent,
  getMeta,
  setMeta
} = require('./store');

const ee = new EventEmitter();

initServer(ee);

// Google Calendarからのwebhookを受け取ったときの処理
if (process.env.CALLBACK_URL) refreshList(ee);

new CronJob(
  process.env.CRON,
  async () => {
    await run();
  },
  null,
  true
);

run();

async function run() {
  console.log(`${new Date()} fetching...`);

  const res = await getEvents();
  const idList = [];

  for (let i = 0; i < res.length; i++) {
    const event = res[i];
    const schema = formatSchema(event);

    if (schema === null) continue;

    const { id: garoonId } = event;
    const item = await getEvent({ garoonId });

    idList.push(garoonId);

    if (item === null) {
      // insert
      const place = schema.place ? await getFacilities([schema.place]) : undefined;

      // DBには場所のIDしかいれたくないため、schema.placeの上書きはしない。
      const { id: googleId } = await postEvent({
        ...schema,
        place
      });

      await setEvent({
        ...schema,
        googleId,
        garoonId
      });
    } else {
      // update
      if (isUpdatedEvent(item, schema)) {
        const { googleId, id } = item;
        const place = schema.place ? await getFacilities([schema.place]) : undefined;

        // DBには場所のIDしかいれたくないため、schema.placeの上書きはしない。
        await updateEvent(googleId, {
          ...schema,
          place
        });
        await updateDBEvent(schema, id);
      }
    }
  }

  // 直前の取得したイベントのIDが入った配列
  const meta = await getMeta();

  // 削除されたかどうかは一度処理を上で終わらせる必要がある(削除されたキーはforで回らないため)
  // 1. latestListにIDがないが、idListの中にあれば、追加された予定 (上記で処理が行われるため無視)
  // 2. latestListにIDがあるが、idListの中になければ、削除された予定
  if (meta) {
    const orphans = xor(JSON.parse(meta.latestEventsList), idList);

    for (let i = 0; i < orphans.length; i++) {
      const garoonId = orphans[i];

      if (idList.includes(garoonId)) continue;

      // 2
      const item = await getEvent({ garoonId });

      if (!item) continue;

      const { id, googleId, endTime } = item;

      if (endTime < new Date().getTime()) continue;

      try {
        await deleteEvent(googleId);
      } catch (e) {
        if (JSON.parse(e.message).error.statusCode !== '410(Gone)') throw e;
      } finally {
        await destroyEvent(id);
      }
    }
  }

  await setMeta({ latestEventsList: JSON.stringify(idList) }, meta === null ? 'create' : 'update');
  updateLastUpdated(new Date().toLocaleString('ja', { timeZone: 'Asia/Tokyo' }));
}

process.on('unhandledRejection', (err) => {
  console.error(err);
});
