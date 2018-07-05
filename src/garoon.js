'use strict';

const GaroonSoap = require('garoon-soap');

const garoon = new GaroonSoap(
  process.env.GAROON_URL,
  process.env.GAROON_MY_NAME,
  process.env.GAROON_MY_PASSWORD
);
const ignoredPlans = process.env.PLAN_FILTER.split(',').map((s) => s.trim());

async function getEvents() {
  const start = new Date();
  const end = new Date();

  end.setDate(start.getDate() + (Number(process.env.TERM) || 30));

  const res = await garoon.schedule.getEvents(start, end);

  if (res == undefined) return null;
  return res.filter((e) => !ignoredPlans.includes(e.plan));
}

async function addEvents(arr) {
  return garoon.schedule.addEvents(arr);
}

/*
{ id: '4226798',
  eventType: 'normal',
  version: '1527403075',
  publicType: 'private',
  plan: '外出',
  detail: 'Title',
  description: undefined,
  timezone: 'Asia/Tokyo',
  endTimezone: 'Asia/Tokyo',
  allday: false,
  startOnly: false,
  members: { users: [Array], organizations: [], facilities: [] },
  observers: { users: [], organizations: [], roles: [] },
  when: { datetimes: [Array], dates: [] },
  follows: [],
  files: [],
  removeFileIds: [] },
*/
async function modifyEvents(arr) {
  return garoon.schedule.modifyEvents(arr);
}

async function deleteEvents(arr) {
  return garoon.schedule.removeEvents(arr);
}

async function getFacilities(ids) {
  const places = await garoon.schedule.getFacilitiesById(ids);

  if (places.length) return '';

  return places[0].name;
  // return places.map((e) => e.name);
}

function formatSchema(event) {
  const { when, plan, publicType, description, members } = event;
  let startTime, endTime, place;

  // TODO: wip
  if (event.eventType === 'repeat') {
  }

  if (when === undefined) return null;

  // TODO: なんで配列なのか調べてないので、とりあえず0番目だけ
  if (when.dates.length !== 0) {
    // 一日以上の予定
    startTime = when.dates[0].start;
    endTime = when.dates[0].end;
  } else if (when.datetimes.length !== 0) {
    // 時間指定された予定
    startTime = when.datetimes[0].start;
    endTime = when.datetimes[0].end;
  }

  // place
  // TODO: とりあえず一番プライオリティが高い0番目のみ
  if (Array.isArray(members.facilities)) {
    const placeInfo = members.facilities[0];

    if (placeInfo) place = placeInfo.id;
  }

  const summary = `${event.plan ? `${event.plan}: ${event.detail}` : event.detail}`.trim();

  return {
    summary,
    place,
    description,
    startTime: new Date(startTime).getTime(),
    endTime: new Date(endTime).getTime(),
    members: JSON.stringify(event.members),
    private: publicType === 'private'
  };
}

module.exports = {
  getEvents,
  addEvents,
  modifyEvents,
  deleteEvents,
  getFacilities,
  formatSchema
};
