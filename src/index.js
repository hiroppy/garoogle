'use strict';

// for garoon
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

// validate
if (
  !process.env.USERNAME ||
  !process.env.PASSWORD ||
  !process.env.URL ||
  !process.env.CALENDAR_ID ||
  !process.env.SERVICE_ACCT_ID ||
  !process.env.GOOGLE_API_KEY_FILE
) {
  console.error('argument error');
  process.exit(1);
}

const { promisify } = require('util');
const redis = require('redis');
const cron = require('node-cron');
const xor = require('lodash.xor');
const { getEvents, formatSchema } = require('./garoon');
const { postEvent, updateEvent, deleteEvent } = require('./google-calendar');

require('./server');

const client = redis.createClient('6379', 'redis');
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

cron.schedule(process.env.CRON, async () => {
  await startTasks();
});

startTasks();

async function startTasks() {
  console.log(`${new Date()} fetching...`);

  const res = await getEvents();
  const idList = [];

  for (let i = 0; i < res.length; i++) {
    const event = res[i];
    const schema = formatSchema(event);

    if (schema === null) continue;

    const { id: garoonID } = event;
    const item = await getAsync(garoonID);

    idList.push(garoonID);

    if (item === null) {
      // insert
      const { id: calendarID } = await postEvent(schema);

      await setItemToRedis(garoonID, {
        ...schema,
        calendarID
      });
    } else {
      const data = JSON.parse(item);

      // update
      if (
        new Date(data.startTime).toString() !== schema.startTime.toString() ||
        new Date(data.endTime).toString() !== schema.endTime.toString() ||
        data.summary !== schema.summary ||
        data.description !== schema.description
      ) {
        const { calendarID } = data;

        await updateEvent(calendarID, schema);
        await setItemToRedis(garoonID, {
          ...schema,
          calendarID
        });
      }
    }
  }

  // 直前の取得したイベントのIDが入った配列
  const latestList = await getAsync('latestList');

  // 削除されたかどうかは一度処理を上で終わらせる必要がある(削除されたキーはforで回らないため)
  // 1. latestListにIDがないが、idListの中にあれば、追加された予定 (上記で処理が行われるため無視)
  // 2. latestListにIDがあるが、idListの中になければ、削除された予定
  if (latestList) {
    const orphans = xor(JSON.parse(latestList), idList);

    for (let i = 0; i < orphans.length; i++) {
      const id = orphans[i];

      // 2
      if (!idList.includes(id)) {
        const { calendarID } = JSON.parse(await getAsync(id));

        await deleteEvent(calendarID);
        await delAsync(id);
      }
    }
  }

  await setAsync('latestList', JSON.stringify(idList));
}

async function setItemToRedis(key, value) {
  await setAsync(key, JSON.stringify(value));
}

process.on('unhandledRejection', (err) => {
  console.error(err);
});
