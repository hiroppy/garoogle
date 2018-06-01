'use strict';

const { randomBytes } = require('crypto');
const { CronJob } = require('cron');
const { watch, stopChannel } = require('./google-calendar');
const { getMeta, setMeta } = require('./store');

new CronJob(
  '0 0 0 * * *',
  async () => {
    await startTasks();
  },
  null,
  true
);

startTasks();

async function startTasks() {
  const channelId = randomBytes(10).toString('hex');

  try {
    const { id, resourceId } = await watch(channelId);
    const meta = await getMeta();

    await setMeta(
      {
        resourceId,
        currentChannelId: id
      },
      meta === null ? 'create' : 'update'
    );

    // await stopChannel();
    // require('./google-calendar').stopChannel(
    //   req.headers['x-goog-channel-id'],
    //   req.headers['x-goog-resource-id']
    // );
  } catch (e) {
    console.error(e);
  }
}
