'use strict';

const GaroonSoap = require('garoon-soap');

const garoon = new GaroonSoap(process.env.URL, process.env.USERNAME, process.env.PASSWORD);
const ignoredPlans = process.env.PLAN_FILTER.split(',').map((s) => s.trim());

async function getEvents() {
  const start = new Date();
  const end = new Date();

  end.setDate(start.getDate() + process.env.TERM || 30);

  const res = await garoon.schedule.getEvents(start, end);

  return res.filter((e) => !ignoredPlans.includes(e.plan));
}

function formatSchema(event) {
  const { when, plan } = event;

  let startTime, endTime;

  if (plan === '休み' || when === undefined) return null;

  // TODO: なんで配列なのか調べてないので、とりあえず0番目だけ
  if (when.dates.length !== 0) {
    // 一日以上予定
    startTime = when.dates[0].start;
    endTime = when.dates[0].end;
  } else if (when.datetimes.length !== 0) {
    // 時間指定
    startTime = when.datetimes[0].start;
    endTime = when.datetimes[0].end;
  }

  return {
    startTime,
    endTime,
    summary: event.plan ? `${event.plan}: ${event.detail}` : event.detail,
    description: event.description
  };
}

module.exports = {
  getEvents,
  formatSchema
};
