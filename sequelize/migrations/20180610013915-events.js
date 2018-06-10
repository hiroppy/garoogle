'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
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
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('events');
  }
};
