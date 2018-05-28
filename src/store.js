'use strict';

const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: 'mysql',
    dialect: 'mysql',
    operatorsAliases: true,
    dialectOptions: {
      charset: 'utf8'
    }
  }
);

sequelize.sync();

const Meta = sequelize.define('meta', {
  latestEventsList: Sequelize.TEXT,
  nextSyncToken: Sequelize.STRING
});

const Events = sequelize.define(
  'events',
  {
    garoonId: Sequelize.STRING,
    googleId: Sequelize.STRING,
    startTime: Sequelize.STRING,
    endTime: Sequelize.STRING,
    summary: Sequelize.STRING,
    description: Sequelize.TEXT,
    private: Sequelize.BOOLEAN,
    members: Sequelize.TEXT
  },
  {
    charset: 'utf8'
  }
);

async function setEvent(q) {
  return Events.create(q);
}

async function getEvent(q) {
  const res = await Events.findOne({ where: q });

  return res ? res.dataValues : null;
}

async function updateEvent(q, id) {
  const res = await Events.update(q, { where: { id } });

  return res ? res.dataValues : null;
}

async function deleteEvent(id) {
  return Events.destroy({ where: { id } });
}

async function setMeta(q, type = 'update') {
  if (type === 'update') {
    return Meta.update(q, { where: { id: 1 } });
  } else if (type === 'create') {
    return Meta.create(q);
  }
}

async function getMeta() {
  const res = await Meta.findOne({ where: { id: 1 } });

  return res ? res.dataValues : null;
}

module.exports = {
  setEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  setMeta,
  getMeta
};
