'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('member_details', 'reasonForContactChange', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('member_details', 'contactChangeUpdatedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('member_details', 'contactChangeUpdatedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('member_details', 'reasonForContactChange');
    await queryInterface.removeColumn('member_details', 'contactChangeUpdatedAt');
    await queryInterface.removeColumn('member_details', 'contactChangeUpdatedBy');
  }
};
