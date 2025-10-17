'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Insert a row into the series table
    await queryInterface.bulkInsert('series', [
      {
        seriesName: 'loanIdGL',
        nextNumber: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Get all member_details records where branchManagerStatus='disbursed' and loanType='JLG Loan'
    const members = await queryInterface.sequelize.query(
      `SELECT md.id, md.fieldManagerId, mc.branchId, b.branchCode 
       FROM member_details md 
       JOIN manager_credentials mc ON md.fieldManagerId = mc.id 
       JOIN branch b ON mc.branchId = b.id 
       WHERE md.branchManagerStatus = 'disbursed' AND md.loanType = 'JLG Loan'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Update each member's loanId
    for (const member of members) {
      // Get the next number from the series
      const seriesResult = await queryInterface.sequelize.query(
        `SELECT nextNumber FROM series WHERE seriesName = 'loanIdGL'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (seriesResult.length > 0) {
        const nextNumber = seriesResult[0].nextNumber;
        
        // Format the loanId: 1111 + branchCode + GL + padded nextNumber
        const loanId = `1111${member.branchCode}GL${String(nextNumber).padStart(4, "0")}`;
        
        // Update the member's loanId
        await queryInterface.sequelize.query(
          `UPDATE member_details SET loanId = ? WHERE id = ?`,
          { 
            replacements: [loanId, member.id],
            type: Sequelize.QueryTypes.UPDATE
          }
        );
        
        // Increment the nextNumber in the series
        await queryInterface.sequelize.query(
          `UPDATE series SET nextNumber = nextNumber + 1 WHERE seriesName = 'loanIdGL'`,
          { type: Sequelize.QueryTypes.UPDATE }
        );
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove the inserted row from series
    await queryInterface.bulkDelete('series', { seriesName: 'loanIdGL' }, {});
    
    // Reset loanId for affected records
    await queryInterface.sequelize.query(
      `UPDATE member_details SET loanId = NULL 
       WHERE branchManagerStatus = 'disbursed' AND loanType = 'JLG Loan'`,
      { type: Sequelize.QueryTypes.UPDATE }
    );
  }
};
