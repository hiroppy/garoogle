'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('meta', {
      latestEventsList: Sequelize.TEXT,
      nextSyncToken: Sequelize.STRING,
      resourceId: Sequelize.STRING,
      currentChannelId: Sequelize.STRING
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('meta');
  }
};
