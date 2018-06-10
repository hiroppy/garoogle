'use strict';

const { resolve } = require('path');
const { addEvents, modifyEvents, deleteEvents } = require('./garoon');
const CalendarAPI = require('@about_hiroppy/node-google-calendar');
const {
  getMeta,
  setMeta,
  setEvent,
  getEvent,
  updateEvent: updateDBEvent,
  deleteEvent: deleteDBEvent
} = require('./store');
const { private_key: key } = require(resolve(process.env.GOOGLE_API_KEY_FILE));

if (!key) {
  console.error('private key is empty');
  process.exit(1);
}

const calendarId = process.env.CALENDAR_ID;
const cal = new CalendarAPI({
  key,
  timezone: 'UTC+09:00',
  calendarId: {
    garoon: process.env.CALENDAR_ID
  },
  serviceAcctId: process.env.SERVICE_ACCT_ID
});

function createParams({
  private: isPrivate,
  startTime,
  endTime,
  summary,
  description,
  place: location
}) {
  return {
    start: { dateTime: new Date(startTime) },
    end: { dateTime: new Date(endTime) },
    visibility: isPrivate ? 'private' : undefined,
    summary,
    location,
    description
  };
}

/**
 * 予定のメンバーが複数人のときに、操作を許可するかどうか
 * SATEFYがtrueのときは、更新と削除はGoogle CalendarからGaroonへの変更は行わない
 */
function isAllow(data) {
  if (!Reflect.has(data, 'members')) return false;
  if (!process.env.SAFETY) return true;

  const { users } = JSON.parse(data.members);

  return users && users.length === 1 && users[0].id === process.env.GAROON_MY_ID;
}

/**
 * Google Calendarからwebhookを受けたときの処理(server.jsからemitされる)
 * `sync`と`exist`は同じ処理を行う
 */
async function refreshList(ee) {
  ee.on('onFetchList', async (headers) => {
    const meta = await getMeta();

    if (meta === null) return;

    const { nextSyncToken: syncToken, currentChannelId } = meta;

    if (headers.channelId !== currentChannelId) return;

    const { items, nextSyncToken } = await getList({ syncToken });

    // syncTokenが空の場合は処理を行わず、最後DBへの挿入のみとする
    if (syncToken !== null) {
      for (let i = 0; i < items.length; i++) {
        const { id: googleId, status, start, end, summary, description, visibility } = items[i];
        const data = await getEvent({ googleId });

        // 削除
        if (status === 'cancelled') {
          if (data && isAllow(data)) {
            try {
              await deleteEvents([data.garoonId]);
              await deleteDBEvent(data.id);
            } catch (e) {
              console.error(e);
            }
          }
          continue;
        }

        // DBスキーマ
        const schema = {
          summary,
          description,
          private: visibility === 'private',
          startTime: new Date(start.dateTime).getTime().toString(),
          endTime: new Date(end.dateTime).getTime().toString()
        };

        // Garoonへの投稿スキーマのベース
        const postedSchema = {
          detail: schema.summary,
          description: schema.description,
          publicType: schema.private ? 'private' : 'public',
          when: {
            datetimes: [
              {
                start: new Date(start.dateTime),
                end: new Date(end.dateTime)
              }
            ],
            dates: []
          }
        };

        // DBに存在しなければ、新規予定なので、DBへ追加しGaroonへ投稿
        if (data == null) {
          try {
            const [{ id: garoonId, members }] = await addEvents([
              {
                ...postedSchema,
                members: {
                  users: [
                    {
                      id: process.env.GAROON_MY_ID
                    }
                  ],
                  organizations: [],
                  facilities: []
                }
              }
            ]);

            await setEvent({
              ...schema,
              garoonId,
              googleId,
              members: JSON.stringify(members)
            });
          } catch (e) {
            console.error(e);
          }
        }

        // 存在すれば、以前から更新があるかの確認をし、上書きする
        // locationは使わない(garoon -> google calendarのみの適用)
        if (data && isAllow(data) && isUpdatedEvent(schema, data)) {
          try {
            await modifyEvents([
              {
                ...postedSchema,
                id: data.garoonId,
                members: JSON.parse(data.members)
              }
            ]);
            await updateDBEvent(schema, data.id);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    await setMeta({ nextSyncToken });
  });
}

async function getList(obj = {}) {
  return cal.Events.list(calendarId, obj);
}

async function postEvent(obj) {
  const params = createParams(obj);

  return cal.Events.insert(calendarId, params);
}

async function updateEvent(eventId, obj) {
  const params = createParams(obj);

  console.log(params);
  return cal.Events.update(calendarId, eventId, params);
}

async function deleteEvent(eventId) {
  return cal.Events.delete(calendarId, eventId, {});
}

async function watch(id) {
  return cal.Events.watch(
    calendarId,
    {
      id,
      type: 'web_hook',
      address: process.env.CALLBACK_URL
      // expiration: 1426325213000
    },
    {}
  );
}

async function stopChannel(id, resourceId) {
  return cal.Channels.stop({
    id,
    resourceId
  });
}

function isUpdatedEvent(e1, e2) {
  return (
    e1.startTime.toString() !== e2.startTime.toString() ||
    e1.endTime.toString() !== e2.endTime.toString() ||
    e1.private !== e2.private ||
    e1.summary != e2.summary ||
    e1.place != e2.place || // google calendarからの変更は受け入れたくない
    e1.description != e2.description // null or undefined
  );
}

module.exports = {
  getList,
  postEvent,
  updateEvent,
  deleteEvent,
  refreshList,
  watch,
  stopChannel,
  isUpdatedEvent
};
