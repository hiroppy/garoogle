'use strict';

const { resolve } = require('path');
const CalendarAPI = require('node-google-calendar');
const { private_key: key } = require(resolve(process.env.GOOGLE_API_KEY_FILE));

if (!key) throw new Error('empty');

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

module.exports = {
  postEvent,
  updateEvent,
  deleteEvent
};
