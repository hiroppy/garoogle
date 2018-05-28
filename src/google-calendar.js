'use strict';

const { resolve } = require('path');
const { addEvents, modifyEvents, deleteEvents } = require('./garoon');
const CalendarAPI = require('@about_hiroppy/node-google-calendar');
const { setEvent, getEvent, updateEvent: updateDBEvent, getMeta, setMeta } = require('./store');
const { private_key: key } = require(resolve(process.env.GOOGLE_API_KEY_FILE));

if (!key) {
  console.error('private key is empty');
  process.exit(1);
}

const cal = new CalendarAPI({
  key,
  timezone: 'UTC+09:00',
  calendarId: {
    garoon: process.env.CALENDAR_ID
  },
  serviceAcctId: process.env.SERVICE_ACCT_ID
});
const calendarID = process.env.CALENDAR_ID;

function createParams({ startTime, endTime, summary, description }) {
  return {
    start: { dateTime: startTime },
    end: { dateTime: endTime },
    summary,
    description
  };
}

// catch as a webhook from server.js
async function refreshList(ee) {
  ee.on('sync', async () => {
    const meta = await getMeta();

    if (meta === null) return;

    const { nextSyncToken: syncToken } = meta;

    // fetch with syncToken
    const { items, nextSyncToken } = await require('./google-calendar').getList({ syncToken });

    // nullのときは処理をしない
    if (syncToken !== null) {
      for (let i = 0; i < items.length; i++) {
        const { id: googleId, status, start, end, summary, description, visibility } = items[i];

        const data = await getEvent({ googleId });

        // 削除
        if (status === 'cancelled') {
          try {
            if (process.env.IS_DELETED_EVENT_FROM_GOOGLE) await deleteEvents([data.garoonId]);
          } catch (e) {
            console.error(e);
          } finally {
            continue;
          }
        }

        const schema = {
          summary,
          description,
          private: visibility === 'private',
          startTime: new Date(start.dateTime).getTime(),
          endTime: new Date(end.dateTime).getTime()
        };

        // for garoon
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

        // 存在しなければ、新規予定なので、DBへ追加しGaroonへ投稿
        if (data == null) {
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
        }

        // 更新があるか確認する
        if (data && isUpdatedEvent(schema, data)) {
          await modifyEvents([
            {
              ...postedSchema,
              id: data.garoonId,
              members: JSON.parse(data.members)
            }
          ]);
          await updateDBEvent(schema, googleId);
        }
      }
    }

    await setMeta({ nextSyncToken });
  });
}

async function getList(obj = {}) {
  return cal.Events.list(calendarID, obj);
}

async function postEvent(obj) {
  const params = createParams(obj);

  return cal.Events.insert(calendarID, params);
}

async function updateEvent(eventID, obj) {
  const params = createParams(obj);

  return cal.Events.update(calendarID, eventID, params);
}

async function deleteEvent(eventID) {
  return cal.Events.delete(calendarID, eventID, {});
}

function isUpdatedEvent(e1, e2) {
  return (
    e1.startTime.toString() !== e2.startTime.toString() ||
    e1.endTime.toString() !== e2.endTime.toString() ||
    e1.private !== e2.private ||
    e1.summary != e2.summary ||
    e1.description != e2.description // null or undefined
  );
}

module.exports = {
  getList,
  postEvent,
  updateEvent,
  deleteEvent,
  refreshList,
  isUpdatedEvent
};
